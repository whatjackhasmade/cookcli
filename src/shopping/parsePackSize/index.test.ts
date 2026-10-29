import { describe, expect, it } from "vitest";
import { parsePackSize } from "./index";

describe("parsePackSize", () => {
	it("reads a single measured size", () => {
		expect(parsePackSize("400g")).toEqual({ quantity: 400, unit: "g" });
		expect(parsePackSize("1L")).toEqual({ quantity: 1, unit: "l" });
		expect(parsePackSize("1.5 kg")).toEqual({ quantity: 1.5, unit: "kg" });
	});

	it("treats a multipack as one Pack", () => {
		expect(parsePackSize("4 x 400g")).toEqual({ quantity: 1600, unit: "g" });
		expect(parsePackSize("8 x 330ml")).toEqual({ quantity: 2640, unit: "ml" });
	});

	it("converts centilitres to millilitres", () => {
		expect(parsePackSize("75cl")).toEqual({ quantity: 750, unit: "ml" });
	});

	it("reads counted sizes", () => {
		expect(parsePackSize("6 per pack")).toEqual({ quantity: 6, unit: "item" });
		expect(parsePackSize("Each")).toEqual({ quantity: 1, unit: "item" });
	});

	it("returns null for sizes it can't read", () => {
		expect(parsePackSize("Typical weight 0.5kg")).toBeNull();
	});
});
