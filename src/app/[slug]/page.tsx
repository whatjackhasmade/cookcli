import React from "react";


import { getCookFiles } from "cook/utils/getCookFiles";
import { getRecipeData } from "cook/utils/getRecipeData";



export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const slug = (await params).slug
  const cookFiles = await getCookFiles();
  const cookFile = cookFiles.find(file => file.endsWith(`${slug}.cook`));

  if(!cookFile) {
    throw new Error(`No cook file found for slug ${slug}`);
  }

  const data = await getRecipeData(cookFile)

  return (
    <>
      <h1>{data.metadata.title}</h1>
      <ul>
        {data.ingredients.map(ingredient => {
          return <li key={JSON.stringify(ingredient)}>{ingredient.quantity} {ingredient.units} {ingredient.name}</li>
        })}
      </ul>
      <ol>
        {data.steps.map(stepGroup => (
          <li key={JSON.stringify(stepGroup)}>{stepGroup.map(step => {
            switch (step.type) {
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
    </>
  )
}