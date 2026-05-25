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

## Deferred from: code review of 1-5-task-detail-edit (2026-05-24)

- View transition CSS doesn't distinguish push (→) vs pop (←) navigation direction — both animate slide-in-from-right. CSS View Transitions API doesn't expose direction without custom routing wrappers; would require navigator.navigate() integration or JS-controlled class toggling. [frontend/src/index.css]
- `navigate(-1)` on error path can navigate the user outside the SPA if they arrived via direct/shared link or bookmark. Would need a history-length guard (`window.history.length > 1`) or fallback to `navigate('/')`. Consistent with existing pattern elsewhere. [frontend/src/features/tasks/TaskDetail.tsx]

## Deferred from: code review of 1-6-task-completion-archive (2026-05-24)

- `formatDeadline`/`isOverdue` pass Invalid Date through silently — pre-existing, tracked in earlier entries. [frontend/src/lib/dateUtils.ts]
- `useArchiveQuery` unbounded payload grows with completed task count — add pagination when data volume warrants (Story 2.1+). [frontend/src/features/tasks/useTasks.ts]
- `null completed_at` sort non-determinism — tasks with null `completed_at` compare as equal; shouldn't occur per API contract but worth hardening in a data-integrity pass. [frontend/src/features/tasks/useTasks.ts]
- Multi-touch swipe miscalculation — simultaneous touches can produce a spurious swipe delta; acceptable edge case for v1. [frontend/src/features/tasks/TaskCard.tsx]
- Swipe does not animate progressively (no touchmove handler) — snaps on release rather than sliding under the finger; upgrade in a UX polish story. [frontend/src/features/tasks/TaskCard.tsx]

## Deferred from: code review of 1-7-task-deletion (2026-05-25)

- `TaskDetail` stale-task flicker after delete — cache invalidation can cause a brief "Task not found" flash before `navigate('/')` completes; theoretical race, acceptable for v1. [frontend/src/features/tasks/TaskDetail.tsx]

## Deferred from: code review of 2-1-apscheduler-sqlalchemy-job-store (2026-05-25)

- No guard for past fire dates in `schedule_reminders` — `misfire_grace_time=120` is intentional; add validation when Story 2.4 wires scheduler to task mutations. [backend/app/services/scheduler_service.py:11]
- VAPID key validity not checked at startup — log-and-swallow on delivery failure is spec-intended; startup validation is a future hardening concern. [backend/app/config.py / push_service.py]
- `_sync_url` via `str.replace("+aiosqlite", "")` is brittle — works for the fixed SQLite URL; use `sqlalchemy.engine.make_url` if drivers ever change. [backend/app/scheduler/setup.py:6]

## Deferred from: code review of 2-2-push-subscription-vapid-backend (2026-05-25)

- `p256dh`/`auth` fields accept any string — no base64url format validation; add in a future security hardening story. [backend/app/schemas/push.py]
- 410 Gone from push service silently swallowed — stale subscription pruning logic needed; future story. [backend/app/services/push_service.py:32-33]
- No `DELETE /unsubscribe` endpoint — stale subscriptions accumulate indefinitely; add in a future story. [backend/app/routers/push.py]
- CORS `allow_credentials` not set — pre-existing config; revisit if PWA credentialed requests fail in production. [backend/app/main.py]

## Deferred from: code review of 2-4, 2-5, 2-6 (2026-05-25)

- All push subscriptions receive every notification regardless of task/user ownership — `select(PushSubscription)` has no filtering; architectural scope for multi-user story. [backend/app/scheduler/jobs.py]
- `_sync_engine` in jobs.py created at import time with string-replace URL — brittle, inherited from Story 2-1 pattern; use `make_url` if drivers change. [backend/app/scheduler/jobs.py]
- delete_task cancel→push race — APScheduler thread-pool may execute send_notification after cancel_task_jobs returns but before db.delete commits; requires APScheduler-level locking or saga pattern. [backend/app/services/task_service.py]
- Double-tap Save race — two concurrent `requestPermission()` calls possible before isPending gates the button; browser behaviour for concurrent permission prompts is undefined. [frontend/src/features/voice/ConfirmationSheet.tsx, EditSheet.tsx]

## Deferred from: code review of 2-3-offset-selection-ui (2026-05-25)

- `update_task` calls `schedule_reminders` with no guard for already-completed tasks — Story 2.4 scope; low risk since API layer won't call `update_task` after `complete_task`. [backend/app/services/task_service.py]
- `cancel_task_jobs` called before `db.delete` — not atomic; if commit fails, task survives but its APScheduler jobs are gone. Requires saga/transaction pattern. [backend/app/services/task_service.py]
- Scheduler calls in `update_task` have no error handling — if `schedule_reminders` raises, reminders are silently dropped after a cancel; caller gets 200. Story 2.4 scope. [backend/app/services/task_service.py]
- No server-side validation that offset values are within the allowed set `[15, 30, 60, 1440, 2880]` — frontend enforces this; backend accepts arbitrary positive ints. Add `Field` validator in a future hardening pass. [backend/app/schemas/task.py]
- `parse_offsets` silently returns `[]` on corrupt DB JSON with no log — data loss invisible to caller. Add warning log in a future hardening story. [backend/app/schemas/task.py]
- `hasPastWarning` not cleared reactively when offsets/deadline changes, only on Save — minor stale UX; spec ties warning to Save tap so this is intentional. [frontend/src/features/voice/ConfirmationSheet.tsx, EditSheet.tsx]
- `EditSheet` dirty-check baseline shifts when React Query refetches `task` prop mid-session — spurious save when task is refetched between edits; acceptable for MVP. [frontend/src/features/voice/EditSheet.tsx]

## Deferred from: code review of 2-7-notification-deep-link and 2-8-trust-banner (2026-05-25)

- `windowClients[0]` picks arbitrary window with no URL filtering when multiple tabs are open — single-user PWA, acceptable scope. [frontend/src/service-worker.ts]
- `formatBannerMessage` with invalid `deadlineUtcIso` renders "Invalid Date" — not reachable at runtime since deadline is validated before save; defer to future hardening. [frontend/src/lib/offsets.ts]
