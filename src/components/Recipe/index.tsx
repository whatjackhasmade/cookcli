"use client";

import type { getRecipeData } from "@/utils";
import {
	Table,
	TableHeader,
	TableColumn,
	TableBody,
	TableRow,
	TableCell,
} from "@heroui/table";

type Recipe = Awaited<ReturnType<typeof getRecipeData>>;

export function Recipe(recipe: Recipe) {
	return (
		<>
			<h1 className="text-xl mb-5">{recipe.metadata.title}</h1>
			<Table aria-label="Ingredients list" className="mb-5" selectionMode="multiple" >
				<TableHeader>
					<TableColumn>Ingredient</TableColumn>
					<TableColumn>Quantity</TableColumn>
				</TableHeader>
				<TableBody emptyContent={"No ingredients in this recipe."}>
					{recipe.ingredients.map((ingredient) => (
						<TableRow key={JSON.stringify(ingredient)}>
							<TableCell>{ingredient.name}</TableCell>
							<TableCell>{ingredient.quantity} {ingredient.units}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
			<ol className="flex gap-4 flex-col mb-2 list-decimal">
				{recipe.steps.map((stepGroup) => (
					<li key={JSON.stringify(stepGroup)}>
						{stepGroup.map((step) => {
							switch (step.type) {
								case "text":
									return (
										<span key={JSON.stringify(step)}>
											{step.value}
										</span>
									);
								case "ingredient":
									return (
										<span key={JSON.stringify(step)}
										style={{
											color: '#ffa238',
										}}>
											{step.name}
										</span>
									);
								case "timer":
									return (
										<span key={JSON.stringify(step)} style={{
											color: '#38e4ff',
										}}>
											{step.quantity} {step.units}
										</span>
									);
								case "cookware":
									return (
										<span key={JSON.stringify(step)} className="cl-cookware">
											{step.name}
										</span>
									);
							}
						})}
					</li>
				))}
			</ol>
		</>
	);
}
