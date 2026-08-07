import { recipeManifest } from "../recipeManifest.generated";

export async function getCookFiles(): Promise<string[]> {
	return Object.keys(recipeManifest);
}
