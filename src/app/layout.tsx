import "@/styles/globals.css";
import type { Metadata, Viewport } from "next";
import { Header } from "@/components/Header";
import { Search } from "@/components/Search";
import { fontSans } from "@/config/fonts";
import { getCookFiles, getRecipeData } from "@/utils/server";
import styles from "./layout.module.css";

async function getSearchableRecipes() {
	const cookFiles = await getCookFiles();
	const recipes = await Promise.all(cookFiles.map(getRecipeData));

	return recipes.map((recipe) => ({
		title: recipe.metadata.title,
		href: `/${recipe.slug}`,
	}));
}

export const metadata: Metadata = {
	title: {
		default: "Cookbook",
		template: `%s - ${"Cookbook"}`,
	},
	description: "All the recipes you need to cook",
	icons: {
		icon: "/favicon.ico",
	},
};

export const viewport: Viewport = {
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "white" },
		{ media: "(prefers-color-scheme: dark)", color: "black" },
	],
};

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const searchableRecipes = await getSearchableRecipes();

	return (
		<html lang="en">
			<head />
			<body className={`${styles.body} ${fontSans.variable}`}>
				<div className={styles.page}>
					<Header />
					<Search recipes={searchableRecipes} />
					<main className={styles.main}>{children}</main>
				</div>
			</body>
		</html>
	);
}
