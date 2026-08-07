import Image from "next/image";
import { useRecipe } from "../context";
import styles from "./index.module.css";

export default function Cover() {
	const { recipe } = useRecipe();

	if (!recipe.slug) {
		return null;
	}

	return (
		<div className={styles.wrapper}>
			<Image
				className={styles.image}
				src={`/recipes/${recipe.slug}.jpg`}
				alt={recipe.metadata.title}
				width={1000}
				height={300}
			/>
		</div>
	);
}
