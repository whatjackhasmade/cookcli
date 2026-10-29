import { describe, expect, it } from "vitest";
import { convertTo, toBaseUnit } from "./index";

describe("toBaseUnit", () => {
	it("normalises unit aliases and casing", () => {
		expect(toBaseUnit({ quantity: 200, unit: "Grams" })).toEqual({
			quantity: 200,
			unit: "g",
		});
		expect(toBaseUnit({ quantity: 2, unit: "L" })).toEqual({
			quantity: 2000,
			unit: "ml",
		});
	});

	it("treats a missing unit as a count of items", () => {
		expect(toBaseUnit({ quantity: 2, unit: "" })).toEqual({
			quantity: 2,
			unit: "item",
		});
	});

	it("drops preparation notes after a comma", () => {
		expect(toBaseUnit({ quantity: 1, unit: "item, sliced" })).toEqual({
			quantity: 1,
			unit: "item",
		});
	});

	it("keeps unknown units as-is, lowercased", () => {
		expect(toBaseUnit({ quantity: 1, unit: "Pinch" })).toEqual({
			quantity: 1,
			unit: "pinch",
		});
	});
});

describe("convertTo", () => {
	it("converts within metric", () => {
		expect(
			convertTo({ quantity: 1.5, unit: "kg" }, { quantity: 500, unit: "g" }),
		).toBe(3);
		expect(
			convertTo({ quantity: 3, unit: "tsp" }, { quantity: 1, unit: "tbsp" }),
		).toBe(1);
	});

	it("returns null across dimensions without an equivalence", () => {
		expect(
			convertTo({ quantity: 2, unit: "item" }, { quantity: 500, unit: "g" }),
		).toBeNull();
	});

	it("uses an equivalence in either direction", () => {
		const conversions = [
			{ from: { quantity: 1, unit: "item" }, to: { quantity: 150, unit: "g" } },
		];

		expect(
			convertTo(
				{ quantity: 2, unit: "item" },
				{ quantity: 1, unit: "kg" },
				conversions,
			),
		).toBeCloseTo(0.3);
		expect(
			convertTo(
				{ quantity: 300, unit: "g" },
				{ quantity: 1, unit: "item" },
				conversions,
			),
		).toBe(2);
	});
});
