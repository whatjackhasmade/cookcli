import fs from "node:fs";
import matter from "gray-matter";
import { Recipe } from "@cooklang/cooklang-ts";

export async function getRecipeData(path: string) {
	const cookFileContent = await fs.promises.readFile(path, "utf-8");
	const { data: metadata, content } = matter(cookFileContent);
	const recipe = new Recipe(content);

	return {
		metadata,
		path,
		ingredients: recipe.ingredients,
		slug: path.split("/").pop()?.split(".")[0],
		steps: recipe.steps,
	};
}
