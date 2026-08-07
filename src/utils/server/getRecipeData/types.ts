export interface RecipeMetadata {
	title: string;
	servings?: number | string;
	time?: string;
	total_time?: string;
	prep_time?: string;
	cook_time?: string;
	source?: string;
	description?: string;
	author?: string;
	tags?: string[];
	[key: string]: unknown;
}

export interface FlatTextItem {
	type: "text";
	value: string;
}

export interface FlatIngredientItem {
	type: "ingredient";
	// Index into the recipe's top-level `ingredients` array - the stable
	// identity that links a step's ingredient reference back to its row in
	// the ingredients table, so the two can share checked state.
	index: number;
	name: string;
	quantity: number | string;
	units: string;
}

export interface FlatCookwareItem {
	type: "cookware";
	name: string;
}

export interface FlatTimerItem {
	type: "timer";
	quantity: number | string;
	units: string;
}

export type FlatItem =
	| FlatTextItem
	| FlatIngredientItem
	| FlatCookwareItem
	| FlatTimerItem;

export interface RecipeData {
	metadata: RecipeMetadata;
	path: string;
	ingredients: FlatIngredientItem[];
	slug: string | undefined;
	steps: FlatItem[][];
}

// The minimum a recipe listing (homepage, search) needs - lets those pages
// skip loading every recipe's full ingredients/steps just to render a title
// and a link.
export interface RecipeSummary {
	path: string;
	slug: string;
	category: string;
	title: string;
}
