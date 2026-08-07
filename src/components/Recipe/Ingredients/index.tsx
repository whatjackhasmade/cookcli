import { useRecipe } from "../context";

function uppercaseFirstLetter(str: string) {
	return str[0].toUpperCase() + str.slice(1);
}

export default function Ingredients() {
	const { ingredients, checkedIngredients, setCheckedIngredients } =
		useRecipe();

	const sortedIngredients = ingredients.sort((a, b) =>
		a.name.localeCompare(b.name),
	);

	const filteredIngredients = sortedIngredients.filter(
		(ingredient) => ingredient.quantity !== "some",
	);

	function toggleIngredient(name: string) {
		setCheckedIngredients((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(name)) {
				newSet.delete(name);
			} else {
				newSet.add(name);
			}
			return newSet;
		});
	}

	if (filteredIngredients.length === 0) {
		return <p className="mb-5">No ingredients in this recipe.</p>;
	}

	return (
		<table aria-label="Ingredients list" className="mb-5">
			<thead>
				<tr>
					<th>
						<span className="sr-only">Checked</span>
					</th>
					<th>Ingredient</th>
					<th>Quantity</th>
				</tr>
			</thead>
			<tbody>
				{filteredIngredients.map((ingredient) => (
					<tr key={ingredient.name}>
						<td>
							<input
								type="checkbox"
								checked={checkedIngredients.has(ingredient.name)}
								onChange={() => toggleIngredient(ingredient.name)}
								aria-label={`Check off ${ingredient.name}`}
							/>
						</td>
						<td>{uppercaseFirstLetter(ingredient.name)}</td>
						<td>
							{ingredient.quantity} {ingredient.units}
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}
