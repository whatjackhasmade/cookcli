import type { FlatIngredientItem } from "@/utils/server";
import { describe, expect, it } from "vitest";
import { modifyIngredientQuantity } from "./index";

function ingredient(
	overrides: Partial<FlatIngredientItem> = {},
): FlatIngredientItem {
	return {
		type: "ingredient",
		index: 0,
		name: "flour",
		quantity: 100,
		units: "g",
		...overrides,
	};
}

describe("modifyIngredientQuantity", () => {
	it("scales a numeric quantity by the multiplier", () => {
		const result = modifyIngredientQuantity(ingredient({ quantity: 100 }), 2);
		expect(result.quantity).toBe(200);
	});

	it("parses and scales a numeric string quantity", () => {
		const result = modifyIngredientQuantity(ingredient({ quantity: "100" }), 2);
		expect(result.quantity).toBe(200);
	});

	it("leaves non-numeric quantities (e.g. 'to taste') untouched", () => {
		const result = modifyIngredientQuantity(
			ingredient({ quantity: "to taste" }),
			2,
		);
		expect(result.quantity).toBe("to taste");
	});

	it("is a no-op at multiplier 1", () => {
		const result = modifyIngredientQuantity(ingredient({ quantity: 100 }), 1);
		expect(result.quantity).toBe(100);
	});

	it("preserves the other ingredient fields", () => {
		const result = modifyIngredientQuantity(
			ingredient({ name: "sugar", units: "tbsp" }),
			2,
		);
		expect(result.name).toBe("sugar");
		expect(result.units).toBe("tbsp");
	});
});
