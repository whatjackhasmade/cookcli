export interface SelectedRecipeParam {
	slug: string;
	servings?: number;
}

// Encodes selected recipes (and any servings override) into the `recipes`
// URL search param, e.g. "pad-thai:4,ragu:2" - kept in the URL so a shopping
// list survives a refresh and can be shared as a link.
export function parseSelectedRecipesParam(
	value: string | null | undefined,
): SelectedRecipeParam[] {
	if (!value) {
		return [];
	}

	return value
		.split(",")
		.map((entry) => entry.trim())
		.filter(Boolean)
		.map((entry) => {
			const [slug, servingsRaw] = entry.split(":");
			const servings = servingsRaw
				? Number.parseInt(servingsRaw, 10)
				: undefined;

			return {
				slug: slug.trim(),
				servings:
					servings !== undefined && !Number.isNaN(servings) && servings > 0
						? servings
						: undefined,
			};
		})
		.filter((entry) => entry.slug.length > 0);
}

export function serializeSelectedRecipesParam(
	selected: SelectedRecipeParam[],
): string {
	return selected
		.map(({ slug, servings }) => (servings ? `${slug}:${servings}` : slug))
		.join(",");
}
