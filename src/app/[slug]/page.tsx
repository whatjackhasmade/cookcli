import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecipeWithContext } from "@/components/Recipe/Parent";
import { getRecipeDescription } from "@/utils";
import {
	getRecipeData,
	getRecipeImagePath,
	getRecipeSummaries,
} from "@/utils/server";

export async function generateStaticParams() {
	const summaries = await getRecipeSummaries();

	return summaries.map((recipe) => ({ slug: recipe.slug }));
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const slug = (await params).slug;
	const summaries = await getRecipeSummaries();
	const summary = summaries.find((recipe) => recipe.slug === slug);

	if (!summary) {
		return {};
	}

	const data = await getRecipeData(summary.path);
	const description = getRecipeDescription(data.metadata);
	const imagePath = getRecipeImagePath(slug);

	return {
		title: data.metadata.title,
		description,
		openGraph: {
			siteName: "Cookbook",
			type: "article",
			title: data.metadata.title,
			description,
			images: imagePath ? [{ url: imagePath }] : undefined,
		},
	};
}

export default async function Page({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const slug = (await params).slug;
	const summaries = await getRecipeSummaries();
	const summary = summaries.find((recipe) => recipe.slug === slug);

	if (!summary) {
		notFound();
	}

	const data = await getRecipeData(summary.path);

	return <RecipeWithContext recipe={data} />;
}
