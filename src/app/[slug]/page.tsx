import matter from "gray-matter";
import { Recipe } from "@cooklang/cooklang-ts";

import fs from "node:fs";
import path from "node:path";
import React from "react";

interface GetCookFilesArgs {
  dir: string;
  fileList?: string[];
}

async function getCookFiles({
  dir,
  fileList = [],
}: GetCookFilesArgs): Promise<string[]> {
    const files = await fs.promises.readdir(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = await fs.promises.stat(filePath);

        if (stat.isDirectory()) {
            await getCookFiles({
                dir: filePath,
                fileList,
            });
        } else if (file.endsWith(".cook")) {
            fileList.push(filePath);
        }
    }

    return fileList;
}

async function getRecipeData(slug: string) {
  const cookFiles = await getCookFiles({dir: './recipes'});
  const cookFile = cookFiles.find(file => file.endsWith(`${slug}.cook`));

  if (!cookFile) {
    throw new Error(`No cook file found for slug ${slug}`);
  }

  const cookFileContent = await fs.promises.readFile(cookFile, 'utf-8');
  const { data: metadata, content } = matter(cookFileContent);
  const recipe = new Recipe(content)

  return {
     metadata,
        ingredients: recipe.ingredients,
        // for each step, add spans and classes
        // to ingredients, timers, and cookware
        steps: recipe.steps
  };
}


export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const slug = (await params).slug
  const data = await getRecipeData(slug)
  console.log(data)

  return (
    <main>
      <h1>{data.metadata.title}</h1>
      <ul>
        {data.ingredients.map(ingredient => {
          return <li key={JSON.stringify(ingredient)}>{ingredient.quantity} {ingredient.units} {ingredient.name}</li>
        })}
      </ul>
      <ol>
        {data.steps.map(stepGroup =>  (
          <li key={JSON.stringify(stepGroup)}>{stepGroup.map(step => {
            switch(step.type) {
              case 'text':
                return <React.Fragment key={JSON.stringify(step)}>{step.value}</React.Fragment>
              case 'ingredient':
                return <span key={JSON.stringify(step)} className="cl-ingredient">{step.name.toLowerCase()}</span>
              case 'timer':
                return <span key={JSON.stringify(step)} className="cl-timer">{step.quantity} {step.units}</span>
              case 'cookware':
                return <span key={JSON.stringify(step)} className="cl-cookware">{step.name.toLowerCase()}</span>
            }
          })}</li>
        ))}
      </ol>
    </main>
  )
}