import type { Recipe } from "../types";

interface ServingsProps {
	recipe: Recipe;
	servings: number;
	setServings: React.Dispatch<React.SetStateAction<number>>;
}

export default function Servings({
	recipe,
	servings,
	setServings,
}:ServingsProps) {
	return (
		<form style={{
      marginBottom: "1rem",
    }}>
			<fieldset>
				<div style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}>
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
						onChange={(event) =>
							setServings(Number.parseInt(event.target.value))
						}
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
          <span style={{
            display: "inline-block",
            marginLeft: "4px",
            fontSize: "1.1rem",
          }}>Portions</span>
				</div>
				<button
        style={{
          color: "#818181",
        }}
					type="button"
					onClick={() => setServings(recipe.metadata.servings)}
				>
					Reset
				</button>
			</fieldset>
		</form>
	);
}
