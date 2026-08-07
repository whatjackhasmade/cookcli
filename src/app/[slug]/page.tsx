import { notFound } from "next/navigation";
import { RecipeWithContext } from "@/components/Recipe/Parent";
import { getRecipeData, getRecipeSummaries } from "@/utils/server";

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
