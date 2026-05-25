# Story 2.1: APScheduler & SQLAlchemy Job Store

Status: ready-for-dev

## Story

As a developer,
I want APScheduler running inside the FastAPI process with jobs persisted in SQLite,
so that scheduled notifications survive server restarts and redeploys without being lost.

## Acceptance Criteria

1. **Given** the FastAPI app starts
   **When** the lifespan context manager executes
   **Then** `AsyncIOScheduler` starts with a SQLAlchemy job store pointing to the same SQLite DB (`apscheduler_jobs` table auto-created)
   **And** the scheduler shuts down cleanly when the app stops

2. **Given** the scheduler is running and a test job is added
   **When** the FastAPI process is restarted
   **Then** the job is still present in the job store and will fire at its scheduled time

3. **Given** a notification job is scheduled
   **When** the job ID is inspected
   **Then** it follows the convention `reminder_{task_id}_{offset_minutes}` (e.g. `reminder_42_60`)

4. **Given** the scheduler setup
   **When** I inspect the code
   **Then** scheduler init lives in `backend/app/scheduler/setup.py`; job functions live in `backend/app/scheduler/jobs.py`; no DB mutations occur inside job functions (only `push_service` is called)

## Tasks / Subtasks

- [ ] Task 1: Create `backend/app/scheduler/setup.py` — scheduler init (AC: 1, 2)
  - [ ] Import `AsyncIOScheduler` from `apscheduler.schedulers.asyncio`
  - [ ] Import `SQLAlchemyJobStore` from `apscheduler.jobstores.sqlalchemy`
  - [ ] Extract the sync SQLite URL from `settings.database_url` (strip `+aiosqlite` driver prefix — SQLAlchemyJobStore requires a sync URL)
  - [ ] Instantiate `SQLAlchemyJobStore(url=sync_sqlite_url)` — the `apscheduler_jobs` table is auto-created on first use
  - [ ] Instantiate `AsyncIOScheduler(jobstores={"default": job_store})` as a module-level singleton `scheduler`
  - [ ] Export `scheduler` so `main.py` can import it

- [ ] Task 2: Create `backend/app/scheduler/jobs.py` — job function stubs (AC: 3, 4)
  - [ ] Define `async def send_notification(task_id: int, offset_minutes: int) -> None:`
  - [ ] For now, stub with `pass` — the actual push logic is wired in Story 2.6
  - [ ] No DB access, no SQLAlchemy imports — job functions only call `push_service` (enforced by architecture)
  - [ ] Add a module-level docstring: `"""Scheduler job functions. Must not perform DB mutations."""`

- [ ] Task 3: Wire scheduler into `backend/app/main.py` lifespan (AC: 1)
  - [ ] Replace the existing placeholder comments in the lifespan context manager
  - [ ] Import `scheduler` from `app.scheduler.setup`
  - [ ] In `async with lifespan`: `scheduler.start()` before `yield`; `scheduler.shutdown()` after `yield`
  - [ ] Keep all existing code intact (`CORS`, `exception_handler`, `include_router`, `health` endpoint)

- [ ] Task 4: Create `backend/app/services/scheduler_service.py` — scheduling API (AC: 3)
  - [ ] Import `scheduler` from `app.scheduler.setup`
  - [ ] Import `send_notification` from `app.scheduler.jobs`
  - [ ] Implement `def schedule_reminders(task) -> None:` — for each offset in `task.offsets` (list[int]), add a job:
    ```python
    fire_at = task.deadline_at - timedelta(minutes=offset)
    scheduler.add_job(
        send_notification,
        trigger="date",
        run_date=fire_at,
        args=[task.id, offset],
        id=f"reminder_{task.id}_{offset}",
        replace_existing=True,
        misfire_grace_time=120,
    )
    ```
  - [ ] Implement `def cancel_task_jobs(task_id: int) -> None:` — iterate over known offsets or use `scheduler.get_jobs()` filtered by prefix `f"reminder_{task_id}_"`:
    ```python
    for job in scheduler.get_jobs():
        if job.id.startswith(f"reminder_{task_id}_"):
            job.remove()
    ```
  - [ ] Neither function should be `async` — APScheduler 3.x `add_job`/`remove` are synchronous methods
  - [ ] Handle the case where `task.offsets` is `None` or empty: skip scheduling gracefully

- [ ] Task 5: Write backend tests (AC: 1–4)
  - [ ] Create `backend/tests/test_scheduler.py`
  - [ ] Test: scheduler starts and stops without error (use a real in-memory scheduler instance, not the singleton)
  - [ ] Test: `schedule_reminders` creates jobs with correct IDs matching `reminder_{task_id}_{offset}`
  - [ ] Test: `cancel_task_jobs` removes all jobs for a given task_id
  - [ ] Test: `schedule_reminders` with empty offsets list creates no jobs
  - [ ] Use a temporary SQLite file or in-memory SQLAlchemy job store for isolation — do NOT use the app singleton scheduler in tests

