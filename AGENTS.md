# AGENTS.md

Guidance for AI coding agents working in this repository.

## What this is

A Next.js (App Router) site that renders a personal cookbook. Recipes are
[Cooklang](https://cooklang.org/) `.cook` files with YAML frontmatter, stored
directly in the repo under `src/recipes/<category>/`. There is no database or
CMS — the file tree under `src/recipes` *is* the content.

## Commands

- `npm run dev` — copies recipe images, then starts `next dev --turbopack`
- `npm run build` — copies recipe images, then `next build`
- `npm run start` — runs the production server (after `build`)
- `npm run images` — runs `scripts/copyImages.ts` directly (see below)
- `npm run lint` — `biome lint --write`
- `npm run format` — `biome format --write`
- `npm run fix` — format, then lint
- `npm run test` — `vitest run`
- Node version is pinned in `.nvmrc` (v22.13.0)

Linting/formatting is Biome (`biome.json`), not ESLint/Prettier — tabs,
double quotes, organize-imports on save. `prettier` is a devDependency but
unused by any script.

## Architecture

**Content pipeline** (`src/utils/server/`):
- `getCookFiles` recursively walks `src/recipes` for `*.cook` files.
- `getRecipeData` reads a `.cook` file, splits YAML frontmatter from the body
  with `gray-matter`, and parses the body with `@cooklang/cooklang`'s WASM
  `Parser` to get `ingredients`/`steps`. The parser's native shape
  (`sections[].content[].value.items[]`, referencing ingredients/cookware/
  timers by index) is flattened back into a flat `Item[][]` right there, so
  the rest of the app never deals with that indirection.
- The `Recipe` type (`src/components/Recipe/types.ts`) is just
  `Awaited<ReturnType<typeof getRecipeData>>` — there's no separately
  maintained schema, so changes to `getRecipeData`'s return shape propagate
  automatically.

**Routing**:
- `src/app/page.tsx` loads every recipe, groups them by category (the parent
  directory name under `src/recipes`), and lists them.
- `src/app/[slug]/page.tsx` matches the slug against `.cook` file basenames
  and calls `notFound()` if no match exists.

**Recipe rendering** (`src/components/Recipe/`):
- `Parent` wraps the page in `RecipeProvider` (`context/index.tsx`), then
  `Recipe` (index) renders `Cover`, `Servings`, `Ingredients`, `Steps`, all of
  which read from `RecipeContext` via `useRecipe()`.
- `RecipeContext` is the real state hub: it holds `servings` and
  `checkedIngredients` (a react-aria `Selection`), and derives a
  `servingsMultiplier` from `recipe.metadata.servings` vs. the current
  `servings` count. `modifyIngredientQuantity` applies that multiplier to
  both the flat `ingredients` list and to inline ingredient references
  inside `steps` — so quantity scaling logic lives in exactly one place and
  both views must keep reading from context (not from `recipe` directly) to
  stay in sync.

**Images**: recipe photos live next to their `.cook` file
(`src/recipes/<category>/<name>.jpg`). `scripts/copyImages.ts` flattens all
of them into `public/recipes/` before dev/build. `public/recipes` is
generated and gitignored — don't edit or commit into it directly.

**Styling/UI**: Tailwind CSS + HeroUI (`@heroui/*`) components, theme
switching via `next-themes`, wired up in `src/components/Providers`.

## Project conventions

- `.idea/improvements.md` tracks an ongoing code-review-driven cleanup list.
  Each item is fixed and its checkbox ticked in the same commit. Check this
  file before doing broad cleanup so you don't duplicate or conflict with
  in-flight items.
