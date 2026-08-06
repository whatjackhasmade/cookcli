import { describe, expect, it } from "vitest";
import { isValidNumber } from "./index";

describe("isValidNumber", () => {
	it("accepts finite numbers", () => {
		expect(isValidNumber(4)).toBe(true);
		expect(isValidNumber(0)).toBe(true);
		expect(isValidNumber(-1.5)).toBe(true);
	});

	it("rejects NaN", () => {
		expect(isValidNumber(Number.NaN)).toBe(false);
	});

	it("rejects non-number types", () => {
		expect(isValidNumber("4")).toBe(false);
		expect(isValidNumber(undefined)).toBe(false);
		expect(isValidNumber(null)).toBe(false);
		expect(isValidNumber({})).toBe(false);
	});
});
