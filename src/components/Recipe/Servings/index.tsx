import { MinusIcon, PlusIcon, ResetIcon } from "@/components/Icons";
import { isValidNumber } from "@/utils";
import { useRecipe } from "../context";
import styles from "./index.module.css";

export default function Servings() {
	const { recipe, servings, setServings } = useRecipe();
	const defaultServings = recipe.metadata.servings;

	if (!isValidNumber(defaultServings)) {
		return null;
	}

	const isAtMinimum = servings <= 1;
	const isDefault = servings === defaultServings;

	return (
		<form className={styles.wrapper}>
			<fieldset className={styles.fieldset}>
				<span className={styles.label}>Portions</span>
				<div className={styles.stepper}>
					<button
						aria-label="Decrease portions"
						className={styles.stepperButton}
						disabled={isAtMinimum}
						type="button"
						onClick={() => setServings((count) => Math.max(1, count - 1))}
					>
						<MinusIcon />
					</button>
					<input
						aria-label="Number of portions"
						className={styles.input}
						inputMode="numeric"
						pattern="[0-9]*"
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
						aria-label="Increase portions"
						className={styles.stepperButton}
						type="button"
						onClick={() => setServings((count) => count + 1)}
					>
						<PlusIcon />
					</button>
				</div>
				<button
					aria-label="Reset to default portions"
					className={styles.resetButton}
					disabled={isDefault}
					type="button"
					onClick={() => setServings(defaultServings)}
				>
					<ResetIcon />
				</button>
			</fieldset>
		</form>
	);
}
