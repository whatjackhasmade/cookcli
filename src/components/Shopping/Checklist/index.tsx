"use client";

import { useEffect, useState } from "react";
import { uppercaseFirstLetter } from "@/utils";
import type { AggregatedIngredient } from "@/utils/aggregateIngredients";
import { SHOPPING_CHECKED_STORAGE_KEY } from "../constants";
import styles from "./index.module.css";

interface ChecklistProps {
	ingredients: AggregatedIngredient[];
}

function readStoredChecked(): Set<string> {
	try {
		const raw = window.localStorage.getItem(SHOPPING_CHECKED_STORAGE_KEY);
		return raw ? new Set(JSON.parse(raw)) : new Set();
	} catch {
		return new Set();
	}
}

export function Checklist({ ingredients }: ChecklistProps) {
	const [checked, setChecked] = useState<Set<string>>(new Set());
	const [hasLoaded, setHasLoaded] = useState(false);

	// Seeded from localStorage on mount rather than in useState's initializer -
	// that runs during SSR too, where window/localStorage don't exist.
	useEffect(() => {
		setChecked(readStoredChecked());
		setHasLoaded(true);
	}, []);

	useEffect(() => {
		if (!hasLoaded) {
			return;
		}
		window.localStorage.setItem(
			SHOPPING_CHECKED_STORAGE_KEY,
			JSON.stringify(Array.from(checked)),
		);
	}, [checked, hasLoaded]);

	function toggle(key: string) {
		setChecked((prev) => {
			const next = new Set(prev);
			if (next.has(key)) {
				next.delete(key);
			} else {
				next.add(key);
			}
			return next;
		});
	}

	if (ingredients.length === 0) {
		return (
			<p className={styles.empty}>
				Select recipes to build your shopping list.
			</p>
		);
	}

	return (
		<ul className={styles.list}>
			{ingredients.map((ingredient) => {
				const key = ingredient.name.toLowerCase();
				const isChecked = checked.has(key);
				const id = `shopping-item-${key.replace(/\s+/g, "-")}`;

				return (
					<li
						className={isChecked ? styles.checkedItem : styles.item}
						key={key}
					>
						<label className={styles.itemLabel} htmlFor={id}>
							<input
								checked={isChecked}
								id={id}
								type="checkbox"
								onChange={() => toggle(key)}
							/>
							<span className={styles.itemContent}>
								<span className={styles.itemMain}>
									<span className={styles.itemName}>
										{uppercaseFirstLetter(ingredient.name)}
									</span>
									<span className={styles.itemAmounts}>
										{ingredient.amounts
											.map((amount) =>
												amount.units
													? `${amount.quantity} ${amount.units}`
													: `${amount.quantity}`,
											)
											.join(", ")}
									</span>
								</span>
								<span className={styles.itemSources}>
									{ingredient.recipeTitles.join(", ")}
								</span>
							</span>
						</label>
					</li>
				);
			})}
		</ul>
	);
}
