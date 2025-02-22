import Image from "next/image";
import type { Recipe } from "../types";

export default function Cover({ recipe }: { recipe: Recipe }) {
  return (
    <div
      style={{
        marginBottom: "2rem",
        width: "100%",
        position: "relative",
        height: 300,
      }}
    >
      <Image
        style={{
          objectFit: "cover",
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
        src={`/recipes/${recipe.slug}.jpg`}
        alt={recipe.metadata.title}
        width={1000}
        height={300}
      />
    </div>
  );
}