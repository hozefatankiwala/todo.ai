# Story 2.6: Notification Delivery & Content

Status: done

## Story

As a user,
I want to receive a push notification on my device at the scheduled time with the task name and time-to-deadline,
so that I am reminded of the task at exactly the right moment.

## Acceptance Criteria

1. **Given** a task has a scheduled APScheduler job
   **When** the job fires (`send_notification(task_id, offset_minutes)` in `scheduler/jobs.py`)
   **Then** `push_service.send_web_push(subscription, payload)` is called with payload: `{"title": "{task name}", "body": "{task name} — due in {human offset}", "task_id": "{id}"}`
   **And** the human offset maps: 15→"15 minutes", 30→"30 minutes", 60→"1 hour", 1440→"1 day", 2880→"2 days"

2. **Given** the service worker receives the push event
   **When** the push data is parsed
   **Then** `self.registration.showNotification(title, {body, data: {task_id}})` is called; the notification is visible on the device lock screen

3. **Given** the notification fires
   **When** I check the timing
   **Then** the notification fires within ±60 seconds of the scheduled UTC time (APScheduler `misfire_grace_time=120` already handles this)

4. **Given** the service worker is registered
   **When** I inspect the frontend build
   **Then** `vite-plugin-pwa` generates the service worker; the push event handler and `notificationclick` handler are in `src/service-worker.ts`

## Tasks / Subtasks

- [x] Task 1: Implement `send_notification` in `backend/app/scheduler/jobs.py` (AC: 1)
  - [x] Remove the `pass` stub; implement the full body (see Dev Notes for complete implementation)
  - [x] Import `logging` and create `logger = logging.getLogger(__name__)`
  - [x] Query DB for the task: create a synchronous SQLAlchemy session (NOT async) using the sync URL — APScheduler jobs run in a thread pool, not the async event loop (see Dev Notes)
  - [x] If task not found or `task.is_completed`, log a warning and return without sending
  - [x] Query all push subscriptions from DB (iterate all rows in `push_subscriptions` table)
  - [x] For each subscription, call `push_service.send_web_push(subscription, payload)` with the correct payload structure
  - [x] Build payload: `{"title": task.name, "body": f"{task.name} — due in {_human_offset(offset_minutes)}", "task_id": str(task.id)}`
  - [x] Add `_human_offset(minutes: int) -> str` private function mapping: `{15: "15 minutes", 30: "30 minutes", 60: "1 hour", 1440: "1 day", 2880: "2 days"}`; for unknown offsets use `f"{minutes} minutes"` as fallback
  - [x] Docstring must stay: `"""Scheduler job functions. Must not perform DB mutations."""`

- [x] Task 2: Add sync SQLAlchemy session factory for jobs (AC: 1)
  - [x] In `backend/app/scheduler/jobs.py`, create a sync engine and session factory using the sync SQLite URL (same pattern as scheduler setup: strip `+aiosqlite` from `settings.database_url`)
  - [x] Use `from sqlalchemy import create_engine` and `from sqlalchemy.orm import sessionmaker`
  - [x] Create `_sync_engine = create_engine(settings.database_url.replace("+aiosqlite", ""))` at module level
  - [x] Create `_SyncSession = sessionmaker(_sync_engine)` at module level
  - [x] In `send_notification`, use `with _SyncSession() as session:` to query task and subscriptions
  - [x] No async here — the function is synchronous (called from APScheduler thread pool)

- [x] Task 3: Create `frontend/src/service-worker.ts` with push event handler (AC: 2, 4)
  - [x] Create `frontend/src/service-worker.ts` — this is the custom service worker file for `vite-plugin-pwa`'s `injectManifest` strategy (see Dev Notes for vite.config.ts update)
  - [x] Declare `self` as `ServiceWorkerGlobalScope` at top: `declare const self: ServiceWorkerGlobalScope`
  - [x] Add `push` event listener: parse `event.data.json()` to get `{ title, body, task_id }`, then call `event.waitUntil(self.registration.showNotification(title, { body, data: { task_id } }))`
  - [x] Add `notificationclick` event listener (stub for Story 2.7): `event.notification.close()` and open/focus the app — for now just close the notification: `event.waitUntil(event.notification.close())`
  - [x] Add workbox precache manifest injection: `import { precacheAndRoute } from 'workbox-precaching'; precacheAndRoute(self.__WB_MANIFEST)` (required by `injectManifest` strategy)

