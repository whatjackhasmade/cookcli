import React from "react";
import type { Recipe } from "../types";
import type { Step } from "@cooklang/cooklang-ts";

function keyFromStep(step: Step[number]) {
  return JSON.stringify(step);
}

export default function Steps({ recipe }: { recipe: Recipe }) {
  return (
	  <ol className="flex gap-4 flex-col mb-2 list-decimal">
      {recipe.steps.map((stepGroup) => (
        <li key={JSON.stringify(stepGroup)}>
          {stepGroup.map((step) => {
            switch (step.type) {
              case "text":
                return <span key={keyFromStep(step)}>{step.value}</span>;
              case "ingredient":
                return (
                  <React.Fragment key={keyFromStep(step)}>
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
                        marginLeft: '3px',
                      }}
                    >
                      ({step.quantity} {step.units})
                    </span>
                  </React.Fragment>
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
                return (
                  <span key={keyFromStep(step)}>
                    {step.name}
                  </span>
                );
            }
          })}
        </li>
      ))}
    </ol>
  );
}