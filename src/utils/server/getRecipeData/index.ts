import fs from "node:fs";
import nodePath from "node:path";
import {
	getNumericValue,
	Parser,
	type Ingredient as CooklangIngredient,
	type Item as CooklangItem,
	type Quantity as CooklangQuantity,
	type ScaledRecipeWithReport,
	type Value as CooklangValue,
} from "@cooklang/cooklang";

type CooklangRecipe = ScaledRecipeWithReport["recipe"];
import matter from "gray-matter";

export interface RecipeMetadata {
	title: string;
	servings?: number | string;
	time?: string;
	total_time?: string;
	prep_time?: string;
	cook_time?: string;
	source?: string;
	description?: string;
	author?: string;
	tags?: string[];
	[key: string]: unknown;
}

export interface FlatTextItem {
	type: "text";
	value: string;
}

export interface FlatIngredientItem {
	type: "ingredient";
	name: string;
	quantity: number | string;
	units: string;
}

export interface FlatCookwareItem {
	type: "cookware";
	name: string;
}

export interface FlatTimerItem {
	type: "timer";
	quantity: number | string;
	units: string;
}

export type FlatItem =
	| FlatTextItem
	| FlatIngredientItem
	| FlatCookwareItem
	| FlatTimerItem;

// The recipe author omits Cooklang's `%unit` separator (e.g. `{575g}` not
// `{575%g}`), so the parser can't split quantity from unit - it hands back
// the whole thing as opaque text. Preserved as-is (a single string) rather
// than parsed apart, matching the old parser's behavior exactly.
function flattenValue(value: CooklangValue): number | string {
	switch (value.type) {
		case "text":
			return value.value;
		case "range": {
			const start = getNumericValue({
				type: "number",
				value: value.value.start,
			});
			const end = getNumericValue({ type: "number", value: value.value.end });
			return `${start}-${end}`;
		}
		case "number":
			return getNumericValue(value) ?? 0;
	}
}

// No quantity (e.g. "a pinch of salt") is flattened to the sentinel string
// "some", matching the old parser - callers (Ingredients' filter) rely on it.
function flattenQuantity(quantity: CooklangQuantity | null): {
	quantity: number | string;
	units: string;
} {
	if (!quantity) {
		return { quantity: "some", units: "" };
	}

	return { quantity: flattenValue(quantity.value), units: quantity.unit ?? "" };
}

function toFlatIngredient(ingredient: CooklangIngredient): FlatIngredientItem {
	return {
		type: "ingredient",
		name: ingredient.name,
		...flattenQuantity(ingredient.quantity),
	};
}

// Ingredient/cookware/timer items only carry an index into the recipe's
// top-level ingredients/cookware/timers arrays - resolve it back to a flat,
// self-contained item so Steps doesn't need to know about the indirection.
function resolveItem(item: CooklangItem, recipe: CooklangRecipe): FlatItem {
	switch (item.type) {
		case "text":
			return { type: "text", value: item.value };
		case "ingredient":
			return toFlatIngredient(recipe.ingredients[item.index]);
		case "cookware":
			return { type: "cookware", name: recipe.cookware[item.index].name };
		case "timer":
			return {
				type: "timer",
				...flattenQuantity(recipe.timers[item.index].quantity),
			};
		case "inlineQuantity": {
			// Bare measurements in prose (e.g. "23cm"), not tied to an
			// ingredient/timer - the old parser left these as plain text,
			// so re-render them as text rather than as a scalable amount.
			const { quantity, units } = flattenQuantity(
				recipe.inline_quantities[item.index],
			);
			return { type: "text", value: `${quantity}${units}` };
		}
	}
}

// Reused across every getRecipeData call - the WASM module only needs to be
// instantiated once, not once per recipe file.
const parser = new Parser();

function titleFromFilename(filePath: string) {
	return nodePath
		.basename(filePath, nodePath.extname(filePath))
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

// Recipe frontmatter is hand-written YAML with no schema, so a recipe can be
// missing a title (or have a typo'd key). Fall back to a derived title
// instead of shipping "undefined" as a heading, and warn so it gets noticed.
function toRecipeMetadata(
	data: Record<string, unknown>,
	filePath: string,
): RecipeMetadata {
	if (typeof data.title === "string" && data.title.trim() !== "") {
		return data as RecipeMetadata;
	}

	console.warn(
		`Recipe at ${filePath} is missing a "title" in its frontmatter; falling back to a title derived from the filename.`,
	);

	return { ...data, title: titleFromFilename(filePath) };
}

export async function getRecipeData(path: string) {
	const cookFileContent = await fs.promises.readFile(path, "utf-8");
	const { data, content } = matter(cookFileContent);
	const metadata = toRecipeMetadata(data, path);
	const { recipe } = parser.parse(content);

	const steps = recipe.sections
		.flatMap((section) => section.content)
		.filter((item) => item.type === "step")
		.map((item) =>
			item.value.items.map((stepItem) => resolveItem(stepItem, recipe)),
		);

	return {
		metadata,
		path,
		ingredients: recipe.ingredients.map(toFlatIngredient),
		slug: path.split("/").pop()?.split(".")[0],
		steps,
	};
}
