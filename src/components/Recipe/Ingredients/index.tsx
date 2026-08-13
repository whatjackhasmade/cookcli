import { useState } from "react";
import { ChevronDownIcon } from "@/components/Icons";
import { uppercaseFirstLetter } from "@/utils";
import { ingredientCheckKey, useRecipe } from "../context";
import styles from "./index.module.css";

export default function Ingredients() {
	const { ingredients, checkedIngredients, setCheckedIngredients } =
		useRecipe();
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [hideChecked, setHideChecked] = useState(false);

	const sortedIngredients = ingredients.sort((a, b) =>
		a.name.localeCompare(b.name),
	);

	const filteredIngredients = sortedIngredients.filter(
		(ingredient) => ingredient.quantity !== "some",
	);

	const visibleIngredients = hideChecked
		? filteredIngredients.filter(
				(ingredient) =>
					!checkedIngredients.has(ingredientCheckKey(ingredient.index)),
			)
		: filteredIngredients;

	const hasCheckedIngredients = filteredIngredients.some((ingredient) =>
		checkedIngredients.has(ingredientCheckKey(ingredient.index)),
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
			<div
				className={isCollapsed ? styles.header : styles.headerExpanded}
			>
				<button
					aria-expanded={!isCollapsed}
					className={styles.headerToggle}
					type="button"
					onClick={() => setIsCollapsed((collapsed) => !collapsed)}
				>
					<ChevronDownIcon
						className={
							isCollapsed
								? styles.headerChevronCollapsed
								: styles.headerChevron
						}
					/>
					Ingredients
				</button>
				{!isCollapsed && hasCheckedIngredients && (
					<label className={styles.hideCheckedLabel}>
						<input
							checked={hideChecked}
							type="checkbox"
							onChange={(event) => setHideChecked(event.target.checked)}
						/>
						Hide checked
					</label>
				)}
			</div>
			{!isCollapsed &&
				(visibleIngredients.length > 0 ? (
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
							{visibleIngredients.map((ingredient) => {
								const id = ingredientCheckKey(ingredient.index);
								const checked = checkedIngredients.has(id);

								return (
									<tr
										key={id}
										className={checked ? styles.checkedRow : undefined}
									>
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
				) : (
					<p className={styles.allChecked}>
						All ingredients checked off.
					</p>
				))}
		</div>
	);
}
