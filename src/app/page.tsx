import { getCookFiles } from "cook/utils/getCookFiles";
import Link from "next/link";
import { getRecipeData } from "cook/utils/getRecipeData";

export default async function Home() {
  const cookFiles = await getCookFiles();
  const cookFilesWithData = await Promise.all(cookFiles.map(getRecipeData));

  // Group files by category (it's the second part of the path)
  const categories = cookFilesWithData.reduce((acc, file) => {
    const pathParts = file.path.split('/');
    const category = pathParts[pathParts.length - 2];
    acc[category] = acc[category] || [];
    acc[category].push(file);
    return acc;
  }, {} as Record<string, Awaited<ReturnType<typeof getRecipeData>>[]>);

  return (
    <>
      {Object.entries(categories).map(([category, value]) => (
      <section key={category}>
          <h2 style={{margin: 0, marginBottom: '1rem'}}>{category}</h2>
         <ul>
          {value.map((recipe) => <li key={recipe.path}><Link href={`/${recipe.path.split('/').pop()?.split('.')[0]}`}>{recipe.metadata.title}</Link></li>)}
        </ul>
      </section>
      )
      )}
    </>
  );
}
