# Repository Guidelines

## Project Structure & Module Organization
- `src/app`: Next.js routes for auth, notes, AI search, dashboard, settings, and API endpoints under `src/app/api`.
- `src/components`: UI pieces (auth, editor, dashboard, storage, etc.) plus co-located tests in `__tests__` and shared UI primitives in `components/ui`.
- `src/lib`: Domain logic (AI helpers, Supabase/Prisma clients, permissions, offline/sorting/storage utilities) with supporting tests in `src/lib/__tests__`.
- `src/hooks` and `src/contexts`: Reusable hooks (keyboard, collaboration, PWA, gesture) and context providers; hook tests live in `src/hooks/__tests__`.
- `prisma/`: Database schemas (`schema.prisma`, `schema.supabase.prisma`) and seeds; `scripts/` and `server/` hold migration, validation, and collaboration server utilities.
- `public/` and `docs/`: Static assets and deployment/setup guides (Vercel, Supabase, Docker, AI config).

## Build, Test, and Development Commands
- `npm run dev` (or `dev:collab` for the Yjs collab server) to start locally; visit http://localhost:3000.
- `npm run build` then `npm start` to verify production output; Prisma client is generated automatically.
- `npm run lint` to apply ESLint rules; run before PRs to catch TS/React issues.
- `npm run test`, `test:watch`, or `test:ui` for Vitest suites; `npm run check:env` to validate required env vars.
- Database helpers: `npm run db:migrate`, `db:generate`, `db:studio`, `db:reset`, `db:seed`; use `supabase:setup` when targeting Supabase.

## Coding Style & Naming Conventions
- TypeScript-first; prefer functional React components. Use kebab-case file names, PascalCase components, and `use*` prefixes for hooks.
- Follow ESLint (see `eslint.config.mjs`); keep imports sorted and remove unused code. Stick to 2-space indentation and tailwind utility ordering already in the repo.
- Favor small, focused modules; place shared types in `src/types` and reusable helpers in `src/lib`.

## Testing Guidelines
- Vitest + Testing Library for components; shared setup in `src/test/setup.ts` and mocks in `src/test/mocks`/`src/test/prisma-mock.ts`.
- Name specs `*.test.ts(x)` alongside code (e.g., `components/__tests__`) or under `src/lib/__tests__` for logic.
- Mock network/DB (Supabase, Prisma, DeepSeek) in tests; avoid hitting real services. Cover render states, accessibility, and error paths for new UI.

## Commit & Pull Request Guidelines
- Use conventional commit prefixes seen in history (`feat:`, `fix:`). Keep subjects under ~72 chars; use English or concise Chinese descriptions.
- PRs should explain scope, include run-test results, and link issues/task IDs. Add screenshots or clips for UI changes and note any schema or env var updates.
- Keep branches rebased onto main before requesting review; avoid committing generated files except Prisma artifacts required for builds.

## Security & Configuration Tips
- Never commit `.env*` secrets. For Supabase/DeepSeek keys, prefer `.env.local` and `.env.docker`; run `npm run check:env` after changes.
- Regenerate Prisma client after schema edits (`npm run db:generate`) and include migration files when schema changes matter.
- Use `npm run verify:network` or `startup:validate` if startup fails; avoid logging sensitive payloads in API routes or server logs.
