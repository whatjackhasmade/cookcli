import fs from "node:fs";
import nodePath from "node:path";
import { Recipe } from "@cooklang/cooklang-ts";
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
	const recipe = new Recipe(content);

	return {
		metadata,
		path,
		ingredients: recipe.ingredients,
		slug: path.split("/").pop()?.split(".")[0],
		steps: recipe.steps,
	};
}
