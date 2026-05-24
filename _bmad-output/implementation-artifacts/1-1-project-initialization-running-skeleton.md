# Story 1.1: Project Initialization & Running Skeleton

Status: done

## Story

As a developer,
I want the monorepo initialized with Vite + React-TS frontend and FastAPI + uv backend both running locally,
so that I have a connected development environment ready to build on.

## Acceptance Criteria

1. **Given** the repository is set up using the architecture's init sequence (monorepo root → frontend Vite scaffold → backend uv init)
   **When** I run `npm run dev` in `/frontend` and `uv run uvicorn app.main:app --reload` in `/backend`
   **Then** the frontend renders at `http://localhost:5173` and `GET /health` returns `{"status": "ok"}` (200)
   **And** the frontend `VITE_API_BASE_URL` points to the backend; FastAPI CORS allows `localhost:5173` via `ALLOWED_ORIGINS` env var

2. **Given** the backend environment is configured
   **When** I run `alembic upgrade head`
   **Then** the command completes without error against a fresh SQLite DB at the path specified by `DATABASE_URL`

3. **Given** the project tooling is installed
   **When** I run `ruff check .` (backend), `npx vitest run` (frontend), and `uv run pytest` (backend)
   **Then** all three commands complete with no errors on the empty project

4. **Given** push notification support is needed later
   **When** project init is complete
   **Then** VAPID keys have been generated and recorded in `backend/.env` (file not committed); `.env.example` documents all required env vars for both frontend and backend

## Tasks / Subtasks

- [x] Task 1: Create monorepo root and initialize git (AC: 1)
  - [x] `mkdir simple-todo && cd simple-todo && git init`
  - [x] Create root `.gitignore` covering `node_modules/`, `__pycache__/`, `*.pyc`, `.env`, `dist/`, `.venv/`, `*.db`
  - [x] Create placeholder `README.md`

- [x] Task 2: Scaffold Vite + React-TS frontend (AC: 1, 3)
  - [x] `npm create vite@latest frontend -- --template react-ts`
  - [x] `cd frontend && npm install`
  - [x] Install Tailwind v4: `npm install tailwindcss @tailwindcss/vite`
  - [x] Configure `vite.config.ts` to use `@tailwindcss/vite` plugin (NO `tailwind.config.js` — Tailwind v4 is CSS-first)
  - [x] Update `src/index.css` to use Tailwind v4 import: `@import "tailwindcss";`
  - [x] Initialize shadcn/ui v4: `npx shadcn@latest init --yes --template vite --preset nova` (zinc base, class dark mode)
  - [x] Install PWA plugin: `npm install vite-plugin-pwa -D`
  - [x] Add `vite-plugin-pwa` to `vite.config.ts` (minimal config for now — full PWA config is Story 5.1)
  - [x] Install Axios and TanStack Query: `npm install axios @tanstack/react-query`
  - [x] Install React Router v7: `npm install react-router`
  - [x] Install Zustand: `npm install zustand`
  - [x] Verify `npx vitest run` passes with zero test files

- [x] Task 3: Create frontend `.env` and `.env.example` (AC: 1, 4)
  - [x] Create `frontend/.env` with `VITE_API_BASE_URL=http://localhost:8000` and `VITE_VAPID_PUBLIC_KEY=` (fill after VAPID generation)
  - [x] Create `frontend/.env.example` documenting both vars with descriptions
  - [x] Add `frontend/.env` to `.gitignore`

- [x] Task 4: Scaffold backend with uv (AC: 1, 2, 3)
  - [x] `uv init backend --app` from monorepo root
  - [x] `cd backend`
  - [x] Add runtime deps: `uv add "fastapi[all]" "uvicorn[standard]" apscheduler "sqlalchemy[asyncio]" aiosqlite pywebpush python-dotenv alembic pydantic-settings`
  - [x] Add dev deps: `uv add --dev pytest pytest-asyncio httpx ruff`

