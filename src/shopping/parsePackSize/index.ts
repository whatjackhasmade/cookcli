import type { Amount } from "../types";

const MULTIPACK = /^(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*(g|kg|ml|cl|l)$/i;
const SINGLE = /^(\d+(?:\.\d+)?)\s*(g|kg|ml|cl|l)$/i;
const COUNT = /^(\d+)\s*(?:per pack|pack|items?)$/i;

function measured(quantity: number, unit: string): Amount {
	const lower = unit.toLowerCase();
	// Centilitres only appear on Ocado sizes, not in recipes, so they're
	// converted here rather than taught to the shared unit table.
	return lower === "cl"
		? { quantity: quantity * 10, unit: "ml" }
		: { quantity, unit: lower };
}

// Reads the Pack size from Ocado's display size, e.g. "400g", "1L",
// "4 x 400g" (one Pack is the whole multipack), "6 per pack" or "each".
// Returns null for anything else so the user is asked instead of guessed.
export function parsePackSize(size: string): Amount | null {
	const value = size.trim();

	const multipack = MULTIPACK.exec(value);
	if (multipack) {
		return measured(Number(multipack[1]) * Number(multipack[2]), multipack[3]);
	}

	const single = SINGLE.exec(value);
	if (single) {
		return measured(Number(single[1]), single[2]);
	}

	const count = COUNT.exec(value);
	if (count) {
		return { quantity: Number(count[1]), unit: "item" };
	}

	if (/^each$/i.test(value)) {
		return { quantity: 1, unit: "item" };
	}

	return null;
}
