"use client";

import Recipe from "..";
import { RecipeProvider } from "../context";
import type { Recipe as RecipeType } from "../types";

export function RecipeWithContext<P>(props: P & { recipe: RecipeType }) {
	const { recipe } = props;

	return (
		<RecipeProvider recipe={recipe}>
			<Recipe />
		</RecipeProvider>
	);
}
