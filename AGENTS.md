# Repository Guidelines

## Project Structure & Module Organization
- `app/` (or `pages/`): page routes, layouts, API routes; keep feature folders self-contained.
- `src/components/`: shared UI; prefer small, typed components; colocate stories/tests.
- `src/lib/`: data-fetching helpers, domain utilities, API clients.
- `public/`: static assets; favor CDN-friendly naming like `charts/traffic-v1.png`.
- `tests/` or `__tests__/`: unit/integration specs; mirror source paths.
- `scripts/`: one-off maintenance (seeding, exports); keep idempotent.

## Build, Test, and Development Commands
- `npm install` (or `pnpm install`): install dependencies.
- `npm run dev`: start Next.js in watch mode at `http://localhost:3000`.
- `npm run build`: optimized production build; blocks on type and lint errors.
- `npm run start`: serve the production build locally.
- `npm run lint`: ESLint + Prettier formatting checks.
- `npm test` (or `npm run test -- <pattern>`): run Jest/RTL specs.

## Coding Style & Naming Conventions
- TypeScript-first; 2-space indent; avoid default exports for components/hooks.
- Components `PascalCase`, hooks/utilities `camelCase`, files `kebab-case.ts[x]`; route params use `[id].ts`.
- Favor server components by default; move client-only logic behind `"use client"` with minimal surface area.
- Keep data access in `src/lib` and pass typed props; prefer `async/await` over chained promises.
- Run `npm run lint && npm run format` before pushing; do not commit generated `.next/` or env files.

## Testing Guidelines
- Use Jest + React Testing Library; add tests for new UI states, data loaders, and error boundaries.
- Name specs `*.test.tsx` adjacent to code or under `tests/feature/...` mirroring paths.
- Mock network calls at the boundary (fetch/axios); prefer integration tests around pages/routes.
- Aim to keep coverage healthy for critical flows (auth, dashboards, exports); add snapshots sparingly.

## Commit & Pull Request Guidelines
- Commits: imperative mood with scope, e.g., `feat: add traffic widgets` or `fix: handle empty dataset`.
- PRs: include summary, testing notes (`npm test`, manual steps), linked issues, and screenshots/GIFs for UI changes.
- Keep PRs small and focused; add rollout/monitoring notes if the change affects data pipelines or caching.

## Security & Configuration
- Store secrets in `.env.local`; never commit keys or tokens. Use `.env.example` for placeholders.
- Review `next.config.js` and middleware before enabling new origins or headers; validate incoming payloads server-side.
- Prefer parameterized queries and centralized fetch helpers to enforce auth and tracing.