- [x] Task 4: Update `vite.config.ts` to use `injectManifest` strategy and register `service-worker.ts` (AC: 4)
  - [x] Update `VitePWA()` options: change from `VitePWA({ registerType: 'autoUpdate' })` to the `injectManifest` config (see Dev Notes for complete config)
  - [x] Set `strategies: 'injectManifest'`, `srcDir: 'src'`, `filename: 'service-worker.ts'`
  - [x] Keep `registerType: 'autoUpdate'`

- [x] Task 5: Add `workbox-precaching` dependency (AC: 4)
  - [x] Run `cd frontend && npm install workbox-precaching` — required for `precacheAndRoute` in service-worker.ts
  - [x] Verify it's added to `package.json` dependencies

- [x] Task 6: Backend tests for `send_notification` job (AC: 1)
  - [x] In `backend/tests/test_scheduler.py`, add tests for `send_notification`
  - [x] Test: `send_notification(task_id, 60)` with existing task and subscription → `push_service.send_web_push` called with correct payload `{"title": task.name, "body": f"{task.name} — due in 1 hour", "task_id": str(task.id)}`
  - [x] Test: `send_notification(task_id, 60)` for non-existent task → `push_service.send_web_push` NOT called, no exception raised
  - [x] Test: `send_notification(task_id, 60)` for completed task → `push_service.send_web_push` NOT called
  - [x] Test: `_human_offset` mapping for all 5 known values (15, 30, 60, 1440, 2880) and fallback
  - [x] Test: `send_notification` with no subscriptions in DB → no call to `send_web_push`, no error
  - [x] Use a real in-memory SQLite DB for tests (not the app singleton) — create tables, insert test data, pass session to the function via mock OR restructure test to use the sync session

- [x] Task 7: Run all tests and verify (AC: 1–4)
  - [x] `cd backend && uv run pytest tests/ -v` — all tests pass (41/41)
  - [x] `cd backend && uv run ruff check app/` — lint clean
  - [x] `cd frontend && npx vite build` — build succeeds; `dist/service-worker.js` generated by vite-plugin-pwa
  - [x] Frontend TypeScript error in `usePushSubscription.ts` is pre-existing (from story 2-5, not introduced by this story)

## Dev Notes

### CRITICAL: `send_notification` Must Be Synchronous with Sync DB Access

APScheduler 3.x runs job functions in a **thread pool executor** (for `AsyncIOScheduler`). Job functions are NOT called in the async event loop — they run in regular threads. This means:
- `send_notification` must be a regular `def`, NOT `async def`
- It CANNOT use `await`, `asyncio.run()`, or `AsyncSession`
- It MUST use a synchronous SQLAlchemy `Session` with a sync engine

The pattern from Story 2.1 (`scheduler/setup.py` strips `+aiosqlite` for the sync job store URL) applies here:

```python
# backend/app/scheduler/jobs.py
import logging

from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.models.push_subscription import PushSubscription
from app.models.task import Task
from app.services import push_service

logger = logging.getLogger(__name__)

_sync_engine = create_engine(settings.database_url.replace("+aiosqlite", ""))
_SyncSession = sessionmaker(_sync_engine)

OFFSET_LABELS = {
    15: "15 minutes",
    30: "30 minutes",
    60: "1 hour",
    1440: "1 day",
    2880: "2 days",
}


def _human_offset(minutes: int) -> str:
    return OFFSET_LABELS.get(minutes, f"{minutes} minutes")


def send_notification(task_id: int, offset_minutes: int) -> None:
    """Fire a push notification for a task at the scheduled offset.

    Scheduler job functions. Must not perform DB mutations.
    """
    with _SyncSession() as session:
        task = session.get(Task, task_id)
        if task is None:
            logger.warning("send_notification: task %d not found, skipping", task_id)
            return
        if task.is_completed:
            logger.info("send_notification: task %d is completed, skipping", task_id)
            return

        subscriptions = session.execute(select(PushSubscription)).scalars().all()
        if not subscriptions:
            logger.info("send_notification: no push subscriptions found, skipping")
            return

        payload = {
            "title": task.name,
            "body": f"{task.name} — due in {_human_offset(offset_minutes)}",
            "task_id": str(task.id),
        }
        for sub in subscriptions:
            push_service.send_web_push(sub, payload)
```

