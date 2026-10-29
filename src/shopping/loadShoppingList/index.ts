import {
	aggregateIngredients,
	isValidNumber,
	modifyIngredientQuantity,
	parseSelectedRecipesParam,
} from "@/utils";
import { getRecipeData, getRecipeSummaries } from "@/utils/server";

// Shared by the /shopping page and the Ocado CLI so both build the shopping
// list from a `recipes` param (e.g. "pad-thai:4,ragu:2") in exactly the same
// way - each recipe scaled to its servings, then aggregated.
export async function loadShoppingList(recipesParam: string | undefined) {
	const summaries = await getRecipeSummaries();

	const selectedRecipes = (
		await Promise.all(
			parseSelectedRecipesParam(recipesParam).map(
				async ({ slug, servings }) => {
					const summary = summaries.find((recipe) => recipe.slug === slug);
					if (!summary) {
						return null;
					}

					const recipe = await getRecipeData(summary.path);
					const defaultServings = isValidNumber(recipe.metadata.servings)
						? recipe.metadata.servings
						: 1;
					const effectiveServings = servings ?? defaultServings;
					const multiplier = effectiveServings / defaultServings;

					return {
						slug,
						title: recipe.metadata.title,
						servings: effectiveServings,
						ingredients: recipe.ingredients.map((ingredient) =>
							modifyIngredientQuantity(ingredient, multiplier),
						),
					};
				},
			),
		)
	).filter((entry) => entry !== null);

	const shoppingList = aggregateIngredients(
		selectedRecipes.flatMap((entry) =>
			entry.ingredients.map((ingredient) => ({
				recipeTitle: entry.title,
				name: ingredient.name,
				quantity: ingredient.quantity,
				units: ingredient.units,
			})),
		),
	);

	return { summaries, selectedRecipes, shoppingList };
}
