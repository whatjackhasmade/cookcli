# Context

Glossary of terms and concepts for `cook-cli`, as they're actually used in
this codebase — not aspirational definitions.

## Rendering the web routes

The scope boundary for the dependency-reduction effort. Covers everything
that produces the page a browser receives — both the component/behavior
layer and the styling layer:
`@heroui/*`, `@react-aria/*`, `@react-types/shared`, `framer-motion`,
`intl-messageformat`, `next-themes`, `tailwind-variants`, `clsx`, and
(as of the styling-approach decision below) `tailwindcss`, `postcss`,
`autoprefixer`.

Explicitly excludes server/build-time content parsing (`gray-matter`,
`@cooklang/cooklang-ts`) — those run once per request on the server, never
ship to the client, and are about ingesting recipe content rather than
rendering a route.

Next.js and React themselves are the framework, not "dependencies" being
targeted by this effort.

## Styling approach

CSS Modules (one `.module.css` file co-located per component) plus a
single global stylesheet (`src/app/globals.css`) that holds theme-level
CSS custom properties (colors, fonts) and any truly global rules —
replacing Tailwind's utility-class approach entirely. Next.js has
zero-config built-in support for both, so no PostCSS/Tailwind config or
dependency is needed to make this work. `tailwindcss`, `postcss`, and
`autoprefixer` are all dropped as devDependencies.

The global stylesheet's theme tokens are a proper CSS custom property
system, not a 1:1 port of today's ad-hoc values: a neutral scale
(replacing HeroUI's `default-200`/`default-500`/`default-foreground`)
alongside the existing `--ingredient-color`/`--timer-color`/
`--ingredient-quantity-color` vars, each with a light and dark pair.
This also closes the long-standing improvements.md item on moving
hardcoded hex colors into a theme system.

## Migration staging

Three separate phases, not a file-by-file rewrite:
0. **Parser phase** — migrate `@cooklang/cooklang-ts` (deprecated) to
   `@cooklang/cooklang` (WASM-powered) first, since it's an orthogonal,
   self-contained change to the content-parsing layer that reshapes
   `recipe.steps` into `recipe.sections[].content[].items[]`. Doing this
   before the styling phase means `Steps/index.tsx` is only rewritten
   once for structure, not twice. Unaffected by, and unaffecting, the
   UI-library choice below.
1. **Logic phase** — replace every `@heroui/*`, `@react-aria/*`,
   `@react-types/shared`, `next-themes`, and `tailwind-variants` usage
   with hand-rolled equivalents, keeping existing Tailwind classNames
   in place so behavior can be verified independently of the styling
   rewrite.
2. **Styling phase** — convert all Tailwind usage (both pre-existing and
   newly written in phase 1) to CSS Modules in one coordinated pass,
   since deleting `tailwind.config.js` and the `@tailwind` directives
   breaks every Tailwind class at once — this can't be done
   incrementally alongside phase 1.

Test-writing (vitest) for the new hand-rolled logic is an explicitly
separate track, not part of this migration. (Vitest itself and the
existing `modifyIngredientQuantity` test predate this effort.)
