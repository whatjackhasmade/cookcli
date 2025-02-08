import { getCookFiles } from "@/utils/getCookFiles";
import Link from "next/link";
import { getRecipeData } from "@/utils/getRecipeData";

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

	return (
		<div className="flex gap-4 flex-col mb-2">
			{Object.entries(categories).map(([category, value]) => (
				<section key={category}>
					<h2 className="text-xl mb-2 mt-2">
						{/* Uppercase first letter */}
						{category.charAt(0).toUpperCase() + category.slice(1)}
					</h2>
					<ul>
						{value.map((recipe) => (
							<li key={recipe.path}>
								<Link href={`/${recipe.path.split("/").pop()?.split(".")[0]}`}>
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