- [x] Task 5: Create FastAPI application skeleton (AC: 1)
  - [x] Create `backend/app/__init__.py`
  - [x] Create `backend/app/config.py` using `pydantic-settings` — typed env vars: `DATABASE_URL`, `ALLOWED_ORIGINS`, `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_CLAIM_EMAIL`
  - [x] Create `backend/app/database.py` — async SQLAlchemy engine using `aiosqlite`, `AsyncSession` factory, `get_db` dependency
  - [x] Create `backend/app/main.py` with:
    - FastAPI app instance
    - CORS middleware reading `settings.allowed_origins` (list split from env var)
    - `GET /health` endpoint returning `{"status": "ok"}` (200)
    - Lifespan context manager (placeholder for scheduler start/stop — wired in Story 2.1)
  - [x] Create `backend/app/models/__init__.py`
  - [x] Create `backend/app/schemas/__init__.py`
  - [x] Create `backend/app/routers/__init__.py`
  - [x] Create `backend/app/services/__init__.py`
  - [x] Create `backend/app/scheduler/__init__.py`

- [x] Task 6: Configure Alembic (async) (AC: 2)
  - [x] `uv run alembic init alembic` inside `backend/`
  - [x] Update `alembic/env.py` for async operation (use `run_sync` with `AsyncEngine`)
  - [x] Set `sqlalchemy.url` in `alembic.ini` to use `DATABASE_URL` from env (or read from `config.py`)
  - [x] Import `Base` metadata from `app.models` in `alembic/env.py` `target_metadata`
  - [x] Create `backend/app/models/base.py` with `DeclarativeBase` subclass `Base`
  - [x] Generate initial (empty) migration: `uv run alembic revision --autogenerate -m "initial"`
  - [x] Verify `uv run alembic upgrade head` runs against a fresh `simple-todo.db`

- [x] Task 7: Generate VAPID keys and configure backend env (AC: 4)
  - [x] Generate VAPID keys using pywebpush CLI or a short Python snippet
  - [x] Create `backend/.env` with: `DATABASE_URL`, `ALLOWED_ORIGINS`, `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_CLAIM_EMAIL`
  - [x] Create `backend/.env.example` documenting all five vars with descriptions
  - [x] Add `backend/.env` and `backend/simple-todo.db` to `.gitignore`
  - [x] Copy VAPID public key into `frontend/.env` under `VITE_VAPID_PUBLIC_KEY`

- [x] Task 8: Verify all tooling passes (AC: 3)
  - [x] Backend: `uv run ruff check .` — fixed 2 unused import issues auto-fixed
  - [x] Backend: `uv run pytest` — 1 test (health endpoint) passes
  - [x] Frontend: `npx vitest run` — passes with no test files (`passWithNoTests: true`)
  - [x] Manual smoke test: `GET /health` returns `{"status":"ok"}`; `npm run build` succeeds

## Dev Notes

### Tech Stack (exact versions as of 2026-05)

- **Frontend:** Vite 6, React 19, TypeScript 5 (strict), Tailwind CSS v4, shadcn/ui v4, React Router v7, TanStack Query v5, Zustand v5, Axios
- **Backend:** Python 3.12+, uv (package manager), FastAPI, Uvicorn, SQLAlchemy 2.0 async (`aiosqlite`), Alembic, APScheduler, pywebpush, pydantic-settings
- **Testing:** Vitest (frontend), pytest + pytest-asyncio + httpx (backend)
- **Linting:** ruff (backend)

### Tailwind v4 is CSS-first — Critical Difference

Tailwind v4 uses **no `tailwind.config.js`**. Configuration is done via CSS `@theme` blocks inside `app.css`. The `@tailwindcss/vite` plugin replaces the old PostCSS setup. When running `npx shadcn@latest init`, it auto-detects v4 and writes the correct CSS-based config. **Do not create a `tailwind.config.js`.**

shadcn/ui v4 writes components into `src/components/ui/` as owned source files (not a node_modules dep). These files are committed and fully editable.

### Dark Mode Setup

Configure dark mode as `class`-based (required by architecture for `class`-based Tailwind dark mode). In `src/main.tsx`, default to system preference:
```typescript
if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.classList.add('dark')
}
```
This is the only place dark mode is set in v1 — no user toggle.

### Backend File Structure

This story creates the skeleton only. Do not implement task models, scheduler setup, or push service — those come in Stories 1.2, 2.1, and 2.2 respectively. Create `__init__.py` stubs for each module directory.

**`app/config.py` pattern:**
```python
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str
    allowed_origins: str  # comma-separated string from env
    vapid_private_key: str = ""
    vapid_public_key: str = ""
    vapid_claim_email: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
```

**`app/main.py` CORS pattern:**
```python
from fastapi.middleware.cors import CORSMiddleware
origins = [o.strip() for o in settings.allowed_origins.split(",") if o.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["*"], allow_headers=["*"])
```
In production (`ALLOWED_ORIGINS=` empty), origins list is empty and CORS is effectively disabled (same-origin via Caddy).