**Key architecture rules from Story 2.2:**
- `send_web_push` is synchronous (correct — called from thread pool)
- `send_web_push` catches all exceptions internally — no need to wrap in try/except here
- The docstring "Must not perform DB mutations" stays — this function only reads

### Service Worker: `injectManifest` Strategy

`vite-plugin-pwa` has two strategies:
- `generateSW` (default): auto-generates the service worker entirely — you cannot add custom event handlers
- `injectManifest`: compiles YOUR service worker file (`src/service-worker.ts`) and injects the Workbox precache manifest — you control the full SW code

Story 2.6 needs a custom push event handler, so `injectManifest` is required. Update `vite.config.ts`:

```typescript
// frontend/vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.ts',
      injectManifest: {
        swDest: 'dist/sw.js',
      },
    }),
  ],
  // ... rest unchanged
})
```

### Service Worker: Complete `src/service-worker.ts`

```typescript
// frontend/src/service-worker.ts
/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

// Workbox precache manifest — injected by vite-plugin-pwa at build time
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json() ?? {}
  const title = data.title ?? 'Reminder'
  const body = data.body ?? ''
  const taskId = data.task_id

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      data: { task_id: taskId },
    })
  )
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  // Deep-link navigation handled in Story 2.7
  // For now, just close the notification
})
```

**TypeScript note:** `self.__WB_MANIFEST` is injected by `vite-plugin-pwa` at build time. TypeScript doesn't know about it — add a declaration:

```typescript
// At top of service-worker.ts, after imports:
declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>
}
```

Or alternatively, install `@vite-pwa/assets-generator` types — but the inline declaration is simpler and avoids an extra dependency.

### Service Worker TypeScript: `lib: ["webworker"]` Not Needed

The `/// <reference lib="webworker" />` triple-slash directive at the top of `service-worker.ts` tells TypeScript to use the `lib.webworker.d.ts` type definitions for that file, providing `ServiceWorkerGlobalScope`, `PushEvent`, `NotificationEvent` etc. This avoids adding `"webworker"` to the global `tsconfig.json` `lib` array (which would conflict with DOM types in the rest of the app).

### Backend Tests: Isolating the Sync DB in `test_scheduler.py`

The `send_notification` function creates its own sync session from the module-level `_SyncSession`. Tests need to either:
1. Patch `_SyncSession` to use an in-memory test DB, OR
2. Patch `send_notification`'s internals directly

**Recommended approach — patch `_SyncSession`:**

```python
# backend/tests/test_scheduler.py (additions)
import json
from types import SimpleNamespace
from unittest.mock import patch, MagicMock

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.base import Base
from app.models.task import Task
from app.models.push_subscription import PushSubscription
from app.scheduler import jobs


def make_sync_test_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    return sessionmaker(engine)


def test_send_notification_calls_push_service(monkeypatch):
    Session = make_sync_test_session()
    with Session() as session:
        task = Task(
            name="Buy milk",
            deadline_at=__import__('datetime').datetime(2026, 6, 5, 10, 0, tzinfo=__import__('datetime').timezone.utc),
            offsets=json.dumps([60]),
        )
        session.add(task)
        sub = PushSubscription(endpoint="https://ex.com", p256dh="abc", auth="xyz")
        session.add(sub)
        session.commit()
        task_id = task.id

    monkeypatch.setattr("app.scheduler.jobs._SyncSession", Session)

    with patch("app.scheduler.jobs.push_service.send_web_push") as mock_push:
        jobs.send_notification(task_id, 60)

    mock_push.assert_called_once()
    payload = mock_push.call_args[0][1]
    assert payload["title"] == "Buy milk"
    assert payload["body"] == "Buy milk — due in 1 hour"
    assert payload["task_id"] == str(task_id)


def test_send_notification_skips_missing_task(monkeypatch):
    Session = make_sync_test_session()
    monkeypatch.setattr("app.scheduler.jobs._SyncSession", Session)

    with patch("app.scheduler.jobs.push_service.send_web_push") as mock_push:
        jobs.send_notification(99999, 60)  # non-existent task

    mock_push.assert_not_called()


def test_send_notification_skips_completed_task(monkeypatch):
    Session = make_sync_test_session()
    with Session() as session:
        import datetime
        task = Task(
            name="Done task",
            deadline_at=datetime.datetime(2026, 6, 5, 10, 0, tzinfo=datetime.timezone.utc),
            is_completed=True,
        )
        session.add(task)
        session.commit()
        task_id = task.id

    monkeypatch.setattr("app.scheduler.jobs._SyncSession", Session)

    with patch("app.scheduler.jobs.push_service.send_web_push") as mock_push:
        jobs.send_notification(task_id, 60)

    mock_push.assert_not_called()


def test_human_offset_mapping():
    assert jobs._human_offset(15) == "15 minutes"
    assert jobs._human_offset(30) == "30 minutes"
    assert jobs._human_offset(60) == "1 hour"
    assert jobs._human_offset(1440) == "1 day"
    assert jobs._human_offset(2880) == "2 days"
    assert jobs._human_offset(90) == "90 minutes"  # fallback
```

