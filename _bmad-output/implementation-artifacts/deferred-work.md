# Deferred Work

## Deferred from: code review of story-1.1 (2026-05-24)

- SQLite `busy_timeout` / `connect_args` not configured — `database is locked` risk under scheduler+request contention. [backend/app/database.py]
- `/health` does not exercise DB — false-positive readiness signal. [backend/app/main.py]
- `get_db` dependency has no commit/rollback wrapper — routes must manage transactions. [backend/app/database.py]
- pytest async fixture / engine state leak across tests — module-level engine singleton with no reset. [backend/tests/conftest.py]
- `api.ts` silently falls back to current origin if `VITE_API_BASE_URL` is unset. [frontend/src/lib/api.ts]
- `formatDeadline` / `isOverdue` don't guard against invalid ISO input. [frontend/src/lib/dateUtils.ts]
- `main.tsx` non-null assertion on `#root` + no dark-mode change-listener. [frontend/src/main.tsx]
- Service worker may intercept `/api/*` fetches with default Workbox precache — revisit in Story 5.1. [frontend/vite.config.ts]
- VAPID empty-string defaults silently accepted — failure deferred to first push send. Revisit in Story 2.2. [backend/app/config.py]
- `engine.dispose()` not called in lifespan shutdown — pooled connection leak. [backend/app/main.py]
- `asyncio.run()` in `alembic/env.py` will fail if invoked from a running event loop — only matters if auto-migrate-on-startup is added. [backend/alembic/env.py]
- CORS origin matching is case-sensitive and does not strip trailing slash. [backend/app/main.py]
- `frontend/eslint.config.js` and ESLint deps are Vite-scaffold extras not in spec — harmless, cleanup later.
- Read-only / missing volume in prod crashes obscurely at first DB hit. [backend/app/database.py]

## Deferred from: code review of story-1.2 (2026-05-24)

- TOCTOU read-then-write without row locking — use `with_for_update()` when migrating to PostgreSQL (Story 2.1+). [backend/app/services/task_service.py]
- No max length on `name`/`description` — add `String(255)` + Pydantic `max_length` in a hardening pass. [backend/app/models/task.py, backend/app/schemas/task.py]
- No pagination on `GET /api/v1/tasks/` — add `limit`/`offset` when data volume warrants. [backend/app/routers/tasks.py]
- Past `deadline_at` values not rejected — intentional for now; revisit when scheduler lands (Story 2.4). [backend/app/schemas/task.py]
- Shared `db_session` test fixture without savepoint rollback — works because engine is per-fixture; fragile if scope changes. [backend/tests/conftest.py]
- 404 envelope nested `detail` key — latent fragility if custom exception handler removed; works at runtime. [backend/app/routers/tasks.py, backend/app/main.py]
- `include_archived` parameter naming maps to `is_completed` logic — consistent with story spec; reconsider at a terminology pass. [backend/app/routers/tasks.py]
- Service layer lacks unit-of-work / cross-function transaction abstraction — Story 2.4 concern for atomic scheduler+task mutations. [backend/app/services/task_service.py]

## Deferred from: code review of 1-3-frontend-foundation-task-list (2026-05-24)

- `isOverdue`/`formatDeadline` don't guard against invalid ISO input — `new Date('invalid')` renders "Invalid Date" silently; guard in later story. [frontend/src/lib/dateUtils.ts]
- `VITE_API_BASE_URL` unset falls back silently to current origin — works in dev, fails in cross-origin environments; fix in production setup story. [frontend/src/lib/api.ts]
- Dark mode only applied once on mount — no listener for system preference changes mid-session; v1 known limitation. [frontend/src/main.tsx]
- No error boundary around RouterProvider — unhandled component error causes blank white screen; add in a later hardening story. [frontend/src/main.tsx]

## Deferred from: code review of 1-4-text-task-creation (2026-05-24)

- Cannot clear/unset deadline once set in DeadlineChip — `if (e.target.value)` guard silently ignores picker dismissal with no value; user must reopen and re-select. Acceptable for v1. [frontend/src/features/voice/DeadlineChip.tsx]
- `key={String(open)}` may unmount SheetForm during Radix slide-out animation, causing brief visual flash (form disappears before sheet closes). Low user impact, acceptable for v1. [frontend/src/features/voice/ConfirmationSheet.tsx]
