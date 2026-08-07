import { cache } from "react";
import { recipeDataLoaders } from "../recipeDataLoaders.generated";
import type { RecipeData } from "./types";

export * from "./types";

// Cached per-request (React's server-component memoization) so a page that
// looks up the same recipe twice doesn't load it twice. The recipe's own
// parsing already happened at build time (see scripts/generateRecipeData.ts)
// - this just lazy-loads the one generated module for `path`, rather than
// every recipe's data living in one eagerly-bundled object.
export const getRecipeData = cache(
	async (path: string): Promise<RecipeData> => {
		const load = recipeDataLoaders[path];
		if (!load) {
			throw new Error(`No recipe found for path "${path}"`);
		}

		const { recipeData } = await load();
		return recipeData;
	},
);