**Note on `is_completed` default:** The `Task` model has `server_default=sa.false()` for `is_completed`, but when creating objects in tests without going through the DB, `is_completed` will be `None` or whatever the Python default is. To be safe, explicitly set `is_completed=False` when creating test tasks.

### Architecture Boundary: No DB Mutations in Jobs

The docstring constraint "Must not perform DB mutations" is enforced by architecture. `send_notification` ONLY reads:
- `session.get(Task, task_id)` — read
- `session.execute(select(PushSubscription))` — read

If in the future a job needs to prune stale subscriptions (410 Gone handling), that belongs in a separate cleanup job, not in `send_notification`.

### `task_id` as String in Payload

AC 1 specifies `"task_id": "{id}"` — note the quotes, meaning it's a string in the payload. This is intentional: Web Push payloads are JSON strings, and the service worker receives `event.data.json()` which will parse `"task_id"` as a string. The deep-link handler (Story 2.7) uses `data.task_id` from the notification, and React Router's `useParams()` returns strings. Consistency is maintained by keeping `task_id` as string throughout.

### Files Being Modified

| File | Current State | Story 2.6 Changes |
|---|---|---|
| `backend/app/scheduler/jobs.py` | `send_notification` is a `pass` stub | REPLACE stub with full implementation; ADD sync DB session factory at module level |
| `frontend/vite.config.ts` | `VitePWA({ registerType: 'autoUpdate' })` | UPDATE to `injectManifest` strategy pointing to `service-worker.ts` |
| `backend/tests/test_scheduler.py` | Tests for schedule/cancel only | ADD `send_notification` tests |

**New files:**
- `frontend/src/service-worker.ts` (NEW)

### `workbox-precaching` Install Note

`workbox-precaching` is a dependency of `vite-plugin-pwa` — it may already be present in `node_modules` as a transitive dependency. Check with `ls frontend/node_modules/workbox-precaching` before running `npm install`. If present, just import it. If not, run `npm install workbox-precaching`.

### Verification: Service Worker Registration

After `npm run build`, verify the service worker is included:
- `ls frontend/dist/sw.js` — should exist
- The service worker will be auto-registered by `vite-plugin-pwa` via the `registerType: 'autoUpdate'` config

In development (`npm run dev`), the service worker is NOT active (Vite dev server does not run service workers). Testing the push event handler requires a production build served over HTTPS, or using browser DevTools → Application → Service Workers to simulate a push event.

### Anti-Patterns to Avoid