- [ ] Task 6: Verify (AC: 1–4)
  - [ ] `cd backend && uv run uvicorn app.main:app --reload` — app starts with no errors
  - [ ] Check logs: scheduler starts, `apscheduler_jobs` table is created in the DB
  - [ ] `cd backend && uv run pytest tests/ -v` — all tests pass
  - [ ] `cd backend && uv run ruff check app/` — lint passes clean

## Dev Notes

### CRITICAL: Sync URL for SQLAlchemyJobStore

`settings.database_url` is `sqlite+aiosqlite:///./simple-todo.db` (async driver). `SQLAlchemyJobStore` from APScheduler 3.x uses plain SQLAlchemy (sync), not SQLAlchemy async. Passing the async URL will raise an error.

**Fix:** Strip the `+aiosqlite` portion:

```python
# In backend/app/scheduler/setup.py
from app.config import settings

_sync_url = settings.database_url.replace("+aiosqlite", "")
# Result: "sqlite:///./simple-todo.db"

job_store = SQLAlchemyJobStore(url=_sync_url)
```

This is the most common failure point for this story. Do NOT pass the async URL.

### APScheduler Version: 3.11.2 — API Reference

The project uses **APScheduler 3.x** (not the incompatible 4.x alpha). API confirmed working:

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore

# These imports work — verified against installed version 3.11.2
```

APScheduler 3.x key behaviours:
- `AsyncIOScheduler.start()` / `scheduler.shutdown()` are synchronous calls, safe to call in an async lifespan
- `scheduler.add_job()` and `scheduler.get_jobs()` / `job.remove()` are synchronous
- `apscheduler_jobs` table is created automatically on first `start()` — no Alembic migration needed for it
- `replace_existing=True` on `add_job` is essential to prevent duplicate job errors on task edits

### Existing Code Being Modified

| File | Current State | Story 2.1 Changes |
|---|---|---|
| `backend/app/main.py` | lifespan has placeholder comments `# Scheduler start/stop will be added in Story 2.1` | REPLACE placeholders with real scheduler start/stop |
| `backend/app/scheduler/__init__.py` | Empty file (exists already) | No change needed |

**New files to create:**
- `backend/app/scheduler/setup.py`
- `backend/app/scheduler/jobs.py`
- `backend/app/services/scheduler_service.py`
- `backend/tests/test_scheduler.py`

### `backend/app/main.py` — Full Updated Lifespan

Current lifespan in `main.py`:
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Scheduler start will be added in Story 2.1
    yield
    # Scheduler stop will be added in Story 2.1
```

Replace with:
```python
from app.scheduler.setup import scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.start()
    yield
    scheduler.shutdown()
```

Keep the import at module level alongside existing imports.

### `backend/app/scheduler/setup.py` — Complete Implementation

```python
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.config import settings

_sync_url = settings.database_url.replace("+aiosqlite", "")
_job_store = SQLAlchemyJobStore(url=_sync_url)

scheduler = AsyncIOScheduler(jobstores={"default": _job_store})
```

### `backend/app/scheduler/jobs.py` — Stub for Story 2.1

```python
"""Scheduler job functions. Must not perform DB mutations."""


async def send_notification(task_id: int, offset_minutes: int) -> None:
    """Fire a push notification for a task at the scheduled offset.

    Wired to push_service in Story 2.6.
    """
    pass
```

### `backend/app/services/scheduler_service.py` — Complete Implementation

```python
from datetime import timedelta

from app.scheduler.setup import scheduler
from app.scheduler.jobs import send_notification


def schedule_reminders(task) -> None:
    """Schedule one APScheduler job per offset for a task."""
    offsets = task.offsets or []
    for offset in offsets:
        fire_at = task.deadline_at - timedelta(minutes=offset)
        scheduler.add_job(
            send_notification,
            trigger="date",
            run_date=fire_at,
            args=[task.id, offset],
            id=f"reminder_{task.id}_{offset}",
            replace_existing=True,
            misfire_grace_time=120,
        )


def cancel_task_jobs(task_id: int) -> None:
    """Remove all scheduled reminder jobs for a task."""
    prefix = f"reminder_{task_id}_"
    for job in scheduler.get_jobs():
        if job.id.startswith(prefix):
            job.remove()
