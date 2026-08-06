import type { Step } from "@cooklang/cooklang-ts";
import { useRecipe } from "../context";

// Position-based, deliberately excludes step.quantity: that value is
// recalculated per serving-size change, so including it would change the
// key (and silently drop checked state) every time servings are adjusted.
function keyFromStep(
	step: Step[number],
	groupIndex: number,
	stepIndex: number,
) {
	return `${groupIndex}-${stepIndex}-${step.type}-${"name" in step ? step.name : ""}`;
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
			{steps.map((stepGroup, groupIndex) => (
				<li key={groupIndex}>
					{stepGroup.map((step, stepIndex) => {
						switch (step.type) {
							case "text":
								return (
									<span key={keyFromStep(step, groupIndex, stepIndex)}>
										{step.value}
									</span>
								);
							case "ingredient":
								return (
									<button
										style={style}
										className={
											checkedIngredients === "all" ||
											checkedIngredients.has(
												keyFromStep(step, groupIndex, stepIndex),
											)
												? "strikethrough"
												: undefined
										}
										key={keyFromStep(step, groupIndex, stepIndex)}
										type="button"
										onClick={() => {
											const newKey = keyFromStep(step, groupIndex, stepIndex);

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
										key={keyFromStep(step, groupIndex, stepIndex)}
										style={{
											color: "#38e4ff",
										}}
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
				</li>
			))}
		</ol>
	);
}