**`app/database.py` async pattern:**
```python
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
engine = create_async_engine(settings.database_url, echo=False)
async_session_factory = async_sessionmaker(engine, expire_on_commit=False)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session
```

### Alembic Async Setup

The Alembic `env.py` requires special handling for async. Use the `run_sync` pattern from SQLAlchemy docs:
```python
from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine
import asyncio

def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()

async def run_async_migrations():
    engine = create_async_engine(config.get_main_option("sqlalchemy.url"))
    async with engine.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await engine.dispose()

asyncio.run(run_async_migrations())
```

Set `sqlalchemy.url` in `alembic.ini` to `sqlite+aiosqlite:///./simple-todo.db` as a default; `DATABASE_URL` from env overrides this in `env.py`.

### shadcn/ui v4 Init Notes

The `--preset nova` flag selects the Nova preset (Lucide + Geist font). It sets up class-based dark mode via `@custom-variant dark (&:is(.dark *))` in `index.css`. The `index.css` is updated by shadcn to include full design token setup. Path alias `@/*` in `tsconfig.app.json` must be set before running init (shadcn requires it).

TypeScript `baseUrl` is deprecated in TS7 — add `"ignoreDeprecations": "6.0"` to suppress the warning. Use `defineConfig` from `vitest/config` (not `vite`) to include `test` property types.

### VAPID Key Storage

Private key stored as base64url-encoded PKCS8 PEM in `backend/.env`. Public key stored as base64url-encoded uncompressed EC point — this exact format is required by the Web Push API subscription in the browser. The same public key is mirrored to `frontend/.env`.

### pytest Empty-Project Setup

Create `backend/tests/__init__.py` and `backend/tests/conftest.py`. Add to `pyproject.toml`:
```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

### Project Structure Notes

This story creates the **full project skeleton** — every directory and stub file the architecture defines, even if empty. Future stories add content to these files without creating new directories.

Exact directory structure to create (from architecture):
```
simple-todo/
├── .gitignore
├── README.md
├── Caddyfile          # can be minimal placeholder
├── frontend/
│   ├── package.json   (from vite scaffold)
│   ├── vite.config.ts (updated with Tailwind + shadcn + PWA)
│   ├── tsconfig.json
│   ├── index.html
│   ├── .env
│   ├── .env.example
│   └── src/
│       ├── main.tsx
│       ├── router.tsx     (stub)
│       ├── index.css      (Tailwind v4 import + shadcn tokens)
│       ├── features/tasks/
│       ├── features/voice/
│       ├── features/notifications/
│       ├── components/ui/ (populated by shadcn init)
│       ├── hooks/
│       └── lib/
│           ├── api.ts         (stub Axios instance)
│           ├── queryClient.ts (stub TanStack Query client)
│           ├── store.ts       (stub Zustand store)
│           ├── offsets.ts     (stub)
│           └── dateUtils.ts   (stub)
└── backend/
    ├── pyproject.toml
    ├── .env
    ├── .env.example
    ├── alembic.ini
    ├── alembic/env.py (async configured)
    ├── alembic/versions/ (initial migration)
    └── app/
        ├── main.py
        ├── config.py
        ├── database.py
        ├── models/__init__.py + base.py
        ├── schemas/__init__.py
        ├── routers/__init__.py
        └── ...
