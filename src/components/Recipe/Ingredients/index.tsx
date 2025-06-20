import {
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
} from "@heroui/table";
import type { Recipe } from "../types";

function uppercaseFirstLetter(str: string) {
	return str[0].toUpperCase() + str.slice(1);
}

export default function Ingredients({
	ingredients,
}: { ingredients: Recipe["ingredients"] }) {
	const sortedIngredients = ingredients.sort((a, b) =>
		a.name.localeCompare(b.name),
	);

	const filteredIngredients = sortedIngredients.filter((ingredient) => ingredient.quantity !== 'some');

	return (
		<Table
			aria-label="Ingredients list"
			className="mb-5"
			selectionMode="multiple"
		>
			<TableHeader>
				<TableColumn>Ingredient</TableColumn>
				<TableColumn>Quantity</TableColumn>
			</TableHeader>
			<TableBody emptyContent={"No ingredients in this recipe."}>
				{filteredIngredients.map((ingredient) => (
					<TableRow key={JSON.stringify(ingredient)}>
						<TableCell>{uppercaseFirstLetter(ingredient.name)}</TableCell>
						<TableCell>
							{ingredient.quantity} {ingredient.units}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
