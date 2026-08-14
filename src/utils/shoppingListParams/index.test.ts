import { describe, expect, it } from "vitest";
import {
	parseSelectedRecipesParam,
	serializeSelectedRecipesParam,
} from "./index";

describe("parseSelectedRecipesParam", () => {
	it("returns an empty array for null/undefined/empty input", () => {
		expect(parseSelectedRecipesParam(null)).toEqual([]);
		expect(parseSelectedRecipesParam(undefined)).toEqual([]);
		expect(parseSelectedRecipesParam("")).toEqual([]);
	});

	it("parses a slug with no servings override", () => {
		expect(parseSelectedRecipesParam("pad-thai")).toEqual([
			{ slug: "pad-thai", servings: undefined },
		]);
	});

	it("parses a slug with a servings override", () => {
		expect(parseSelectedRecipesParam("pad-thai:4")).toEqual([
			{ slug: "pad-thai", servings: 4 },
		]);
	});

	it("parses multiple entries", () => {
		expect(parseSelectedRecipesParam("pad-thai:4,ragu:2,soup")).toEqual([
			{ slug: "pad-thai", servings: 4 },
			{ slug: "ragu", servings: 2 },
			{ slug: "soup", servings: undefined },
		]);
	});

	it("ignores an invalid or non-positive servings value", () => {
		expect(parseSelectedRecipesParam("pad-thai:abc")).toEqual([
			{ slug: "pad-thai", servings: undefined },
		]);
		expect(parseSelectedRecipesParam("pad-thai:0")).toEqual([
			{ slug: "pad-thai", servings: undefined },
		]);
		expect(parseSelectedRecipesParam("pad-thai:-2")).toEqual([
			{ slug: "pad-thai", servings: undefined },
		]);
	});

	it("skips empty entries from stray commas", () => {
		expect(parseSelectedRecipesParam("pad-thai,,ragu")).toEqual([
			{ slug: "pad-thai", servings: undefined },
			{ slug: "ragu", servings: undefined },
		]);
	});
});

describe("serializeSelectedRecipesParam", () => {
	it("serializes slugs without a servings override plainly", () => {
		expect(serializeSelectedRecipesParam([{ slug: "pad-thai" }])).toBe(
			"pad-thai",
		);
	});

	it("serializes a servings override as slug:servings", () => {
		expect(
			serializeSelectedRecipesParam([{ slug: "pad-thai", servings: 4 }]),
		).toBe("pad-thai:4");
	});

	it("joins multiple entries with commas", () => {
		expect(
			serializeSelectedRecipesParam([
				{ slug: "pad-thai", servings: 4 },
				{ slug: "ragu" },
			]),
		).toBe("pad-thai:4,ragu");
	});

	it("returns an empty string for no selection", () => {
		expect(serializeSelectedRecipesParam([])).toBe("");
	});

	it("round-trips through parse", () => {
		const original = [
			{ slug: "pad-thai", servings: 4 },
			{ slug: "ragu", servings: undefined },
		];
		expect(
			parseSelectedRecipesParam(serializeSelectedRecipesParam(original)),
		).toEqual(original);
	});
});