```

### Anti-Patterns to Avoid

- **Do not create `tailwind.config.js`** — Tailwind v4 is CSS-first; using a config file will break shadcn/ui v4 compatibility
- **Do not use `pip` or `poetry`** — uv is the package manager for this project
- **Do not implement any business logic** in this story — health endpoint only; Task model is Story 1.2
- **Do not skip Alembic setup** — even with an empty migration, the pattern must be established for Story 1.2
- **Do not commit `.env` files** — VAPID keys and DB credentials are secrets
- **Do not use synchronous SQLAlchemy** — the entire backend uses `async`/`await` with `aiosqlite`

### References

- Init sequence: [starter-template-evaluation.md#initialization-sequence](../_bmad-output/planning-artifacts/architecture/starter-template-evaluation.md)
- Architecture decisions: [core-architectural-decisions.md](../_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md)
- File structure: [project-structure-boundaries.md#complete-project-directory-structure](../_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md)
- Naming/patterns: [implementation-patterns-consistency-rules.md](../_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md)
- Epic 1 story context: [epic-1-task-management-foundation.md](../_bmad-output/planning-artifacts/epics/epic-1-task-management-foundation.md)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- shadcn/ui v4 `--base-color` flag removed; use `--preset nova` instead
- `baseUrl` in tsconfig deprecated in TS7; fixed with `"ignoreDeprecations": "6.0"`
- `test` property in vite.config.ts requires importing `defineConfig` from `vitest/config` (not `vite`)
- vitest exits code 1 with no test files by default; fixed with `passWithNoTests: true`
- uv must be sourced from `$HOME/.local/bin/env` before use in non-interactive shell

### Completion Notes List

- All 8 tasks and subtasks completed and verified
- Backend: `GET /health` returns `{"status":"ok"}` (200); CORS configured via ALLOWED_ORIGINS
- Backend: `uv run alembic upgrade head` completes against fresh SQLite DB
- Backend: `uv run pytest` passes (1 test — health endpoint integration test)
- Backend: `uv run ruff check .` passes (2 auto-fixed unused imports in initial migration)
- Frontend: `npx vitest run` passes with `passWithNoTests: true`
- Frontend: `npm run build` succeeds; PWA service worker generated
- VAPID keys generated and stored in `backend/.env`; public key mirrored to `frontend/.env`
- Full skeleton directory structure created matching architecture spec

### Change Log

- Initial implementation: 2026-05-24
- Code review: 2026-05-24

### Review Findings

- [x] [Review][Decision] App.tsx is the Vite welcome template — Should the default Vite demo (counter, logos, external "Learn React" links) be left in as a visible "scaffold works" smoke screen until Story 1.3 wires the real shell, or replaced now with a minimal `<App>` shell? External `target="_blank"` links currently lack `rel="noopener noreferrer"`.

- [x] [Review][Patch] shadcn files written to literal `frontend/@/` directory — `cn()` and `Button` will not resolve at build time [frontend/@/components/ui/button.tsx, frontend/@/lib/utils.ts, frontend/components.json:tsconfig]
- [x] [Review][Patch] Missing `frontend/src/lib/utils.ts` — `import { cn } from "@/lib/utils"` in button.tsx has no target (same root cause as the `@/` directory bug)
- [x] [Review][Patch] Stray `backend/main.py` uv-init stub committed — real entrypoint is `app.main:app` [backend/main.py]
- [x] [Review][Patch] Empty `backend/README.md` committed (uv-init artifact) [backend/README.md]
- [x] [Review][Patch] `frontend/README.md` is unmodified Vite scaffold boilerplate [frontend/README.md]
- [x] [Review][Patch] CORS `allow_credentials=True` deviates from spec pattern — silently breaks with empty `ALLOWED_ORIGINS` and footguns the `*` case [backend/app/main.py:18-24]
- [x] [Review][Patch] shadcn `baseColor: "neutral"` should be `"zinc"` per spec Task 2 [frontend/components.json:7]
- [x] [Review][Patch] TypeScript `strict: true` missing — spec requires "TypeScript 5 (strict)" [frontend/tsconfig.app.json]
- [x] [Review][Patch] `shadcn` (the CLI) is listed under runtime `dependencies` — should not be a runtime dep [frontend/package.json:24]
- [x] [Review][Patch] `@import "shadcn/tailwind.css"` in index.css references a non-existent package path; design tokens already live in `@theme` block — remove the import [frontend/src/index.css:3]
- [x] [Review][Patch] Alembic `env.py` imports only `app.models.base` — concrete model modules must be imported for autogenerate to see metadata; add explicit import block (currently silent footgun for Story 1.2) [backend/alembic/env.py:9]
- [x] [Review][Patch] Alembic `env.py` reads `DATABASE_URL` via `os.environ` directly and never loads `.env`, while the app uses pydantic-settings (auto-loads `.env`) — migrations and runtime can target different DBs without warning [backend/alembic/env.py:18 vs backend/app/config.py:11]
- [x] [Review][Patch] `.gitignore` `*.env` pattern does not cover Vite's `.env.local` convention — add `.env.local` and `.env.*.local` [.gitignore]
- [x] [Review][Patch] `config.py` provides defaults for `database_url` and `allowed_origins`; spec pattern declares them as required (no default) — silently masks missing `.env` [backend/app/config.py:6-9]
- [x] [Review][Patch] `.gitignore` lists `dist/` twice and adds redundant `frontend/dist/` [.gitignore:17,29-30]

- [x] [Review][Defer] SQLite `busy_timeout` / `connect_args` not configured — `database is locked` risk under scheduler+request contention [backend/app/database.py:7] — deferred, post-MVP tuning
- [x] [Review][Defer] `/health` does not exercise DB — false-positive readiness for Railway/Caddy [backend/app/main.py:25] — deferred, liveness-only by design for now
- [x] [Review][Defer] `get_db` dependency has no commit/rollback wrapper — routes will need to manage transactions [backend/app/database.py:11] — deferred to Story 1.2 when first writes land
- [x] [Review][Defer] pytest async fixture / engine state leak across tests — engine is a module-level singleton with no reset [backend/tests/conftest.py] — deferred until DB-touching tests exist
- [x] [Review][Defer] `api.ts` silently falls back to current origin if `VITE_API_BASE_URL` is unset [frontend/src/lib/api.ts:4] — deferred, add startup warn when used
- [x] [Review][Defer] `formatDeadline` / `isOverdue` don't guard against invalid ISO input — `Invalid Date` UI corruption or silent false [frontend/src/lib/dateUtils.ts] — deferred, harden when wired
- [x] [Review][Defer] `main.tsx` non-null assertion on `#root` + dark-mode change-listener missing [frontend/src/main.tsx:9-13] — deferred, minor
- [x] [Review][Defer] Service worker may intercept `/api/*` fetches with default Workbox precache [frontend/vite.config.ts:11] — deferred to Story 5.1
- [x] [Review][Defer] VAPID empty-string defaults silently accepted — push errors deferred to first send [backend/app/config.py:7-9] — deferred to Story 2.2
- [x] [Review][Defer] `engine.dispose()` not called in lifespan shutdown — pooled connection leak on graceful shutdown [backend/app/main.py:9-12] — deferred, minor
- [x] [Review][Defer] `asyncio.run()` in `alembic/env.py` will fail if invoked from inside a running event loop [backend/alembic/env.py:42] — deferred, only matters if auto-migrate-on-startup is added
- [x] [Review][Defer] CORS origin matching is case-sensitive and does not strip trailing slash [backend/app/main.py:14] — deferred, niche dev pitfall
- [x] [Review][Defer] `frontend/eslint.config.js` and ESLint deps are Vite-scaffold extras not in spec — harmless, defer cleanup
- [x] [Review][Defer] Read-only / missing volume in prod crashes obscurely at first DB hit [backend/app/database.py:7] — deferred, deploy hardening

