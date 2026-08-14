"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MinusIcon, PlusIcon } from "@/components/Icons";
import {
	parseSelectedRecipesParam,
	serializeSelectedRecipesParam,
} from "@/utils/shoppingListParams";
import type { RecipeSummary } from "@/utils/server";
import styles from "./index.module.css";

export interface SelectedRecipeInfo {
	slug: string;
	servings: number;
}

interface RecipePickerProps {
	summariesByCategory: Record<string, RecipeSummary[]>;
	selected: SelectedRecipeInfo[];
}

export function RecipePicker({
	summariesByCategory,
	selected,
}: RecipePickerProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const selectedBySlug = new Map(selected.map((info) => [info.slug, info]));

	function navigateTo(recipes: ReturnType<typeof parseSelectedRecipesParam>) {
		const params = new URLSearchParams(searchParams.toString());
		const serialized = serializeSelectedRecipesParam(recipes);

		if (serialized) {
			params.set("recipes", serialized);
		} else {
			params.delete("recipes");
		}

		const query = params.toString();
		router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
	}

	function toggleRecipe(slug: string) {
		const current = parseSelectedRecipesParam(searchParams.get("recipes"));
		const isSelected = current.some((recipe) => recipe.slug === slug);
		const next = isSelected
			? current.filter((recipe) => recipe.slug !== slug)
			: [...current, { slug }];

		navigateTo(next);
	}

	function updateServings(slug: string, servings: number) {
		const current = parseSelectedRecipesParam(searchParams.get("recipes"));
		const next = current.map((recipe) =>
			recipe.slug === slug ? { slug, servings } : recipe,
		);

		navigateTo(next);
	}

	return (
		<div className={styles.picker}>
			{Object.entries(summariesByCategory).map(([category, recipes]) => (
				<section key={category}>
					<h2 className={styles.categoryTitle}>
						{category.charAt(0).toUpperCase() + category.slice(1)}
					</h2>
					<ul className={styles.recipeList}>
						{recipes.map((recipe) => {
							const info = selectedBySlug.get(recipe.slug);
							const checked = Boolean(info);
							const id = `shopping-recipe-${recipe.slug}`;

							return (
								<li className={styles.recipeItem} key={recipe.path}>
									<label className={styles.recipeLabel} htmlFor={id}>
										<input
											checked={checked}
											id={id}
											type="checkbox"
											onChange={() => toggleRecipe(recipe.slug)}
										/>
										{recipe.title}
									</label>
									{info && (
										<div className={styles.stepper}>
											<button
												aria-label={`Decrease servings for ${recipe.title}`}
												className={styles.stepperButton}
												disabled={info.servings <= 1}
												type="button"
												onClick={() =>
													updateServings(
														recipe.slug,
														Math.max(1, info.servings - 1),
													)
												}
											>
												<MinusIcon />
											</button>
											<span className={styles.stepperValue}>
												{info.servings}
											</span>
											<button
												aria-label={`Increase servings for ${recipe.title}`}
												className={styles.stepperButton}
												type="button"
												onClick={() =>
													updateServings(recipe.slug, info.servings + 1)
												}
											>
												<PlusIcon />
											</button>
										</div>
									)}
								</li>
							);
						})}
					</ul>
				</section>
			))}
		</div>
	);
}
