import { notFound } from "next/navigation";
import { RecipeWithContext } from "@/components/Recipe/Parent";
import { getCookFiles, getRecipeData } from "@/utils/server";

export default async function Page({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const slug = (await params).slug;
	const cookFiles = await getCookFiles();
	const cookFile = cookFiles.find((file) => file.endsWith(`${slug}.cook`));

	if (!cookFile) {
		notFound();
	}

	const data = await getRecipeData(cookFile);

	return <RecipeWithContext recipe={data} />;
}
