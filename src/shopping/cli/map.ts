import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { AggregatedIngredient } from "@/utils";
import { loadShoppingList } from "../loadShoppingList";
import { openOcado, pause } from "../ocado/browser";
import { type OcadoSearchResult, searchProducts } from "../ocado/search";
import { parsePackSize } from "../parsePackSize";
import { planTrolley } from "../planTrolley";
import { ocadoProducts } from "../products";
import type { Amount, OcadoProduct } from "../types";
import { ask, menu } from "./prompt";

// `npm run ocado:map -- "<recipes>"` - walks the Unmapped ingredients for a
// selection, searches Ocado for each, and writes the picked Product into the
// Product mapping (src/shopping/products.ts) as it goes, so quitting part
// way keeps everything mapped so far.
const productsPath = path.join(process.cwd(), "src/shopping/products.ts");

function writeProducts(products: OcadoProduct[]) {
	const source = fs.readFileSync(productsPath, "utf8");
	const declaration = "export const ocadoProducts: OcadoProduct[] =";
	const header = source.slice(0, source.indexOf(declaration));
	fs.writeFileSync(
		productsPath,
		`${header}${declaration} ${JSON.stringify(products, null, "\t")};\n`,
	);
	execFileSync("npx", ["oxfmt", productsPath], { stdio: "ignore" });
}

function describeIngredient({
	name,
	amounts,
	recipeTitles,
}: AggregatedIngredient) {
	const amountText = amounts
		.map(({ quantity, units }) => `${quantity}${units ? ` ${units}` : ""}`)
		.join(" + ");
	return `${name} — ${amountText} (${recipeTitles.join(", ")})`;
}

function describeResult(result: OcadoSearchResult) {
	const unavailable = result.available ? "" : " [unavailable]";
	return `${result.name} — ${result.size} — £${result.price}${unavailable}`;
}

// Accepts Ocado-style sizes ("400g", "6 per pack") or "<number> <unit>".
function parseTypedPackSize(input: string): Amount | null {
	const parsed = parsePackSize(input);
	if (parsed) {
		return parsed;
	}
	const match = /^(\d+(?:\.\d+)?)\s*([a-z]+)$/i.exec(input.trim());
	return match
		? { quantity: Number(match[1]), unit: match[2].toLowerCase() }
		: null;
}

async function main() {
	const recipesParam = process.argv[2];
	if (!recipesParam) {
		console.error('Usage: npm run ocado:map -- "pad-thai:4,ragu:2"');
		process.exit(1);
	}

	const { shoppingList } = await loadShoppingList(recipesParam);
	const products = [...ocadoProducts];
	const { unmapped } = planTrolley(shoppingList, products);

	if (unmapped.length === 0) {
		console.log("Every Ingredient in this selection is already mapped.");
		return;
	}

	const { browser, page, saveSession } = await openOcado();

	try {
		for (const [index, ingredient] of unmapped.entries()) {
			console.log(
				`\n[${index + 1}/${unmapped.length}] ${describeIngredient(ingredient)}`,
			);

			let term = ingredient.name;
			let done = false;

			while (!done) {
				console.log(`  Searching Ocado for "${term}"…`);
				await pause();
				const results = await searchProducts(page, term);
				const choice = await menu(results.map(describeResult));

				if (choice.action === "quit") {
					return;
				}
				if (choice.action === "skip") {
					break;
				}
				if (choice.action === "search") {
					term = (await ask("  Search for: ", term)) || term;
					continue;
				}

				const picked = results[choice.index];
				const { pantry } = choice;
				const existing = products.find(
					(product) => product.retailerProductId === picked.retailerProductId,
				);
				if (existing) {
					existing.ingredients.push(ingredient.name);
					existing.pantry = existing.pantry || pantry || undefined;
				} else {
					let packSize = parsePackSize(picked.size);
					while (!packSize) {
						packSize = parseTypedPackSize(
							await ask(
								`  Pack size for "${picked.size}" (e.g. 400g, 6 item): `,
							),
						);
					}
					products.push({
						retailerProductId: picked.retailerProductId,
						productId: picked.productId,
						name: picked.name,
						packSize,
						ingredients: [ingredient.name],
						...(pantry ? { pantry } : {}),
					});
				}

				writeProducts(products);
				console.log(
					`  Mapped to ${picked.name}${pantry ? " (Pantry item)" : ""}.`,
				);
				done = true;
			}
		}
	} finally {
		await saveSession();
		await browser.close();
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
