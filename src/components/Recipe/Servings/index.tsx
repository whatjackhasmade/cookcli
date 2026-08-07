import { isValidNumber } from "@/utils";
import { useRecipe } from "../context";
import styles from "./index.module.css";

export default function Servings() {
	const { recipe, servings, setServings } = useRecipe();
	const defaultServings = recipe.metadata.servings;

	if (!isValidNumber(defaultServings)) {
		return null;
	}

	return (
		<form className={styles.form}>
			<fieldset className={styles.fieldset}>
				<div className={styles.row}>
					<button
						className={styles.stepperButton}
						type="button"
						onClick={() =>
							setServings((count) => {
								if (count === 1) return 1;
								return count - 1;
							})
						}
					>
						-
					</button>
					<input
						className={styles.input}
						type="text"
						value={servings}
						onChange={(event) => {
							const value = Number.parseInt(event.target.value, 10);
							if (isValidNumber(value) && value > 0) {
								setServings(value);
							}
						}}
					/>
					<button
						className={styles.stepperButton}
						type="button"
						onClick={() => setServings((count) => count + 1)}
					>
						+
					</button>
					<span className={styles.label}>Portions</span>
				</div>
				<button
					className={styles.resetButton}
					type="button"
					onClick={() => setServings(defaultServings)}
				>
					Reset
				</button>
			</fieldset>
		</form>
	);
}
