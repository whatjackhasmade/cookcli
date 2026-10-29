import { describe, expect, it } from "vitest";
import type { AggregatedIngredient } from "@/utils";
import { planTrolley } from "../planTrolley";
import type { OcadoProduct } from "../types";
import { describeOcadoStatuses, ocadoCommand, parsePantryParam } from "./index";

const chickpeas: OcadoProduct = {
	retailerProductId: "1",
	productId: "uuid-1",
	name: "Chickpeas 400g",
	packSize: { quantity: 400, unit: "g" },
	ingredients: ["chickpeas"],
};

const salt: OcadoProduct = {
	retailerProductId: "2",
	productId: "uuid-2",
	name: "Sea Salt",
	packSize: { quantity: 350, unit: "g" },
	ingredients: ["salt"],
	pantry: true,
};

function ingredient(name: string, quantity: number, units: string) {
	return {
		name,
		amounts: [{ quantity, units }],
		recipeTitles: ["Curry"],
	} satisfies AggregatedIngredient;
}

const shoppingList = [
	ingredient("Chickpeas", 720, "g"),
	ingredient("salt", 1, "pinch"),
	ingredient("sourdough", 8, "slices"),
];

describe("describeOcadoStatuses", () => {
	it("gives every shopping-list Ingredient a status", () => {
		const statuses = describeOcadoStatuses(
			planTrolley(shoppingList, [chickpeas, salt]),
		);

		expect(statuses).toEqual({
			chickpeas: {
				kind: "product",
				productName: "Chickpeas 400g",
				packs: 2,
				checkQuantity: false,
				pantry: false,
			},
			salt: { kind: "pantryLeftOut", productName: "Sea Salt" },
			sourdough: { kind: "unmapped" },
		});
	});

	it("marks a toggled-on Pantry item as a Product to add", () => {
		const statuses = describeOcadoStatuses(
			planTrolley(shoppingList, [chickpeas, salt], new Set(["salt"])),
		);

		expect(statuses.salt).toMatchObject({ kind: "product", pantry: true });
	});
});

describe("parsePantryParam", () => {
	it("splits, trims, lowercases and dedupes names", () => {
		expect(parsePantryParam(" Salt,curry powder,,salt ")).toEqual([
			"salt",
			"curry powder",
		]);
		expect(parsePantryParam(null)).toEqual([]);
	});
});

describe("ocadoCommand", () => {
	it("builds the CLI command for a selection", () => {
		expect(ocadoCommand("pad-thai:4,ragu", [])).toBe(
			'npm run ocado -- "pad-thai:4,ragu"',
		);
		expect(ocadoCommand("ragu", ["salt", "curry powder"])).toBe(
			'npm run ocado -- "ragu" --pantry "salt,curry powder"',
		);
	});

	it("escapes characters the shell would expand inside double quotes", () => {
		expect(ocadoCommand("ragu", ['chef"s $mix'])).toBe(
			'npm run ocado -- "ragu" --pantry "chef\\"s \\$mix"',
		);
	});
});
