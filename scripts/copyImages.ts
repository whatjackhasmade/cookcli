import fs from "node:fs";
import path from "node:path";

(async () => {
	const recipeDirectory = await fs.promises.readdir(
		path.join(process.cwd(), "src/recipes"),
	);
	// For each recipe directory, find all images
	const images = await Promise.all(
		recipeDirectory.map(async (recipeDirectory) => {
			const recipePath = path.join(
				process.cwd(),
				"src/recipes",
				recipeDirectory,
			);

			// Check if the recipe directory is a directory
			const stat = await fs.promises.stat(recipePath);
			if (!stat.isDirectory()) {
				return [];
			}

			const files = await fs.promises.readdir(recipePath);
			return files
				.filter((file) => file.endsWith(".jpg"))
				.map((file) => path.join(recipeDirectory, file));
		}),
	).then((images) => images.flat());

	// Copy all images to the public folder
	for (const image of images) {
		if (image.endsWith(".jpg")) {
			const filename = path.basename(image);
			const filepath = `/recipes/${filename}`;

			const imagePath = path.join(process.cwd(), "src/recipes", image);
			const publicPath = path.join(process.cwd(), "public", filepath);

			// Create the directory if it doesn't exist
			const publicDirectory = path.dirname(publicPath);
			if (!fs.existsSync(publicDirectory)) {
				await fs.promises.mkdir(publicDirectory, { recursive: true });
			}

			await fs.promises.copyFile(imagePath, publicPath);
		}
	}
})();
