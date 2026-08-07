"use client";

import Cover from "./Cover";
import { useRecipe } from "./context";
import Ingredients from "./Ingredients";
import styles from "./index.module.css";
import Servings from "./Servings";
import Steps from "./Steps";

export default function Recipe() {
	const { recipe } = useRecipe();

	return (
		<>
			<Cover />
			<h1 className={styles.title}>{recipe.metadata.title}</h1>
			<Servings />
			<Ingredients />
			<Steps />
		</>
	);
}
