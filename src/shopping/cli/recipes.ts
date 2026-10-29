import { getRecipeSummaries } from "@/utils/server";
import { loadShoppingList } from "../loadShoppingList";
import { planTrolley } from "../planTrolley";
import type { OcadoProduct } from "../types";

// Titles may start with an emoji, which would otherwise sort first.
function sortKey(title: string) {
	return title.replace(/^[^\p{L}\p{N}]+/u, "");
}

// Every recipe with how many of its Ingredients have no Product mapping,
// sorted by title - for the CLIs' recipe pickers.
export async function recipeMappingRows(products: OcadoProduct[]) {
	const summaries = await getRecipeSummaries();
	const rows = await Promise.all(
		summaries.map(async (summary) => {
			const { shoppingList } = await loadShoppingList(summary.slug);
			const { unmapped } = planTrolley(shoppingList, products);
			return { summary, unmapped: unmapped.length, total: shoppingList.length };
		}),
	);
	return rows.toSorted((a, b) =>
		sortKey(a.summary.title).localeCompare(sortKey(b.summary.title)),
	);
}
