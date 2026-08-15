import fs from "node:fs";
import path from "node:path";

// Not every recipe has a cover image - scripts/copyImages.ts only copies the
// ones that exist into public/recipes/<slug>.jpg, so this checks there
// rather than assuming every recipe has one.
export function getRecipeImagePath(slug: string): string | undefined {
	const publicPath = path.join(process.cwd(), "public/recipes", `${slug}.jpg`);

	return fs.existsSync(publicPath) ? `/recipes/${slug}.jpg` : undefined;
}
