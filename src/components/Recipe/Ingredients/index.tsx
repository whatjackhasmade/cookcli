import { uppercaseFirstLetter } from "@/utils";
import { ingredientCheckKey, useRecipe } from "../context";
import styles from "./index.module.css";

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
		return <p className={styles.empty}>No ingredients in this recipe.</p>;
	}

	return (
		<div className={styles.tableWrapper}>
			<table aria-label="Ingredients list" className={styles.table}>
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
					{filteredIngredients.map((ingredient) => {
						const id = ingredientCheckKey(ingredient.index);
						const checked = checkedIngredients.has(id);

						return (
							<tr key={id} className={checked ? styles.checkedRow : undefined}>
								<td className={styles.checkboxCell}>
									<label htmlFor={id} className={styles.cellLabel}>
										<input
											id={id}
											type="checkbox"
											checked={checked}
											onChange={() => toggleIngredient(id)}
											aria-label={`Check off ${ingredient.name}`}
										/>
									</label>
								</td>
								<td>
									<label htmlFor={id} className={styles.cellLabel}>
										{uppercaseFirstLetter(ingredient.name)}
									</label>
								</td>
								<td>
									<label htmlFor={id} className={styles.cellLabel}>
										{ingredient.quantity} {ingredient.units}
									</label>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}
