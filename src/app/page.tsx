import Link from "next/link";
import { Search } from "@/components/Search";
import { getCookFiles, getRecipeData } from "@/utils/server";
import styles from "./page.module.css";

async function getFormattedData() {
	const cookFiles = await getCookFiles();
	const cookFilesWithData = await Promise.all(cookFiles.map(getRecipeData));

	// Group files by category (it's the second part of the path)
	const categories = cookFilesWithData.reduce(
		(acc, file) => {
			const pathParts = file.path.split("/");
			const category = pathParts[pathParts.length - 2];
			acc[category] = acc[category] || [];
			acc[category].push(file);
			return acc;
		},
		{} as Record<string, Awaited<ReturnType<typeof getRecipeData>>[]>,
	);

	return categories;
}

export default async function Home() {
	const categories = await getFormattedData();
	const searchableRecipes = Object.values(categories)
		.flat()
		.map((recipe) => ({
			title: recipe.metadata.title,
			href: `/${recipe.slug}`,
		}));

	return (
		<div className={styles.list}>
			<Search recipes={searchableRecipes} />
			{Object.entries(categories).map(([category, value]) => (
				<section key={category}>
					<h2 className={styles.categoryTitle}>
						{/* Uppercase first letter */}
						{category.charAt(0).toUpperCase() + category.slice(1)}
					</h2>
					<ul className={styles.recipeList}>
						{value.map((recipe) => (
							<li className={styles.recipeItem} key={recipe.path}>
								<Link
									className={styles.recipeLink}
									href={`/${recipe.path.split("/").pop()?.split(".")[0]}`}
								>
									{recipe.metadata.title}
								</Link>
							</li>
						))}
					</ul>
				</section>
			))}
		</div>
	);
}
