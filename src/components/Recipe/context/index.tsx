"use client";

import { ComponentType, useState } from 'react';

import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
} from 'react';
import { Recipe } from '../types';
import { isValidNumber } from '@/utils';


function modifyIngredientQuantity(
  ingredient: Recipe["ingredients"][number],
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


interface RecipeState {
  recipe: Recipe;
  servings: number;
  setServings: React.Dispatch<React.SetStateAction<number>>;
  ingredients: Recipe["ingredients"];
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

export function RecipeProvider({
  children,
  recipe,
}: RecipeProviderProps) {
  const recipeServings = recipe.metadata.servings;

	const [servings, setServings] = useState<number>(
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

  const value = useMemo(
    () => ({
      recipe,
      servings,
      setServings,
      ingredients: calculatedIngredients,
      steps: calculatedSteps,
    }),
    [recipe, servings, calculatedIngredients, calculatedSteps],
  );

  return (
    <RecipeContext.Provider value={value}>
      {children}
    </RecipeContext.Provider>
  );
}

export function useRecipe() {
  return useContext(RecipeContext);
}

export function withRecipe<P>(
  Component: ComponentType<P>,
  options: Omit<RecipeProviderProps, 'children'>,
) {
  return function WithRecipe(props: P & Record<string, unknown>) {
    const { recipe } = options;

    return (
      <RecipeProvider recipe={recipe}>
        <Component {...props} />
      </RecipeProvider>
    );
  };
}