- ❌ Making `send_notification` async — APScheduler runs it in a thread pool; `async def` would not be awaited
- ❌ Using `AsyncSession` in `send_notification` — async sessions require an event loop; none exists in thread pool context
- ❌ Calling `asyncio.run()` inside `send_notification` — the APScheduler event loop is already running; `asyncio.run()` creates a new loop and raises `RuntimeError: This event loop is already running`
- ❌ Using `generateSW` strategy in vite-plugin-pwa — the auto-generated service worker has no push event handler; `injectManifest` is required for custom handlers
- ❌ Importing `workbox-precaching` without the `precacheAndRoute(self.__WB_MANIFEST)` call — Workbox requires the precache manifest to be consumed, otherwise the service worker will not control the right resources
- ❌ Omitting `event.waitUntil()` in the push event handler — without it, the service worker may be terminated before `showNotification()` resolves
- ❌ Using `event.data.text()` instead of `event.data.json()` — the payload is sent as JSON by `push_service.send_web_push()` via `json.dumps(payload)`; parse with `.json()`

### References

- Epic requirements: [epic-2-push-notifications-reminders.md](../planning-artifacts/epics/epic-2-push-notifications-reminders.md) — Story 2.6 section
- Architecture: [core-architectural-decisions.md](../planning-artifacts/architecture/core-architectural-decisions.md) — Scheduler boundary, notification delivery flow
- Project structure: [project-structure-boundaries.md](../planning-artifacts/architecture/project-structure-boundaries.md) — `scheduler/jobs.py`, `service-worker.ts`
- push_service (Story 2.2): `backend/app/services/push_service.py` — `send_web_push(subscription, payload)`
- Sync URL pattern (Story 2.1): `backend/app/scheduler/setup.py` — `settings.database_url.replace("+aiosqlite", "")`
- vite-plugin-pwa config: `frontend/vite.config.ts`
- Previous story (2-5): [2-5-push-permission-subscription-flow.md](2-5-push-permission-subscription-flow.md)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

Ultimate context engine analysis completed — comprehensive developer guide created.

Implementation complete (2026-05-25):
- Replaced `pass` stub in `jobs.py` with full `send_notification` implementation using sync SQLAlchemy session factory
- `_sync_engine` / `_SyncSession` created at module level using `settings.database_url.replace("+aiosqlite", "")` — correct for APScheduler thread pool context
- `_human_offset()` maps 5 offset values; falls back to `f"{minutes} minutes"` for unknowns
- Created `frontend/src/service-worker.ts` with `push` + `notificationclick` event handlers using `injectManifest` strategy
- Updated `vite.config.ts` to `strategies: 'injectManifest'` — build confirms `dist/service-worker.js` generated with precache manifest injected
- Added `workbox-precaching` as explicit dependency (was transitive only)
- 5 new backend tests covering: correct payload, missing task, completed task, no subscriptions, `_human_offset` mapping
- All 41 backend tests pass; ruff lint clean; vite build succeeds
- Pre-existing TS error in `usePushSubscription.ts` (story 2-5) is NOT introduced by this story

### File List

- backend/app/scheduler/jobs.py
- backend/tests/test_scheduler.py
- frontend/src/service-worker.ts
- frontend/vite.config.ts
- frontend/package.json
- frontend/package-lock.json

### Change Log

- 2026-05-25: Story created — send_notification job implementation + service worker push/notificationclick handlers.
- 2026-05-25: Story implemented — send_notification with sync DB session, service worker with injectManifest strategy, 5 new backend tests, all validations pass.

### Review Findings

- [x] [Review][Patch] `send_notification` push loop unguarded — fixed: wrapped each `send_web_push` call in try/except with logger.exception [backend/app/scheduler/jobs.py]
- [x] [Review][Patch] `_parse_offsets` doesn't validate JSON result is a list — fixed: added `isinstance(parsed, list)` check [backend/app/services/scheduler_service.py]
- [x] [Review][Patch] `event.data?.json()` in service worker push handler has no try/catch — fixed: wrapped in try/catch with fallback to `{}` [frontend/src/service-worker.ts]
- [x] [Review][Patch] `_human_offset` fallback produces "1 minutes" for singular — fixed: added `minutes == 1` singlar check [backend/app/scheduler/jobs.py]
- [x] [Review][Defer] delete_task cancel→push race — APScheduler thread-pool may fire send_notification after cancel_task_jobs returns but before db.delete commits; not fixable without APScheduler-level locking — deferred, pre-existing
- [x] [Review][Defer] All subscriptions receive every notification (no user/task ownership filter) — architectural, multi-user scope beyond this story — deferred, pre-existing