```

### Job ID Convention (AC: 3)

Format: `reminder_{task_id}_{offset_minutes}`

Examples:
- `reminder_42_15` — 15-minute reminder for task 42
- `reminder_42_60` — 1-hour reminder for task 42
- `reminder_42_1440` — 1-day reminder for task 42

This convention enables targeted cancellation: `cancel_task_jobs(42)` removes `reminder_42_*` without touching other tasks' jobs.

### `task.offsets` Field

Story 2.1 only scaffolds the scheduler — the `Task` model does NOT yet have an `offsets` column (that is added in Story 2.3). For this story, `scheduler_service.py` should accept any object with a `.offsets` attribute. The stub is sufficient; it will be used by Story 2.4 once the column exists.

The `schedule_reminders` and `cancel_task_jobs` functions are NOT called from any router yet — that wiring happens in Story 2.4.

### Testing Approach

Do NOT use the module-level `scheduler` singleton in tests (it would start a real background thread and conflict between tests). Instead, test the scheduler service by:

```python
# In test_scheduler.py — use a fresh in-memory scheduler per test
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.memory import MemoryJobStore

def make_test_scheduler():
    return AsyncIOScheduler(jobstores={"default": MemoryJobStore()})
```

Or mock the singleton. The key thing to test is that `schedule_reminders` creates jobs with the correct IDs and `cancel_task_jobs` removes them by prefix.

### Architecture Boundaries (Must Follow)

Per `implementation-patterns-consistency-rules.md`:
- **Jobs must NOT perform DB mutations** — only `push_service.send_web_push()` (enforced in AC: 4)
- **Scheduler logic belongs in `services/scheduler_service.py`** — not in routers
- **Routers call services** — routers never touch `scheduler` directly
- **Business logic in services/** — `scheduler_service.py` is the sole interface for scheduling

### `misfire_grace_time=120`

APScheduler uses `misfire_grace_time` to determine whether to fire a past-due job when the scheduler restarts. 120 seconds (2 minutes) means: if a job was scheduled to fire within the last 2 minutes while the server was down, it fires immediately on restart. This prevents silent notification loss during brief server restarts.

### Anti-Patterns to Avoid

- ❌ Passing `settings.database_url` (with `+aiosqlite`) directly to `SQLAlchemyJobStore` — it requires a sync URL
- ❌ Making `schedule_reminders` or `cancel_task_jobs` async — APScheduler 3.x add/remove are sync calls
- ❌ Creating a new `scheduler` instance per request — must use the module-level singleton from `setup.py`
- ❌ Adding DB queries inside `jobs.py` — job functions only call `push_service`
- ❌ Writing a manual Alembic migration for `apscheduler_jobs` — it is auto-created by APScheduler
- ❌ Using APScheduler 4.x API (e.g. `from apscheduler import Scheduler`) — installed version is 3.11.2
- ❌ Calling `scheduler.start()` without `await` in an async context — it IS synchronous in 3.x, no `await` needed
- ❌ Importing `scheduler` singleton in tests and letting it start real background threads

### File Locations Summary

```
backend/
  app/
    main.py                  ← UPDATE: add scheduler.start()/shutdown() in lifespan
    scheduler/
      __init__.py             ← NO CHANGE (empty file already exists)
      setup.py                ← NEW: AsyncIOScheduler + SQLAlchemyJobStore singleton
      jobs.py                 ← NEW: send_notification stub
    services/
      scheduler_service.py    ← NEW: schedule_reminders, cancel_task_jobs
      task_service.py         ← NO CHANGE (scheduler wiring comes in Story 2.4)
  tests/
    test_scheduler.py         ← NEW: unit tests for scheduler service
```

### References

- Epic requirements: [epic-2-push-notifications-reminders.md#story-2.1](_bmad-output/planning-artifacts/epics/epic-2-push-notifications-reminders.md)
- Architecture data flow: [core-architectural-decisions.md#data-architecture](_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md)
- Project structure: [project-structure-boundaries.md](_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md)
- Implementation patterns: [implementation-patterns-consistency-rules.md](_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md)
- Previous story (1-7): [1-7-task-deletion.md](_bmad-output/implementation-artifacts/1-7-task-deletion.md)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

Ultimate context engine analysis completed — comprehensive developer guide created.

### File List

- `backend/app/main.py` (modified — scheduler start/stop in lifespan)
- `backend/app/scheduler/setup.py` (NEW)
- `backend/app/scheduler/jobs.py` (NEW)
- `backend/app/services/scheduler_service.py` (NEW)
- `backend/tests/test_scheduler.py` (NEW)

## Change Log

- 2026-05-25: Story created — APScheduler + SQLAlchemy job store setup, scheduler service scaffolding, lifespan wiring.
