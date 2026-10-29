import { describe, expect, it } from "vitest";
import type { AggregatedIngredient } from "@/utils";
import type { OcadoProduct } from "../types";
import { indexProductsByIngredient, planTrolley } from "./index";

function product(overrides: Partial<OcadoProduct> = {}): OcadoProduct {
	return {
		retailerProductId: "1",
		productId: "uuid-1",
		name: "Chickpeas 400g",
		packSize: { quantity: 400, unit: "g" },
		ingredients: ["chickpeas"],
		...overrides,
	};
}

function ingredient(
	name: string,
	...amounts: AggregatedIngredient["amounts"]
): AggregatedIngredient {
	return { name, amounts, recipeTitles: ["Curry"] };
}

describe("planTrolley", () => {
	it("rounds the total up to whole Packs", () => {
		const plan = planTrolley(
			[ingredient("chickpeas", { quantity: 720, units: "g" })],
			[product()],
		);

		expect(plan.products).toHaveLength(1);
		expect(plan.products[0]).toMatchObject({ packs: 2, checkQuantity: false });
	});

	it("does not round an exact total up because of floating point", () => {
		const plan = planTrolley(
			[
				ingredient(
					"milk",
					{ quantity: 0.1, units: "l" },
					{ quantity: 200, units: "ml" },
				),
			],
			[
				product({
					name: "Milk 300ml",
					packSize: { quantity: 300, unit: "ml" },
					ingredients: ["milk"],
				}),
			],
		);

		expect(plan.products[0].packs).toBe(1);
	});

	it("sums every Ingredient mapped to the same Product", () => {
		const limes = product({
			name: "Limes",
			packSize: { quantity: 1, unit: "item" },
			ingredients: ["lime", "lime juice"],
			conversions: [
				{
					from: { quantity: 1, unit: "item" },
					to: { quantity: 30, unit: "ml" },
				},
			],
		});

		const plan = planTrolley(
			[
				ingredient("lime", { quantity: 2, units: "item" }),
				ingredient("Lime juice", { quantity: 2, units: "tbsp" }),
			],
			[limes],
		);

		expect(plan.products).toHaveLength(1);
		expect(plan.products[0].packs).toBe(3);
		expect(plan.products[0].ingredients.map(({ name }) => name)).toEqual([
			"lime",
			"Lime juice",
		]);
	});

	it("adds one Pack and flags Check quantity when nothing converts", () => {
		const plan = planTrolley(
			[ingredient("chickpeas", { quantity: "some", units: "" })],
			[product()],
		);

		expect(plan.products[0]).toMatchObject({ packs: 1, checkQuantity: true });
	});

	it("keeps the converted total but flags Check quantity on a partial conversion", () => {
		const plan = planTrolley(
			[
				ingredient(
					"chickpeas",
					{ quantity: 900, units: "g" },
					{ quantity: 1, units: "handful" },
				),
			],
			[product()],
		);

		expect(plan.products[0]).toMatchObject({ packs: 3, checkQuantity: true });
	});

	it("leaves Pantry items out unless toggled on by Ingredient name", () => {
		const salt = product({
			name: "Sea Salt",
			packSize: { quantity: 350, unit: "g" },
			ingredients: ["salt"],
			pantry: true,
		});
		const shoppingList = [ingredient("Salt", { quantity: 1, units: "pinch" })];

		const off = planTrolley(shoppingList, [salt]);
		expect(off.products).toEqual([]);
		expect(off.pantry.map((line) => line.product.name)).toEqual(["Sea Salt"]);

		const on = planTrolley(shoppingList, [salt], new Set(["salt"]));
		expect(on.products.map((line) => line.product.name)).toEqual(["Sea Salt"]);
		expect(on.pantry).toEqual([]);
	});

	it("lists Ingredients with no Product mapping as unmapped", () => {
		const plan = planTrolley(
			[ingredient("sourdough", { quantity: 8, units: "slices" })],
			[product()],
		);

		expect(plan.products).toEqual([]);
		expect(plan.unmapped.map(({ name }) => name)).toEqual(["sourdough"]);
	});

	it("sorts Products by name", () => {
		const plan = planTrolley(
			[
				ingredient("garlic", { quantity: 1, units: "item" }),
				ingredient("chickpeas", { quantity: 400, units: "g" }),
			],
			[
				product({
					name: "Garlic",
					packSize: { quantity: 1, unit: "item" },
					ingredients: ["garlic"],
				}),
				product(),
			],
		);

		expect(plan.products.map((line) => line.product.name)).toEqual([
			"Chickpeas 400g",
			"Garlic",
		]);
	});
});

describe("indexProductsByIngredient", () => {
	it("rejects an Ingredient mapped to two Products", () => {
		expect(() =>
			indexProductsByIngredient([
				product({ name: "Chickpeas 400g" }),
				product({ name: "Chickpeas 210g", ingredients: ["Chickpeas"] }),
			]),
		).toThrow(/mapped to both/);
	});
});
