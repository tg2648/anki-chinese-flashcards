# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

Freshly scaffolded Vue 3 + Vite + TypeScript app (from `create-vue`). No app logic yet: `src/App.vue` is the template placeholder. Runs in a devcontainer (Node 24).

## Commands

- `npm run dev`: Vite dev server with HMR
- `npm run build`: runs `vue-tsc --build` type-check and `vite build` in parallel
- `npm run type-check`: type-check only (use `vue-tsc`, not `tsc`, because `.vue` files need it)
- `npm run test:unit`: Vitest in watch mode. Use `npx vitest run` for a single pass, `npx vitest run src/__tests__/App.spec.ts` for one file, or add `-t "<test name>"` for one test
- `npm run lint`: oxlint then ESLint, both with `--fix` (they change files)
- `npm run format`: Prettier on `src/` (no semicolons, single quotes, 100-column lines)

## Layout notes

- `@` is an alias for `src/` (set in `vite.config.ts`, which `vitest.config.ts` merges).
- Tests live in `src/__tests__/*.spec.ts`, run in jsdom, and mount components with `@vue/test-utils`. `e2e/**` is excluded from Vitest.
- TypeScript configs are split by target: `tsconfig.app.json` (src), `tsconfig.node.json` (config files), and `tsconfig.vitest.json` (tests).
