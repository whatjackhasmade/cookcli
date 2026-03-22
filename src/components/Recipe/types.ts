import type { getRecipeData } from "@/utils/server";

export type Recipe = Awaited<ReturnType<typeof getRecipeData>>;
