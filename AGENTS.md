# Repository Guidelines

## Project Structure & Module Organization
Core code lives in `src/`:

- `src/app/`: Next.js App Router routes (`(app)` protected area, `(auth)` login flow, and API handlers).
- `src/components/`: UI components organized by feature (`dashboard`, `proposals`, `customers`, etc.).
- `src/modules/<feature>/`: layered domain modules with `domain`, `application`, `infrastructure`, and `interface`.
- `src/composition/`: dependency wiring used by server actions/use cases.
- `src/shared/`: shared domain utilities, ports, database/auth infrastructure.

Other important folders:

- `drizzle/`: SQL migrations and metadata.
- `tests/e2e/`: Playwright end-to-end tests.
- `public/`: static assets.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: start local app with Turbopack (`http://localhost:3000`).
- `npm run build` / `npm run start`: production build and runtime.
- `npm run lint` / `npm run lint:fix`: run/fix ESLint checks.
- `npm run typecheck`: TypeScript checks without emit.
- `npm run test`, `npm run test:unit`, `npm run test:watch`, `npm run test:coverage`: Vitest workflows.
- `npm run test:e2e`: Playwright desktop/mobile Chromium suite.
- `npm run db:generate`, `npm run db:migrate`, `npm run db:studio`: Drizzle schema/migration operations.

## Coding Style & Naming Conventions
- Language stack: TypeScript + React/Next.js.
- Follow existing style: 2-space indentation, double quotes, semicolons.
- Prefer kebab-case filenames; use suffixes like `*.use-case.ts`, `*.repository.ts`, `*.port.ts`.
- Use `@/` path alias for imports from `src`.
- Respect module boundaries enforced by ESLint: UI imports only module `interface`; avoid direct infra access from server actions.

## Testing Guidelines
- Unit tests use Vitest and live next to source as `src/**/*.test.ts`.
- Coverage thresholds (domain/application): 80% statements/lines/functions and 60% branches.
- E2E tests live in `tests/e2e/*.spec.ts` and run against local dev server.

## Commit & Pull Request Guidelines
- Match repository history: short imperative commit subjects (`Add`, `Refactor`, `Fix`, `Enhance`, `Remove`).
- Keep each commit focused on one change set; include migrations with related code.
- PRs should include: purpose, impacted modules/routes, test evidence (`npm run test:unit`, `npm run test:e2e` when relevant), and screenshots for UI updates.

## Security & Configuration Tips
- Copy `.env.example` to `.env.local` and never commit secrets.
- Treat `SUPABASE_SERVICE_ROLE_KEY` as backend-only; do not expose it in client code.
