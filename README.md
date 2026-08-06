# cook-cli

A personal cookbook built with Next.js. Recipes are stored as
[Cooklang](https://cooklang.org/) `.cook` files with YAML frontmatter,
directly in the repo under `src/recipes/<category>/` — there's no database
or CMS.

## Getting started

Requires the Node version pinned in `.nvmrc` (v22.13.0).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.

## Adding a recipe

Add a `.cook` file to a category directory under `src/recipes/` (e.g.
`src/recipes/baking/my-recipe.cook`), following Cooklang syntax with YAML
frontmatter for metadata like `title` and `servings`. Drop a `.jpg` next to
it with the same base name for the cover image. Recipes are picked up
automatically — the homepage groups them by their containing directory name.

## Scripts

- `npm run dev` — copy recipe images, then start `next dev --turbopack`
- `npm run build` — copy recipe images, then `next build`
- `npm run start` — run the production server (after `build`)
- `npm run images` — copy recipe images from `src/recipes/**/*.jpg` into
  `public/recipes/` (`scripts/copyImages.ts`), run automatically before
  `dev`/`build`
- `npm run lint` — Biome lint (`--write`)
- `npm run format` — Biome format (`--write`)
- `npm run fix` — format, then lint

Linting/formatting is [Biome](https://biomejs.dev/), not ESLint/Prettier.
There is no test suite configured in this repo.

## More context for AI agents

See [AGENTS.md](./AGENTS.md) for the content pipeline, routing, and
recipe-rendering architecture.
