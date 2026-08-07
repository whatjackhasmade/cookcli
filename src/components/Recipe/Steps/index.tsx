import type { FlatItem } from "@/utils/server";
import { useRecipe } from "../context";
import styles from "./index.module.css";

// Position-based, deliberately excludes step.quantity: that value is
// recalculated per serving-size change, so including it would change the
// key (and silently drop checked state) every time servings are adjusted.
function keyFromStep(step: FlatItem, groupIndex: number, stepIndex: number) {
	return `${groupIndex}-${stepIndex}-${step.type}-${"name" in step ? step.name : ""}`;
}

import type { CSSProperties } from "react";

const style: CSSProperties = {
	// @ts-expect-error: Allow custom CSS variable
	"--color": "var(--ingredient-color)",
};

export default function Steps() {
	const { steps, checkedIngredients, setCheckedIngredients } = useRecipe();

	return (
		<ol className={styles.list}>
			{steps.map((stepGroup, groupIndex) => (
				<li className={styles.step} key={groupIndex}>
					<span className={styles.stepContent}>
						{stepGroup.map((step, stepIndex) => {
							switch (step.type) {
								case "text":
									return (
										<span key={keyFromStep(step, groupIndex, stepIndex)}>
											{step.value}
										</span>
									);
								case "ingredient": {
									const checked = checkedIngredients.has(
										keyFromStep(step, groupIndex, stepIndex),
									);

									return (
										<button
											style={style}
											className={`${styles.ingredient}${checked ? " strikethrough" : ""}`}
											key={keyFromStep(step, groupIndex, stepIndex)}
											type="button"
											onClick={() => {
												const newKey = keyFromStep(step, groupIndex, stepIndex);

												setCheckedIngredients((prev) => {
													const newSet = new Set(prev);
													if (newSet.has(newKey)) {
														newSet.delete(newKey);
													} else {
														newSet.add(newKey);
													}
													return newSet;
												});
											}}
										>
											<span className={styles.ingredientName}>{step.name}</span>
											<span className={styles.ingredientQuantity}>
												({step.quantity}
												{step.units ? ` ${step.units}` : ""})
											</span>
										</button>
									);
								}
								case "timer":
									return (
										<span
											className={styles.timer}
											key={keyFromStep(step, groupIndex, stepIndex)}
										>
											{step.quantity} {step.units}
										</span>
									);
								case "cookware":
									return (
										<span key={keyFromStep(step, groupIndex, stepIndex)}>
											{step.name}
										</span>
									);
								default:
									return null;
							}
						})}
					</span>
				</li>
			))}
		</ol>
	);
}
