import type { FlatIngredientItem } from "@/utils/server";

// Kept in a plain (non "use client") module so it can be called directly
// from Server Components (e.g. the /shopping page) as well as from
// RecipeContext - exports from a "use client" file become opaque client
// references when imported into a Server Component, so a plain utility
// function like this can't live there if server code needs to call it too.
export function modifyIngredientQuantity(
	ingredient: FlatIngredientItem,
	servingsMultiplier: number,
) {
	const quantity = (() => {
		// Check if the quantity is a number or a string that converts to a valid number
		if (typeof ingredient.quantity === "number") {
			return ingredient.quantity * servingsMultiplier;
		}

		// If the quantity is a string, try to convert it to a number
		const parsedQuantity = Number.parseFloat(ingredient.quantity);
		if (!Number.isNaN(parsedQuantity)) {
			return parsedQuantity * servingsMultiplier;
		}

		return ingredient.quantity;
	})();

	return {
		...ingredient,
		quantity,
	};
}
