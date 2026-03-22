import type { Step } from "@cooklang/cooklang-ts";
import { useRecipe } from "../context";

function keyFromStep(step: Step[number]) {
	return JSON.stringify(step);
}

import type { Key } from "@react-types/shared";
import type { CSSProperties } from "react";

const style: CSSProperties = {
	// @ts-expect-error: Allow custom CSS variable
	"--color": "#ffa238",
};

export default function Steps() {
	const { steps, checkedIngredients, setCheckedIngredients } = useRecipe();

	return (
		<ol className="flex gap-4 flex-col mb-2 list-decimal">
			{steps.map((stepGroup) => (
				<li key={JSON.stringify(stepGroup)}>
					{stepGroup.map((step) => {
						switch (step.type) {
							case "text":
								return <span key={keyFromStep(step)}>{step.value}</span>;
							case "ingredient":
								return (
									<button
										style={style}
										className={
											checkedIngredients === "all" ||
											checkedIngredients.has(keyFromStep(step))
												? "strikethrough"
												: undefined
										}
										key={keyFromStep(step)}
										type="button"
										onClick={() => {
											const newKey = keyFromStep(step);

											setCheckedIngredients((prev) => {
												if (prev === "all") {
													return new Set<Key>([newKey]);
												} else if (prev.has(newKey)) {
													const newSet = new Set(prev);
													newSet.delete(newKey);
													return newSet;
												} else {
													return new Set<Key>([...Array.from(prev), newKey]);
												}
											});
										}}
									>
										<span
											style={{
												color: "#ffa238",
											}}
										>
											{step.name}
										</span>
										<span
											style={{
												color: "#fb8536",
												marginLeft: "3px",
											}}
										>
											({step.quantity}
											{step.units ? ` ${step.units}` : ""})
										</span>
									</button>
								);
							case "timer":
								return (
									<span
										key={keyFromStep(step)}
										style={{
											color: "#38e4ff",
										}}
									>
										{step.quantity} {step.units}
									</span>
								);
							case "cookware":
								return <span key={keyFromStep(step)}>{step.name}</span>;
							default:
								return null;
						}
					})}
				</li>
			))}
		</ol>
	);
}
