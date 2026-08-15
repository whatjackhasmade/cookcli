import fs from "node:fs";
import path from "node:path";
import "@/styles/globals.css";
import type { Metadata, Viewport } from "next";
import { Header } from "@/components/Header";
import { MainContainer } from "@/components/MainContainer";
import { Search } from "@/components/Search";
import { fontSans } from "@/config/fonts";
import { getSiteDescription } from "@/utils";
import { getRecipeSummaries } from "@/utils/server";
import styles from "./layout.module.css";

async function getSearchableRecipes() {
	const summaries = await getRecipeSummaries();

	return summaries.map((recipe) => ({
		title: recipe.title,
		href: `/${recipe.slug}`,
	}));
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
	? process.env.NEXT_PUBLIC_SITE_URL
	: process.env.VERCEL_URL
		? `https://${process.env.VERCEL_URL}`
		: "http://localhost:3000";

const siteDescription = getSiteDescription(
	fs.readFileSync(path.join(process.cwd(), "README.md"), "utf-8"),
);

export const metadata: Metadata = {
	metadataBase: new URL(siteUrl),
	title: {
		default: "Cookbook",
		template: `%s - ${"Cookbook"}`,
	},
	description: siteDescription,
	openGraph: {
		siteName: "Cookbook",
		type: "website",
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
					<MainContainer>{children}</MainContainer>
				</div>
			</body>
		</html>
	);
}
