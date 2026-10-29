import type { AggregatedIngredient } from "@/utils";
import type { OcadoProduct } from "../types";
import { convertTo } from "../units";

export interface TrolleyProductLine {
	product: OcadoProduct;
	packs: number;
	// Some amount couldn't be converted into Packs (non-numeric quantity or
	// an unrelatable unit), so the Pack count is a floor to review by hand.
	checkQuantity: boolean;
	ingredients: AggregatedIngredient[];
}

export interface TrolleyPlan {
	// Products to put in the Trolley, including Pantry items toggled on.
	products: TrolleyProductLine[];
	// Pantry items left out because they weren't toggled on.
	pantry: TrolleyProductLine[];
	unmapped: AggregatedIngredient[];
}

// Floating point sums like 0.1 + 0.2 would otherwise round a whole Pack up.
function ceilPacks(packs: number): number {
	return Math.ceil(Math.round(packs * 1e6) / 1e6);
}

function byProductName(a: TrolleyProductLine, b: TrolleyProductLine) {
	return a.product.name.localeCompare(b.product.name);
}

export function indexProductsByIngredient(
	products: OcadoProduct[],
): Map<string, OcadoProduct> {
	const byIngredient = new Map<string, OcadoProduct>();

	for (const product of products) {
		for (const ingredient of product.ingredients) {
			const key = ingredient.trim().toLowerCase();
			const existing = byIngredient.get(key);
			if (existing) {
				throw new Error(
					`"${ingredient}" is mapped to both ${existing.name} and ${product.name}`,
				);
			}
			byIngredient.set(key, product);
		}
	}

	return byIngredient;
}

// Turns a shopping list (already aggregated and scaled to servings) into
// Pack counts per Product. Pantry items are toggled on by Ingredient name,
// matching what the shopping list shows.
export function planTrolley(
	shoppingList: AggregatedIngredient[],
	products: OcadoProduct[],
	enabledPantry: ReadonlySet<string> = new Set(),
): TrolleyPlan {
	const byIngredient = indexProductsByIngredient(products);
	const byProduct = new Map<OcadoProduct, AggregatedIngredient[]>();
	const unmapped: AggregatedIngredient[] = [];

	for (const ingredient of shoppingList) {
		const product = byIngredient.get(ingredient.name.trim().toLowerCase());
		if (!product) {
			unmapped.push(ingredient);
			continue;
		}
		byProduct.set(product, [...(byProduct.get(product) ?? []), ingredient]);
	}

	const plan: TrolleyPlan = { products: [], pantry: [], unmapped };

	for (const [product, ingredients] of byProduct) {
		let packs = 0;
		let checkQuantity = false;

		for (const { amounts } of ingredients) {
			for (const { quantity, units } of amounts) {
				const converted =
					typeof quantity === "number"
						? convertTo(
								{ quantity, unit: units },
								product.packSize,
								product.conversions,
							)
						: null;

				if (converted === null) {
					checkQuantity = true;
				} else {
					packs += converted;
				}
			}
		}

		const line: TrolleyProductLine = {
			product,
			packs: Math.max(1, ceilPacks(packs)),
			checkQuantity,
			ingredients,
		};

		const pantryEnabled = ingredients.some(({ name }) =>
			enabledPantry.has(name.trim().toLowerCase()),
		);
		if (product.pantry && !pantryEnabled) {
			plan.pantry.push(line);
		} else {
			plan.products.push(line);
		}
	}

	plan.products.sort(byProductName);
	plan.pantry.sort(byProductName);

	return plan;
}