### File List

**New files (backend):**
- backend/pyproject.toml
- backend/uv.lock
- backend/.env *(not committed — secrets)*
- backend/.env.example
- backend/alembic.ini
- backend/alembic/env.py
- backend/alembic/README
- backend/alembic/script.py.mako
- backend/alembic/versions/2db4a410524d_initial.py
- backend/app/__init__.py
- backend/app/main.py
- backend/app/config.py
- backend/app/database.py
- backend/app/models/__init__.py
- backend/app/models/base.py
- backend/app/schemas/__init__.py
- backend/app/routers/__init__.py
- backend/app/services/__init__.py
- backend/app/scheduler/__init__.py
- backend/tests/__init__.py
- backend/tests/conftest.py
- backend/tests/test_health.py

**New files (frontend):**
- frontend/package.json
- frontend/package-lock.json
- frontend/vite.config.ts
- frontend/tsconfig.json
- frontend/tsconfig.app.json
- frontend/tsconfig.node.json
- frontend/index.html
- frontend/components.json
- frontend/.env *(not committed — secrets)*
- frontend/.env.example
- frontend/src/main.tsx
- frontend/src/App.tsx
- frontend/src/App.css
- frontend/src/index.css
- frontend/src/router.tsx
- frontend/src/vite-env.d.ts
- frontend/src/lib/api.ts
- frontend/src/lib/queryClient.ts
- frontend/src/lib/store.ts
- frontend/src/lib/offsets.ts
- frontend/src/lib/dateUtils.ts
- frontend/src/lib/utils.ts *(from shadcn init)*
- frontend/src/components/ui/button.tsx *(from shadcn init)*
- frontend/src/features/tasks/ *(empty dir)*
- frontend/src/features/voice/ *(empty dir)*
- frontend/src/features/notifications/ *(empty dir)*
- frontend/src/hooks/ *(empty dir)*

**New files (root):**
- .git/
- .gitignore
- README.md
- Caddyfile
