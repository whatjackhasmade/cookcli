# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See [AGENTS.md](./AGENTS.md) for full details on commands, architecture, and
project conventions — it applies equally to Claude Code and is kept as the
single source of truth so the two files don't drift.

Quick reference:

- `npm run dev` / `npm run build` — copy recipe images then run Next.js
- `npm run fix` — Biome format + lint (this repo uses Biome, not ESLint/Prettier)
- No test suite is configured in this repo.
- Recipes are `.cook` (Cooklang) files under `src/recipes/<category>/`; the
  file tree is the content — there's no database or CMS.
- `RecipeContext` (`src/components/Recipe/context/index.tsx`) is the single
  place that scales ingredient/step quantities by the servings multiplier —
  read from context, not from the raw `recipe` prop, when touching quantities.
- `.idea/improvements.md` is an active, checkbox-tracked cleanup list — check
  it before doing broad refactors in this repo.
