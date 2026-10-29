import { Suspense } from "react";
import { Checklist } from "@/components/Shopping/Checklist";
import { ClearListButton } from "@/components/Shopping/ClearListButton";
import { RecipePicker } from "@/components/Shopping/RecipePicker";
import { OcadoCommand } from "@/shopping/components/OcadoCommand";
import { loadShoppingList } from "@/shopping/loadShoppingList";
import {
	describeOcadoStatuses,
	ocadoCommand,
	parsePantryParam,
} from "@/shopping/ocadoStatus";
import { planTrolley } from "@/shopping/planTrolley";
import { ocadoProducts } from "@/shopping/products";
import type { RecipeSummary } from "@/utils/server";
import styles from "./page.module.css";

export const metadata = {
	title: "Shopping list",
	description: "Build a combined shopping list from your selected recipes.",
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
	searchParams: Promise<{ recipes?: string; pantry?: string }>;
}) {
	const { recipes: recipesParam, pantry: pantryParam } = await searchParams;

	const { summaries, selectedRecipes, shoppingList } =
		await loadShoppingList(recipesParam);
	const summariesByCategory = groupByCategory(summaries);

	const pantry = parsePantryParam(pantryParam);
	const ocadoStatuses = describeOcadoStatuses(
		planTrolley(shoppingList, ocadoProducts, new Set(pantry)),
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
					{recipesParam && selectedRecipes.length > 0 && (
						<OcadoCommand command={ocadoCommand(recipesParam, pantry)} />
					)}
					<Checklist
						ingredients={shoppingList}
						ocado={
							recipesParam
								? { statuses: ocadoStatuses, recipesParam, pantry }
								: undefined
						}
					/>
				</div>
			</div>
		</div>
	);
}
