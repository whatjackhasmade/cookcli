import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/table";
import type { Recipe } from "../types";

function uppercaseFirstLetter(str: string) {
  return str[0].toUpperCase() + str.slice(1);
}

export default function Ingredients({ recipe }: { recipe: Recipe }) {
  const sortedIngredients = recipe.ingredients.sort((a, b) => a.name.localeCompare(b.name));

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
        {sortedIngredients.map((ingredient) => (
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