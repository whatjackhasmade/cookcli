import { Suspense } from "react";
import { ClearListButton } from "@/components/Shopping/ClearListButton";
import { Checklist } from "@/components/Shopping/Checklist";
import { RecipePicker } from "@/components/Shopping/RecipePicker";
import {
	aggregateIngredients,
	isValidNumber,
	modifyIngredientQuantity,
	parseSelectedRecipesParam,
} from "@/utils";
import type { RecipeSummary } from "@/utils/server";
import { getRecipeData, getRecipeSummaries } from "@/utils/server";
import styles from "./page.module.css";

export const metadata = {
	title: "Shopping list",
};

function groupByCategory(summaries: RecipeSummary[]) {
	return summaries.reduce(
		(acc, recipe) => {
			acc[recipe.category] = acc[recipe.category] || [];
			acc[recipe.category].push(recipe);
			return acc;
		},
		{} as Record<string, RecipeSummary[]>,
	);
}

export default async function ShoppingPage({
	searchParams,
}: {
	searchParams: Promise<{ recipes?: string }>;
}) {
	const { recipes: recipesParam } = await searchParams;
	const selectedParams = parseSelectedRecipesParam(recipesParam);

	const summaries = await getRecipeSummaries();
	const summariesByCategory = groupByCategory(summaries);

	const selectedRecipes = (
		await Promise.all(
			selectedParams.map(async ({ slug, servings }) => {
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
			}),
		)
	).filter((entry) => entry !== null);

	const aggregated = aggregateIngredients(
		selectedRecipes.flatMap((entry) =>
			entry.ingredients.map((ingredient) => ({
				recipeTitle: entry.title,
				name: ingredient.name,
				quantity: ingredient.quantity,
				units: ingredient.units,
			})),
		),
	);

	return (
		<div className={styles.page}>
			<h1 className={styles.title}>Shopping list</h1>
			<div className={styles.layout}>
				<div className={styles.pickerColumn}>
					<Suspense>
						<RecipePicker
							selected={selectedRecipes.map(({ slug, servings }) => ({
								slug,
								servings,
							}))}
							summariesByCategory={summariesByCategory}
						/>
					</Suspense>
				</div>
				<div className={styles.listColumn}>
					<div className={styles.listHeader}>
						<h2 className={styles.listTitle}>Ingredients</h2>
						<ClearListButton />
					</div>
					<Checklist ingredients={aggregated} />
				</div>
			</div>
		</div>
	);
}
