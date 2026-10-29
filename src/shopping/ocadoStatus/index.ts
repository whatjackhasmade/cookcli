import type { TrolleyPlan } from "../planTrolley";

// What the Ocado CLI will do with one shopping-list Ingredient, keyed by its
// lowercased name so the /shopping page can show it beside each line.
export type OcadoStatus =
	| {
			kind: "product";
			productName: string;
			packs: number;
			checkQuantity: boolean;
			pantry: boolean;
	  }
	| { kind: "pantryLeftOut"; productName: string }
	| { kind: "unmapped" };

export function describeOcadoStatuses(
	plan: TrolleyPlan,
): Record<string, OcadoStatus> {
	const statuses: Record<string, OcadoStatus> = {};

	for (const line of plan.products) {
		for (const { name } of line.ingredients) {
			statuses[name.toLowerCase()] = {
				kind: "product",
				productName: line.product.name,
				packs: line.packs,
				checkQuantity: line.checkQuantity,
				pantry: Boolean(line.product.pantry),
			};
		}
	}

	for (const line of plan.pantry) {
		for (const { name } of line.ingredients) {
			statuses[name.toLowerCase()] = {
				kind: "pantryLeftOut",
				productName: line.product.name,
			};
		}
	}

	for (const { name } of plan.unmapped) {
		statuses[name.toLowerCase()] = { kind: "unmapped" };
	}

	return statuses;
}

// The `pantry` URL search param / `--pantry` flag: Pantry items toggled on,
// as comma-separated Ingredient names.
export function parsePantryParam(value: string | null | undefined): string[] {
	return Array.from(
		new Set(
			(value ?? "")
				.split(",")
				.map((name) => name.trim().toLowerCase())
				.filter(Boolean),
		),
	);
}

export function serializePantryParam(names: string[]): string {
	return names.join(",");
}

function shellQuote(value: string) {
	return `"${value.replace(/["\\$`]/g, "\\$&")}"`;
}

// The command the /shopping page offers to copy, matching its selection.
export function ocadoCommand(recipesParam: string, pantry: string[]): string {
	const pantryFlag =
		pantry.length > 0
			? ` --pantry ${shellQuote(serializePantryParam(pantry))}`
			: "";
	return `npm run ocado -- ${shellQuote(recipesParam)}${pantryFlag}`;
}
