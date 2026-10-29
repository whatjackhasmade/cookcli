import readline from "node:readline/promises";
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
import { approve, filterMultiMenu } from "./prompt";
import { recipeMappingRows } from "./recipes";

// `npm run ocado [-- "<recipes>"] [--pantry "salt,curry powder"] [--dry-run]`
// (with no recipes, they're picked from a list)
// - fills the Ocado Trolley with the Packs a selection of recipes needs.
// Never books a slot or checks out; the browser is left open for review.
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

// Green: Packs added. Amber: the Trolley already had enough. Red: not
// added. Dim: skipped by the user. Plain text when output isn't a terminal or NO_COLOR is set.
const useColour = process.stdout.isTTY && !process.env.NO_COLOR;
// A run's outcome per Product: the Trolley's, or the user declining to add
// a Product the Trolley didn't have at all.
type RunResult = EnsureResult | { outcome: "skipped" };

const OUTCOME_COLOURS: Record<RunResult["outcome"], string> = {
	added: "32",
	already: "33",
	failed: "31",
	skipped: "2",
};

function colour(code: string, text: string) {
	return useColour ? `\x1b[${code}m${text}\x1b[0m` : text;
}

function resultText(line: TrolleyProductLine, result: RunResult) {
	switch (result.outcome) {
		case "skipped":
			return `${line.product.name}: skipped`;
		case "added":
			return `${line.product.name}: ${result.from} → ${result.to}`;
		case "already":
			return `${line.product.name}: already ${result.quantity} (needed ${line.packs})`;
		case "failed":
			return `${line.product.name}: wanted ${line.packs}, Trolley has ${result.to}`;
	}
}

// No recipes given: pick any number from a filterable list, at their
// default servings.
async function pickRecipes(): Promise<string | null> {
	const rows = await recipeMappingRows(ocadoProducts);
	console.log();
	const picked = await filterMultiMenu(
		"Recipes to shop for:",
		rows.map(({ summary, unmapped, total }) =>
			unmapped === 0
				? `${summary.title}  \x1b[2m✓ all mapped\x1b[0m`
				: `${summary.title}  \x1b[2m${unmapped}/${total} unmapped\x1b[0m`,
		),
	);
	return picked
		? picked.map((index) => rows[index].summary.slug).join(",")
		: null;
}

async function main() {
	const { values, positionals } = parseArgs({
		allowPositionals: true,
		options: {
			pantry: { type: "string", default: "" },
			"dry-run": { type: "boolean", default: false },
		},
	});

	const recipesParam = positionals[0] ?? (await pickRecipes());
	if (!recipesParam) {
		return;
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

	const { browser, page, saveSession } = await openOcado();
	const { csrfToken } = await ensureLoggedIn(page);
	await saveSession();

	const trolley = await getTrolley(page);
	const outcomes: Array<{ line: TrolleyProductLine; result: RunResult }> = [];

	const queue = shuffle(plan.products);
	let addAll = false;
	for (const [index, line] of queue.entries()) {
		const progress = `[${index + 1}/${queue.length}]`;
		const current = trolley.get(line.product.productId) ?? 0;
		const left = queue.length - index - 1;
		const remaining = left === 0 ? "done" : `${left} left`;

		// A Product missing from the Trolley entirely is confirmed first, so
		// a run never adds something the user already has at home.
		if (current === 0 && !addAll) {
			const approval = await approve(
				`${progress} Add ${lineText(line)}${line.checkQuantity ? " [check quantity]" : ""}?`,
			);
			addAll = approval === "addAll";
			if (approval === "skip") {
				outcomes.push({ line, result: { outcome: "skipped" } });
				console.log(
					colour(
						OUTCOME_COLOURS.skipped,
						`${progress} ${line.product.name}: skipped — ${remaining}`,
					),
				);
				continue;
			}
		}

		if (current < line.packs) {
			console.log(
				colour("2", `${progress} Adding ${line.product.name} × ${line.packs}…`),
			);
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
			console.error(
				colour("31", `${line.product.name}: ${(error as Error).message}`),
			);
			outcomes.push({
				line,
				result: {
					outcome: "failed",
					from: 0,
					to: trolley.get(line.product.productId) ?? 0,
				},
			});
		}
		const { result } = outcomes.at(-1)!;
		console.log(
			colour(
				OUTCOME_COLOURS[result.outcome],
				`${progress} ${resultText(line, result)} — ${remaining}`,
			),
		);
	}

	const byOutcome = (outcome: RunResult["outcome"]) =>
		outcomes
			.filter(({ result }) => result.outcome === outcome)
			.map(({ line, result }) =>
				colour(OUTCOME_COLOURS[result.outcome], resultText(line, result)),
			);

	console.log("\n— Summary —");
	printSection("Added", byOutcome("added"));
	printSection("Already in the Trolley", byOutcome("already"));
	printSection("Unavailable or not added", byOutcome("failed"));
	printSection("Skipped by you", byOutcome("skipped"));
	printSection(
		"Check quantity (couldn't calculate Packs - 1 added)",
		plan.products.filter(({ checkQuantity }) => checkQuantity).map(lineText),
	);
	printPantryAndUnmapped(plan);

	await saveSession();
	console.log("\nReview the Trolley in the browser.");

	// Whichever comes first: Enter in the terminal, or closing the window.
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	await Promise.race([
		rl.question(
			"Press Enter to close the browser (or just close the window)… ",
		),
		page.waitForEvent("close", { timeout: 0 }),
	]);
	rl.close();
	await browser.close();
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
