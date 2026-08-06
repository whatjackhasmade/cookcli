import { isValidNumber } from "@/utils";
import { useRecipe } from "../context";

export default function Servings() {
	const { recipe, servings, setServings } = useRecipe();
	const defaultServings = recipe.metadata.servings;

	if (!isValidNumber(defaultServings)) {
		return null;
	}

	return (
		<form
			style={{
				marginBottom: "1rem",
			}}
		>
			<fieldset>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "4px",
					}}
				>
					<button
						style={{
							padding: "4px",
							width: "20px",
							backgroundColor: "#292828",
						}}
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
						style={{
							padding: "4px",
							maxWidth: "30px",
							textAlign: "center",
						}}
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
						style={{
							padding: "4px",
							width: "20px",
							backgroundColor: "#292828",
						}}
						type="button"
						onClick={() => setServings((count) => count + 1)}
					>
						+
					</button>
					<span
						style={{
							display: "inline-block",
							marginLeft: "4px",
							fontSize: "1.1rem",
						}}
					>
						Portions
					</span>
				</div>
				<button
					style={{
						color: "#818181",
					}}
					type="button"
					onClick={() => setServings(defaultServings)}
				>
					Reset
				</button>
			</fieldset>
		</form>
	);
}
