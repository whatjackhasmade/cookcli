export interface IngredientContribution {
	recipeTitle: string;
	name: string;
	quantity: number | string;
	units: string;
}

export interface AggregatedAmount {
	quantity: number | string;
	units: string;
}

export interface AggregatedIngredient {
	name: string;
	amounts: AggregatedAmount[];
	recipeTitles: string[];
}

function roundQuantity(value: number): number {
	return Math.round(value * 100) / 100;
}

interface IngredientEntry {
	name: string;
	recipeTitles: Set<string>;
	numericByUnit: Map<string, { units: string; quantity: number }>;
	nonNumeric: Map<string, AggregatedAmount>;
}

// Merges ingredient occurrences (possibly from several recipes, each already
// scaled to its own servings) into one line per ingredient name. Quantities
// only sum when the unit matches exactly - there's no unit conversion table,
// so e.g. "200g" and "1 cup" of the same ingredient stay as separate amounts
// on the same line rather than being silently combined or dropped.
export function aggregateIngredients(
	contributions: IngredientContribution[],
): AggregatedIngredient[] {
	const byName = new Map<string, IngredientEntry>();

	for (const contribution of contributions) {
		const nameKey = contribution.name.trim().toLowerCase();
		let entry = byName.get(nameKey);
		if (!entry) {
			entry = {
				name: contribution.name.trim(),
				recipeTitles: new Set(),
				numericByUnit: new Map(),
				nonNumeric: new Map(),
			};
			byName.set(nameKey, entry);
		}

		entry.recipeTitles.add(contribution.recipeTitle);

		const numericQuantity =
			typeof contribution.quantity === "number"
				? contribution.quantity
				: Number.parseFloat(contribution.quantity);

		if (Number.isNaN(numericQuantity)) {
			const unitsKey = contribution.units.trim().toLowerCase();
			const nonNumericKey = `${contribution.quantity}|${unitsKey}`;
			if (!entry.nonNumeric.has(nonNumericKey)) {
				entry.nonNumeric.set(nonNumericKey, {
					quantity: contribution.quantity,
					units: contribution.units,
				});
			}
			continue;
		}

		const unitsKey = contribution.units.trim().toLowerCase();
		const existing = entry.numericByUnit.get(unitsKey);
		if (existing) {
			existing.quantity += numericQuantity;
		} else {
			entry.numericByUnit.set(unitsKey, {
				units: contribution.units,
				quantity: numericQuantity,
			});
		}
	}

	return Array.from(byName.values())
		.map((entry) => ({
			name: entry.name,
			recipeTitles: Array.from(entry.recipeTitles).sort((a, b) =>
				a.localeCompare(b),
			),
			amounts: [
				...Array.from(entry.numericByUnit.values())
					.sort((a, b) => a.units.localeCompare(b.units))
					.map((amount) => ({
						quantity: roundQuantity(amount.quantity),
						units: amount.units,
					})),
				...entry.nonNumeric.values(),
			],
		}))
		.sort((a, b) => a.name.localeCompare(b.name));
}
