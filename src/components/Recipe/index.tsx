"use client";

import Cover from "./Cover";
import Ingredients from "./Ingredients";
import Steps from "./Steps";
import type { Recipe as RecipeType } from "./types";

export function Recipe(recipe: RecipeType) {
	return (
		<>
			{recipe.slug && (
				<Cover recipe={recipe} />
			)}
			<h1 className="text-xl mb-5">{recipe.metadata.title}</h1>
			<Ingredients recipe={recipe} />
			<Steps recipe={recipe} />
		</>
	);
}