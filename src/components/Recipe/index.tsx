"use client";

import React from "react";
import Cover from "./Cover";
import Ingredients from "./Ingredients";
import Servings from "./Servings";
import Steps from "./Steps";
import type { Recipe as RecipeType } from "./types";

function modifyIngredientQuantity(
	ingredient: RecipeType["ingredients"][number],
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

function isValidNumber(servings: unknown): servings is number {
	return typeof servings === "number" && !Number.isNaN(servings);
}

export function Recipe(recipe: RecipeType) {
	const recipeServings = recipe.metadata.servings;

	const [servings, setServings] = React.useState<number>(
		recipe.metadata.servings,
	);
	const servingsMultiplier = isValidNumber(recipeServings)
		? servings / recipeServings
		: 1;

	const calculatedIngredients = recipe.ingredients.map((ingredient) =>
		modifyIngredientQuantity(ingredient, servingsMultiplier),
	);

	const calculatedSteps = recipe.steps.map((stepGroup) =>
		stepGroup.map((step) => {
			switch (step.type) {
				case "ingredient":
					return modifyIngredientQuantity(step, servingsMultiplier);
				default:
					return step;
			}
		}),
	);

	return (
		<>
			{recipe.slug && <Cover recipe={recipe} />}
			<h1 className="text-xl mb-5">{recipe.metadata.title}</h1>
			{isValidNumber(recipeServings) && (
				<Servings
					recipe={recipe}
					servings={servings}
					setServings={setServings}
				/>
			)}
			<Ingredients ingredients={calculatedIngredients} />
			<Steps steps={calculatedSteps} />
		</>
	);
}
