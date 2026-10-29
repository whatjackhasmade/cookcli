import { parseArgs } from "node:util";
import type { AggregatedIngredient } from "@/utils";
import { loadShoppingList } from "../loadShoppingList";
import { openOcado, pause } from "../ocado/browser";
import { ensureLoggedIn } from "../ocado/login";
import { type EnsureResult, getTrolley, setPackCount } from "../ocado/trolley";
import { parsePantryParam } from "../ocadoStatus";
import {
	type TrolleyPlan,
	type TrolleyProductLine,
	planTrolley,
} from "../planTrolley";
import { ocadoProducts } from "../products";

// `npm run ocado -- "<recipes>" [--pantry "salt,curry powder"] [--dry-run]`
// - fills the Ocado Trolley with the Packs a selection of recipes needs.
// Never books a slot or checks out; the browser is left open for review.
const usage =
	'Usage: npm run ocado -- "pad-thai:4,ragu:2" [--pantry "salt,curry powder"] [--dry-run]';

function amountsText({ amounts }: AggregatedIngredient) {
	return amounts
		.map(({ quantity, units }) => `${quantity}${units ? ` ${units}` : ""}`)
		.join(" + ");
}

function lineText({ product, packs, ingredients }: TrolleyProductLine) {
	const sources = ingredients
		.map((ingredient) => `${ingredient.name} ${amountsText(ingredient)}`)
		.join(", ");
	return `${product.name} × ${packs}  (${sources})`;
}

function printSection(title: string, lines: string[]) {
	if (lines.length === 0) {
		return;
	}
	console.log(`\n${title}`);
	for (const line of lines) {
		console.log(`  ${line}`);
	}
}

function printPlan(plan: TrolleyPlan) {
	printSection(
		"To add",
		plan.products.map(
			(line) =>
				`${lineText(line)}${line.checkQuantity ? "  [check quantity]" : ""}`,
		),
	);
	printPantryAndUnmapped(plan);
}

function printPantryAndUnmapped(plan: TrolleyPlan) {
	printSection(
		"Pantry items left out (add with --pantry)",
		plan.pantry.map(
			(line) =>
				`${line.ingredients.map(({ name }) => name).join(", ")} → ${line.product.name}`,
		),
	);
	printSection(
		"Unmapped ingredients (map with npm run ocado:map)",
		plan.unmapped.map(
			(ingredient) => `${ingredient.name} ${amountsText(ingredient)}`,
		),
	);
}

function shuffle<T>(items: T[]): T[] {
	const shuffled = [...items];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

function resultText(line: TrolleyProductLine, result: EnsureResult) {
	switch (result.outcome) {
		case "added":
			return `${line.product.name}: ${result.from} → ${result.to}`;
		case "already":
			return `${line.product.name}: already ${result.quantity} (needed ${line.packs})`;
		case "failed":
			return `${line.product.name}: wanted ${line.packs}, Trolley has ${result.to}`;
	}
}

async function main() {
	const { values, positionals } = parseArgs({
		allowPositionals: true,
		options: {
			pantry: { type: "string", default: "" },
			"dry-run": { type: "boolean", default: false },
		},
	});

	const recipesParam = positionals[0];
	if (!recipesParam) {
		console.error(usage);
		process.exit(1);
	}

	const enabledPantry = new Set(parsePantryParam(values.pantry));

	const { selectedRecipes, shoppingList } =
		await loadShoppingList(recipesParam);
	if (selectedRecipes.length === 0) {
		console.error(`No recipes matched "${recipesParam}".`);
		process.exit(1);
	}
	console.log(
		`Recipes: ${selectedRecipes.map(({ title, servings }) => `${title} (${servings})`).join(", ")}`,
	);

	const plan = planTrolley(shoppingList, ocadoProducts, enabledPantry);
	if (values["dry-run"] || plan.products.length === 0) {
		printPlan(plan);
		return;
	}

	// Credentials may live in either file; neither has to exist, in which
	// case login falls back to the manual wait.
	for (const envFile of [".env.local", ".env"]) {
		try {
			process.loadEnvFile(envFile);
		} catch {
			// Missing file - try the next one.
		}
	}

	const { page, saveSession } = await openOcado();
	const { csrfToken } = await ensureLoggedIn(page);
	await saveSession();

	const trolley = await getTrolley(page);
	const outcomes: Array<{ line: TrolleyProductLine; result: EnsureResult }> =
		[];

	for (const line of shuffle(plan.products)) {
		const needsChange = (trolley.get(line.product.productId) ?? 0) < line.packs;
		if (needsChange) {
			await pause();
		}
		try {
			const result = await setPackCount(
				page,
				csrfToken,
				trolley,
				line.product.productId,
				line.packs,
			);
			outcomes.push({ line, result });
		} catch (error) {
			console.error(`${line.product.name}: ${(error as Error).message}`);
			outcomes.push({
				line,
				result: {
					outcome: "failed",
					from: 0,
					to: trolley.get(line.product.productId) ?? 0,
				},
			});
		}
		console.log(resultText(line, outcomes.at(-1)!.result));
	}

	const byOutcome = (outcome: EnsureResult["outcome"]) =>
		outcomes
			.filter(({ result }) => result.outcome === outcome)
			.map(({ line, result }) => resultText(line, result));

	console.log("\n— Summary —");
	printSection("Added", byOutcome("added"));
	printSection("Already in the Trolley", byOutcome("already"));
	printSection("Unavailable or not added", byOutcome("failed"));
	printSection(
		"Check quantity (couldn't calculate Packs - 1 added)",
		plan.products.filter(({ checkQuantity }) => checkQuantity).map(lineText),
	);
	printPantryAndUnmapped(plan);

	await saveSession();
	console.log(
		"\nReview the Trolley in the browser - close the window when you're done.",
	);
	await page.waitForEvent("close", { timeout: 0 });
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
