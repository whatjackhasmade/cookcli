"use client";

import { useRecipe } from "./context";
import Cover from "./Cover";
import Ingredients from "./Ingredients";
import Servings from "./Servings";
import Steps from "./Steps";
import styles from "./index.module.css";

export default function Recipe() {
	const { recipe } = useRecipe();
	const time = recipe.metadata.time ?? recipe.metadata.total_time;

	return (
		<>
			<Cover />
			<h1 className={styles.title}>{recipe.metadata.title}</h1>
			{time && <p className={styles.time}>{time}</p>}
			<Servings />
			<Ingredients />
			<Steps />
		</>
	);
}
