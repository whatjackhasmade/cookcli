import React from "react";
import { getRecipeData } from "cook/utils/getRecipeData";

type Recipe = Awaited<ReturnType<typeof getRecipeData>>;

export function Recipe(recipe: Recipe) {
  return (
    <>
      <h1>{recipe.metadata.title}</h1>
      <ul>
        {recipe.ingredients.map(ingredient => {
          return <li key={JSON.stringify(ingredient)}>{ingredient.quantity} {ingredient.units} {ingredient.name}</li>
        })}
      </ul>
      <ol>
        {recipe.steps.map(stepGroup => (
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