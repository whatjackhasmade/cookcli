"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import { isValidNumber } from "@/utils";
import { modifyIngredientQuantity } from "@/utils/modifyIngredientQuantity";
import type { Recipe } from "../types";

// Shared identity for an ingredient occurrence, used as the key in
// checkedIngredients - both the Ingredients table and Steps resolve back to
// the same index into recipe.ingredients, so checking one checks the other.
export function ingredientCheckKey(index: number) {
	return `ingredient-${index}`;
}

interface RecipeState {
	checkedIngredients: Set<string>;
	ingredients: Recipe["ingredients"];
	recipe: Recipe;
	servings: number;
	setCheckedIngredients: React.Dispatch<React.SetStateAction<Set<string>>>;
	setServings: React.Dispatch<React.SetStateAction<number>>;
	steps: Recipe["steps"];
}

export const RecipeContext = createContext<RecipeState>(
	new Proxy({} as RecipeState, {
		get() {
			throw new Error(`Missing <RecipeProvider>`);
		},
	}),
);

interface RecipeProviderProps {
	children: ReactNode;
	recipe: Recipe;
}

export function RecipeProvider({ children, recipe }: RecipeProviderProps) {
	const [servings, setServings] = useState<number>(
		isValidNumber(recipe.metadata.servings) ? recipe.metadata.servings : 1,
	);

	const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(
		new Set(),
	);

	const recipeServings = recipe.metadata.servings;

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
		<RecipeContext.Provider
			value={{
				checkedIngredients,
				ingredients: calculatedIngredients,
				setCheckedIngredients,
				recipe,
				servings,
				setServings,
				steps: calculatedSteps,
			}}
		>
			{children}
		</RecipeContext.Provider>
	);
}

export function useRecipe() {
	return useContext(RecipeContext);
}
