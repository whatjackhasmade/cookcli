import type { Metadata } from "next";
import Link from "next/link";
import type { RecipeSummary } from "@/utils/server";
import { getRecipeSummaries } from "@/utils/server";
import styles from "./page.module.css";

// Indulgent categories start collapsed so the healthier ones lead the page.
const COLLAPSED_CATEGORIES = new Set(["baking", "treat"]);

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

export async function generateMetadata(): Promise<Metadata> {
	const summaries = await getRecipeSummaries();
	const categories = Array.from(
		new Set(summaries.map((recipe) => recipe.category)),
	).sort();

	return {
		description: `${summaries.length} recipes across ${categories.length} categories: ${categories.join(", ")}.`,
	};
}

export default async function Home() {
	const categories = await getFormattedData();

	return (
		<div className={styles.list}>
			{Object.entries(categories).map(([category, value]) => {
				const title = (
					<h2 className={styles.categoryTitle}>
						{/* Uppercase first letter */}
						{category.charAt(0).toUpperCase() + category.slice(1)}
					</h2>
				);
				const list = (
					<ul className={styles.recipeList}>
						{value.map((recipe) => (
							<li className={styles.recipeItem} key={recipe.path}>
								<Link className={styles.recipeLink} href={`/${recipe.slug}`}>
									{recipe.title}
								</Link>
							</li>
						))}
					</ul>
				);

				if (COLLAPSED_CATEGORIES.has(category)) {
					return (
						<details className={styles.collapsible} key={category}>
							<summary className={styles.summary}>
								{title}
								<span className={styles.count}>{value.length}</span>
							</summary>
							{list}
						</details>
					);
				}

				return (
					<section key={category}>
						{title}
						{list}
					</section>
				);
			})}
		</div>
	);
}
