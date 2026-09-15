"use client";

import Cover from "./Cover";
import { useRecipe } from "./context";
import Ingredients from "./Ingredients";
import styles from "./index.module.css";
import Servings from "./Servings";
import Steps from "./Steps";

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
