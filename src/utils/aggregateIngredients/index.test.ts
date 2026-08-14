import { describe, expect, it } from "vitest";
import { aggregateIngredients, type IngredientContribution } from "./index";

function contribution(
	overrides: Partial<IngredientContribution> = {},
): IngredientContribution {
	return {
		recipeTitle: "Pad Thai",
		name: "flour",
		quantity: 100,
		units: "g",
		...overrides,
	};
}

describe("aggregateIngredients", () => {
	it("sums quantities for the same ingredient and matching unit", () => {
		const result = aggregateIngredients([
			contribution({ quantity: 100, units: "g" }),
			contribution({ quantity: 50, units: "g" }),
		]);

		expect(result).toEqual([
			{
				name: "flour",
				amounts: [{ quantity: 150, units: "g" }],
				recipeTitles: ["Pad Thai"],
			},
		]);
	});

	it("merges ingredient names case-insensitively", () => {
		const result = aggregateIngredients([
			contribution({ name: "Flour" }),
			contribution({ name: "flour" }),
		]);

		expect(result).toHaveLength(1);
		expect(result[0].amounts).toEqual([{ quantity: 200, units: "g" }]);
	});

	it("keeps different units on the same ingredient as separate amounts", () => {
		const result = aggregateIngredients([
			contribution({ quantity: 200, units: "g" }),
			contribution({ quantity: 1, units: "cup" }),
		]);

		expect(result[0].amounts).toEqual([
			{ quantity: 1, units: "cup" },
			{ quantity: 200, units: "g" },
		]);
	});

	it("keeps non-numeric quantities as-is instead of dropping or summing them", () => {
		const result = aggregateIngredients([
			contribution({ quantity: "some", units: "" }),
			contribution({ quantity: "some", units: "" }),
		]);

		expect(result[0].amounts).toEqual([{ quantity: "some", units: "" }]);
	});

	it("collects unique contributing recipe titles per ingredient", () => {
		const result = aggregateIngredients([
			contribution({ recipeTitle: "Pad Thai" }),
			contribution({ recipeTitle: "Ragu" }),
			contribution({ recipeTitle: "Pad Thai" }),
		]);

		expect(result[0].recipeTitles).toEqual(["Pad Thai", "Ragu"]);
	});

	it("sorts the resulting list alphabetically by ingredient name", () => {
		const result = aggregateIngredients([
			contribution({ name: "salt" }),
			contribution({ name: "flour" }),
			contribution({ name: "garlic" }),
		]);

		expect(result.map((ingredient) => ingredient.name)).toEqual([
			"flour",
			"garlic",
			"salt",
		]);
	});

	it("rounds summed quantities to avoid floating point noise", () => {
		const result = aggregateIngredients([
			contribution({ quantity: 0.1, units: "cup" }),
			contribution({ quantity: 0.2, units: "cup" }),
		]);

		expect(result[0].amounts[0].quantity).toBe(0.3);
	});

	it("returns an empty list for no contributions", () => {
		expect(aggregateIngredients([])).toEqual([]);
	});
});
