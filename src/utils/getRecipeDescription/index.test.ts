import { describe, expect, it } from "vitest";
import { getRecipeDescription } from "./index";

describe("getRecipeDescription", () => {
	it("uses the metadata description when present", () => {
		expect(
			getRecipeDescription({ title: "Test", description: "Custom text." }),
		).toBe("Custom text.");
	});

	it("composes a description from time and servings", () => {
		expect(
			getRecipeDescription({
				title: "Green Dal",
				time: "40 minutes",
				servings: 4,
			}),
		).toBe("Green Dal: ready in 40 minutes, serves 4.");
	});

	it("falls back to time only when servings is missing", () => {
		expect(getRecipeDescription({ title: "Test", time: "10 minutes" })).toBe(
			"Test: ready in 10 minutes.",
		);
	});

	it("falls back to a generic description with no time or servings", () => {
		expect(getRecipeDescription({ title: "Test" })).toBe(
			"Test, a recipe from Cookbook.",
		);
	});
});
