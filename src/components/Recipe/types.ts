import type { getRecipeData } from "@/utils";

export type Recipe = Awaited<ReturnType<typeof getRecipeData>>;