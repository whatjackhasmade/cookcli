import Link from "next/link";
import type { RecipeSummary } from "@/utils/server";
import { getRecipeSummaries } from "@/utils/server";
import styles from "./page.module.css";

async function getFormattedData() {
	const summaries = await getRecipeSummaries();

	return summaries.reduce(
		(acc, recipe) => {
			acc[recipe.category] = acc[recipe.category] || [];
			acc[recipe.category].push(recipe);
			return acc;
		},
		{} as Record<string, RecipeSummary[]>,
	);
}

export default async function Home() {
	const categories = await getFormattedData();

	return (
		<div className={styles.list}>
			{Object.entries(categories).map(([category, value]) => (
				<section key={category}>
					<h2 className={styles.categoryTitle}>
						{/* Uppercase first letter */}
						{category.charAt(0).toUpperCase() + category.slice(1)}
					</h2>
					<ul className={styles.recipeList}>
						{value.map((recipe) => (
							<li className={styles.recipeItem} key={recipe.path}>
								<Link className={styles.recipeLink} href={`/${recipe.slug}`}>
									{recipe.title}
								</Link>
							</li>
						))}
					</ul>
				</section>
			))}
		</div>
	);
}
