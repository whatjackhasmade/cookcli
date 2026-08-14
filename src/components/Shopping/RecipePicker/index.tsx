"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDownIcon, MinusIcon, PlusIcon } from "@/components/Icons";
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
	const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
		{},
	);

	const selectedBySlug = new Map(selected.map((info) => [info.slug, info]));

	function toggleCategory(category: string) {
		setOpenCategories((prev) => ({
			...prev,
			[category]: prev[category] === false,
		}));
	}

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
			{Object.entries(summariesByCategory).map(([category, recipes]) => {
				const isOpen = openCategories[category] !== false;
				const visibleRecipes = isOpen
					? recipes
					: recipes.filter((recipe) => selectedBySlug.has(recipe.slug));

				return (
					<section key={category}>
						<button
							aria-expanded={isOpen}
							className={styles.categoryTitle}
							type="button"
							onClick={() => toggleCategory(category)}
						>
							{category.charAt(0).toUpperCase() + category.slice(1)}
							<ChevronDownIcon
								className={
									isOpen
										? styles.categoryChevron
										: `${styles.categoryChevron} ${styles.categoryChevronClosed}`
								}
							/>
						</button>
						{visibleRecipes.length > 0 ? (
							<ul className={styles.recipeList}>
								{visibleRecipes.map((recipe) => {
									const info = selectedBySlug.get(recipe.slug);
									const checked = Boolean(info);
									const id = `shopping-recipe-${recipe.slug}`;

									return (
										<li className={styles.recipeItem} key={recipe.path}>
											<label className={styles.recipeLabel} htmlFor={id}>
												<span className={styles.recipeInfo}>
													<input
														checked={checked}
														id={id}
														type="checkbox"
														onChange={() => toggleRecipe(recipe.slug)}
													/>
													{recipe.title}
												</span>
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
											</label>
										</li>
									);
								})}
							</ul>
						) : (
							<p className={styles.categoryEmpty}>No recipes selected</p>
						)}
					</section>
				);
			})}
		</div>
	);
}
