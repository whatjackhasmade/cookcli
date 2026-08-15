import type { RecipeMetadata } from "@/utils/server";

// Most recipes don't set a `description` in their frontmatter, so this
// composes a reasonable one from whatever timing/servings metadata exists
// instead of shipping an empty meta description.
export function getRecipeDescription(metadata: RecipeMetadata): string {
	if (metadata.description) {
		return metadata.description;
	}

	const time = metadata.time ?? metadata.total_time;
	const details: string[] = [];
	if (time) {
		details.push(`ready in ${time}`);
	}
	if (metadata.servings) {
		details.push(`serves ${metadata.servings}`);
	}

	return details.length > 0
		? `${metadata.title}: ${details.join(", ")}.`
		: `${metadata.title}, a recipe from Cookbook.`;
}
