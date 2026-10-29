import type { Amount } from "../types";

// Every recognised unit maps onto one base unit per dimension (g, ml, item)
// so amounts written differently across recipes - "grams" vs "g", "L" vs
// "ml", "tbsp" vs "tsp" - can be compared and summed. Volumes use UK metric
// spoon/cup sizes.
const UNIT_ALIASES: Record<string, Amount> = {
	g: { quantity: 1, unit: "g" },
	gram: { quantity: 1, unit: "g" },
	grams: { quantity: 1, unit: "g" },
	kg: { quantity: 1000, unit: "g" },
	kilogram: { quantity: 1000, unit: "g" },
	kilograms: { quantity: 1000, unit: "g" },
	ml: { quantity: 1, unit: "ml" },
	millilitre: { quantity: 1, unit: "ml" },
	millilitres: { quantity: 1, unit: "ml" },
	l: { quantity: 1000, unit: "ml" },
	litre: { quantity: 1000, unit: "ml" },
	litres: { quantity: 1000, unit: "ml" },
	tsp: { quantity: 5, unit: "ml" },
	teaspoon: { quantity: 5, unit: "ml" },
	teaspoons: { quantity: 5, unit: "ml" },
	tbsp: { quantity: 15, unit: "ml" },
	tablespoon: { quantity: 15, unit: "ml" },
	tablespoons: { quantity: 15, unit: "ml" },
	cup: { quantity: 250, unit: "ml" },
	cups: { quantity: 250, unit: "ml" },
	"": { quantity: 1, unit: "item" },
	item: { quantity: 1, unit: "item" },
	items: { quantity: 1, unit: "item" },
	piece: { quantity: 1, unit: "item" },
	pieces: { quantity: 1, unit: "item" },
	clove: { quantity: 1, unit: "clove" },
	cloves: { quantity: 1, unit: "clove" },
	slice: { quantity: 1, unit: "slice" },
	slices: { quantity: 1, unit: "slice" },
};

// Recipes sometimes put preparation notes into the unit, e.g.
// "item, sliced" - only the part before the comma is the unit.
function unitKey(unit: string): string {
	return unit.split(",")[0].trim().toLowerCase();
}

// Unknown units (e.g. "pinch", "handful") come back lowercased but otherwise
// as-is, so they only ever match the exact same unit.
export function toBaseUnit({ quantity, unit }: Amount): Amount {
	const key = unitKey(unit);
	const alias = UNIT_ALIASES[key];
	if (!alias) {
		return { quantity, unit: key };
	}

	return { quantity: quantity * alias.quantity, unit: alias.unit };
}

// How many of `target` the `amount` is worth, or null when the two can't be
// related through metric conversion or any of the given equivalences.
export function convertTo(
	amount: Amount,
	target: Amount,
	conversions: Array<{ from: Amount; to: Amount }> = [],
): number | null {
	const base = toBaseUnit(amount);
	const targetBase = toBaseUnit(target);

	if (base.unit === targetBase.unit) {
		return base.quantity / targetBase.quantity;
	}

	for (const { from, to } of conversions) {
		for (const [a, b] of [
			[toBaseUnit(from), toBaseUnit(to)],
			[toBaseUnit(to), toBaseUnit(from)],
		]) {
			if (a.unit === base.unit && b.unit === targetBase.unit) {
				return (
					(base.quantity / a.quantity) * (b.quantity / targetBase.quantity)
				);
			}
		}
	}

	return null;
}
