import type { RecipeSummary } from "../getRecipeData/types";
import { recipeIndex } from "../recipeIndex.generated";

export async function getRecipeSummaries(): Promise<RecipeSummary[]> {
	return recipeIndex;
}
