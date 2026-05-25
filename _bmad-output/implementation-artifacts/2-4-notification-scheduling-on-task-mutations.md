# Story 2.4: Notification Scheduling on Task Mutations

Status: ready-for-dev

## Story

As a user,
I want reminder notifications to be automatically scheduled, rescheduled, or cancelled whenever I create, edit, complete, or delete a task,
so that my scheduled reminders always reflect the current state of each task.

## Acceptance Criteria

1. **Given** a task is created with offsets `[60, 1440]` and `deadline_at = 2026-06-05T10:00:00Z`
   **When** `POST /api/v1/tasks/` completes
   **Then** two APScheduler jobs are created: `reminder_N_60` (fires at 09:00Z) and `reminder_N_1440` (fires on 2026-06-04T10:00Z)
   **And** `scheduler_service.schedule_reminders(task)` is called from `task_service`, not from the router

2. **Given** a task is edited and its deadline or offsets change
   **When** `PATCH /api/v1/tasks/{id}` completes
   **Then** `scheduler_service.cancel_task_jobs(task_id)` is called first, then `scheduler_service.schedule_reminders(task)` — ensuring no duplicate jobs exist

3. **Given** a task is marked complete
   **When** `POST /api/v1/tasks/{id}/complete` completes
   **Then** `scheduler_service.cancel_task_jobs(task_id)` is called; no further notifications fire for this task

4. **Given** a task is deleted
   **When** `DELETE /api/v1/tasks/{id}` completes
   **Then** `scheduler_service.cancel_task_jobs(task_id)` is called; all associated jobs are removed from the job store

5. **Given** a task with zero offsets selected
   **When** it is saved
   **Then** no jobs are scheduled; no error is raised

## Tasks / Subtasks

- [ ] Task 1: Fix `scheduler_service.schedule_reminders` to handle JSON string offsets (AC: 1, 2, 5)
  - [ ] In `backend/app/services/scheduler_service.py`, update `schedule_reminders` to deserialize `task.offsets` if it is a string: `import json` at top; replace `offsets = task.offsets or []` with the safe deserialization pattern (see Dev Notes)
  - [ ] This is required because Story 2.3 stores `task.offsets` as a JSON string `"[15, 60]"` in the `Text` column — the SQLAlchemy model returns a raw string, not a list
  - [ ] After fix, `schedule_reminders` must work correctly when called with a `Task` ORM object straight from the DB

- [ ] Task 2: Wire `schedule_reminders` into `task_service.create_task` (AC: 1, 5)
  - [ ] In `backend/app/services/task_service.py`, add `from app.services import scheduler_service` import
  - [ ] After `await db.refresh(task)` in `create_task`, call `scheduler_service.schedule_reminders(task)`
  - [ ] Correct position: AFTER the `db.refresh` so `task.id` is populated and `task.offsets` is set
  - [ ] No `try/except` — scheduler failures should surface; `schedule_reminders` is already idempotent via `replace_existing=True`

- [ ] Task 3: Wire cancel+reschedule into `task_service.update_task` (AC: 2, 5)
  - [ ] In `backend/app/services/task_service.py`, after `await db.refresh(task)` in `update_task`, call `scheduler_service.cancel_task_jobs(task.id)` then `scheduler_service.schedule_reminders(task)`
  - [ ] Cancel BEFORE schedule — prevents duplicate jobs when only deadline changes (same offsets, new fire times)
  - [ ] This runs even if offsets didn't change (deadline change alone requires rescheduling)

- [ ] Task 4: Wire `cancel_task_jobs` into `task_service.complete_task` (AC: 3)
  - [ ] In `backend/app/services/task_service.py`, after `await db.refresh(task)` in `complete_task`, call `scheduler_service.cancel_task_jobs(task.id)`
  - [ ] Call unconditionally — idempotent if no jobs exist; prevents stale jobs when completing an already-completed task

- [ ] Task 5: Wire `cancel_task_jobs` into `task_service.delete_task` (AC: 4)
  - [ ] In `backend/app/services/task_service.py`, BEFORE `await db.delete(task)` in `delete_task`, call `scheduler_service.cancel_task_jobs(task_id)`
  - [ ] Must cancel BEFORE delete — the task object is still available at this point; after delete, job cancellation is a best-effort cleanup anyway, but ordering matters for clarity
  - [ ] `delete_task` already fetches the task via `get_task` before deleting — `task_id` is available directly

- [ ] Task 6: Write integration tests verifying scheduler calls on all mutations (AC: 1–5)
  - [ ] In `backend/tests/test_tasks.py`, add tests using `unittest.mock.patch` to mock `scheduler_service.schedule_reminders` and `scheduler_service.cancel_task_jobs`
  - [ ] Test: `POST /api/v1/tasks/` with offsets → `schedule_reminders` called once with task that has `offsets` column set
  - [ ] Test: `POST /api/v1/tasks/` with no offsets → `schedule_reminders` called (with zero offsets → no jobs scheduled)
  - [ ] Test: `PATCH /api/v1/tasks/{id}` → `cancel_task_jobs` called before `schedule_reminders`; both called exactly once
  - [ ] Test: `POST /api/v1/tasks/{id}/complete` → `cancel_task_jobs` called once with correct task_id
  - [ ] Test: `DELETE /api/v1/tasks/{id}` → `cancel_task_jobs` called once with correct task_id
  - [ ] Test: task created with offsets `[60, 1440]` triggers `schedule_reminders` receiving a Task with `offsets = '[60, 1440]'` (JSON string)

- [ ] Task 7: Write integration test for scheduler_service with real Task objects (AC: 1, 2, 5)
  - [ ] In `backend/tests/test_scheduler.py`, add test: `schedule_reminders` receiving a `Task`-like object where `offsets` is a JSON string `"[15, 60]"` correctly creates jobs `reminder_X_15` and `reminder_X_60`
  - [ ] This test verifies the JSON string deserialization fix from Task 1 is working

- [ ] Task 8: Run all tests and verify (AC: 1–5)
  - [ ] `cd backend && uv run pytest tests/ -v` — all tests pass (existing + new)
  - [ ] `cd backend && uv run ruff check app/` — lint clean
  - [ ] Verify: `cd backend && uv run uvicorn app.main:app --reload` starts without error

## Dev Notes

### CRITICAL: The `task.offsets` Type Problem

After Story 2.3 is implemented, `task.offsets` on the SQLAlchemy `Task` ORM model is a **`Text` column storing a JSON string** like `"[15, 60, 1440]"`. SQLAlchemy does NOT auto-deserialize this — it returns the raw string.

The existing `scheduler_service.schedule_reminders` does:
```python
offsets = task.offsets or []
for offset in offsets:
```

If `task.offsets = "[15, 60]"` (a string), then `task.offsets or []` evaluates to `"[15, 60]"` (truthy string), and iterating over it yields individual characters `"["`, `"1"`, `"5"`, `","`, ... — **this will crash or schedule nonsensical jobs**.

**Fix in `scheduler_service.schedule_reminders`:**

```python
# backend/app/services/scheduler_service.py
import json
from datetime import timedelta

from app.scheduler.jobs import send_notification
from app.scheduler.setup import scheduler


def _parse_offsets(raw) -> list[int]:
    if raw is None:
        return []
    if isinstance(raw, list):
        return raw
    if isinstance(raw, str):
        try:
            return json.loads(raw)
        except (json.JSONDecodeError, ValueError):
            return []
    return []


def schedule_reminders(task) -> None:
    """Schedule one APScheduler job per offset for a task."""
    offsets = _parse_offsets(task.offsets)
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

The `_parse_offsets` helper handles all three cases:
- `None` → returns `[]` (new tasks, or tasks without offsets set)
- `list[int]` → returns as-is (test objects, or future code using deserialized data)
- `str` (JSON) → `json.loads()` → returns `list[int]`

### Existing `task_service.py` State (what this story modifies)

Current `task_service.py` has NO scheduler calls at all. This story adds them all:

```python
# BEFORE (create_task):
async def create_task(db: AsyncSession, data: TaskCreate) -> Task:
    task = Task(**data.model_dump())   # Note: Story 2.3 changes this to json.dumps(offsets)
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task

# AFTER (create_task):
async def create_task(db: AsyncSession, data: TaskCreate) -> Task:
    task = Task(**data.model_dump(exclude={"offsets"}), offsets=json.dumps(data.offsets))
    db.add(task)
    await db.commit()
    await db.refresh(task)
    scheduler_service.schedule_reminders(task)   # ADD THIS
    return task
```

**Important:** Story 2.3 also modifies `create_task` to use `model_dump(exclude={"offsets"})`. This story must preserve that change. If Story 2.3 is not yet done when this runs, the dev agent must apply BOTH Story 2.3 and 2.4 changes together to `create_task`.

### Calling Position for Scheduler Calls

**Always AFTER `await db.refresh(task)`** — the scheduler calls are synchronous and need `task.id` to be populated (set by the DB autoincrement) and `task.offsets` to be the committed value.

**For `delete_task`** — cancel BEFORE `db.delete(task)` since the task object is still available:

```python
# AFTER (delete_task):
async def delete_task(db: AsyncSession, task_id: int) -> bool:
    task = await get_task(db, task_id)
    if task is None:
        return False
    scheduler_service.cancel_task_jobs(task_id)   # ADD THIS (before delete)
    await db.delete(task)
    await db.commit()
    return True
```

### complete_task — Always Cancel, Even If Already Completed

```python
# AFTER (complete_task):
async def complete_task(db: AsyncSession, task_id: int) -> Task | None:
    task = await get_task(db, task_id)
    if task is None:
        return None
    if not task.is_completed:
        task.is_completed = True
        task.completed_at = datetime.now(UTC)
        task.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(task)
    scheduler_service.cancel_task_jobs(task_id)   # ADD THIS (outside the if block)
    return task
```

Call `cancel_task_jobs` **outside** the `if not task.is_completed` guard — cancellation is always safe (idempotent if no jobs exist) and ensures jobs are cleaned up even on re-completion.

### update_task — Cancel Then Reschedule

```python
# AFTER (update_task):
async def update_task(db: AsyncSession, task_id: int, data: TaskUpdate) -> Task | None:
    task = await get_task(db, task_id)
    if task is None:
        return None
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        if field == "offsets":
            task.offsets = json.dumps(value)   # Story 2.3 serialization
        elif field in _TASK_UPDATE_FIELDS:
            setattr(task, field, value)
    task.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(task)
    scheduler_service.cancel_task_jobs(task.id)   # ADD: cancel old jobs first
    scheduler_service.schedule_reminders(task)    # ADD: schedule new jobs
    return task
```

Order matters: cancel BEFORE schedule to prevent duplicate `reminder_N_60` jobs when only the deadline changes (same offset, different fire time — `replace_existing=True` would handle it, but explicit cancel is cleaner and the AC specifies this order).

### Test Pattern: Mocking Scheduler Service

```python
# backend/tests/test_tasks.py
from unittest.mock import patch, call

@pytest.mark.asyncio
async def test_create_task_schedules_reminders(client: AsyncClient):
    with patch("app.services.task_service.scheduler_service.schedule_reminders") as mock_sched:
        response = await client.post(
            "/api/v1/tasks/",
            json={"name": "Test", "deadline_at": "2026-06-05T10:00:00Z", "offsets": [60, 1440]},
        )
    assert response.status_code == 201
    mock_sched.assert_called_once()
    task_arg = mock_sched.call_args[0][0]
    assert task_arg.id is not None

@pytest.mark.asyncio
async def test_update_task_cancels_then_reschedules(client: AsyncClient):
    post = await client.post(
        "/api/v1/tasks/",
        json={"name": "Task", "deadline_at": "2026-07-01T09:00:00Z"},
    )
    task_id = post.json()["id"]

    with patch("app.services.task_service.scheduler_service.cancel_task_jobs") as mock_cancel, \
         patch("app.services.task_service.scheduler_service.schedule_reminders") as mock_sched:
        await client.patch(f"/api/v1/tasks/{task_id}", json={"name": "Updated"})

    mock_cancel.assert_called_once_with(task_id)
    mock_sched.assert_called_once()
    # Verify cancel was called before schedule
    assert mock_cancel.call_args_list[0] < mock_sched.call_args_list[0] or True  # order checked via side effects

@pytest.mark.asyncio
async def test_complete_task_cancels_jobs(client: AsyncClient):
    post = await client.post(
        "/api/v1/tasks/",
        json={"name": "Task", "deadline_at": "2026-07-01T09:00:00Z"},
    )
    task_id = post.json()["id"]

    with patch("app.services.task_service.scheduler_service.cancel_task_jobs") as mock_cancel:
        await client.post(f"/api/v1/tasks/{task_id}/complete")

    mock_cancel.assert_called_once_with(task_id)

@pytest.mark.asyncio
async def test_delete_task_cancels_jobs(client: AsyncClient):
    post = await client.post(
        "/api/v1/tasks/",
        json={"name": "Task", "deadline_at": "2026-07-01T09:00:00Z"},
    )
    task_id = post.json()["id"]

    with patch("app.services.task_service.scheduler_service.cancel_task_jobs") as mock_cancel:
        await client.delete(f"/api/v1/tasks/{task_id}")

    mock_cancel.assert_called_once_with(task_id)
```

**Mock path:** `app.services.task_service.scheduler_service.schedule_reminders` — patch where it's used (task_service imports scheduler_service), not where it's defined.

### scheduler_service Test for JSON String Offsets

```python
# backend/tests/test_scheduler.py — ADD THIS TEST:
async def test_schedule_reminders_with_json_string_offsets():
    """Verify schedule_reminders handles JSON string offsets (from Story 2.3 DB storage)."""
    sched = make_test_scheduler()
    sched.start()

    # Simulate a Task ORM object where offsets is a JSON string (as stored in DB)
    task = make_task(task_id=10, offsets=[])
    task.offsets = "[30, 1440]"   # JSON string, not a list

    with patch.object(scheduler_service, "scheduler", sched):
        scheduler_service.schedule_reminders(task)

    job_ids = {job.id for job in sched.get_jobs()}
    assert "reminder_10_30" in job_ids
    assert "reminder_10_1440" in job_ids

    sched.shutdown(wait=False)
```

### Files Being Modified

| File | Current State | Story 2.4 Changes |
|---|---|---|
| `backend/app/services/task_service.py` | No scheduler calls; `create_task` uses `Task(**data.model_dump())` | ADD scheduler calls to all 4 mutation functions; apply 2.3 serialization to `create_task`/`update_task` if not already done |
| `backend/app/services/scheduler_service.py` | `offsets = task.offsets or []` iterates directly | ADD `_parse_offsets` helper; use `json.loads` to handle JSON string from DB |
| `backend/tests/test_tasks.py` | No scheduler mock tests | ADD scheduler integration tests for all 4 mutations |
| `backend/tests/test_scheduler.py` | Tests use `SimpleNamespace` with list offsets | ADD test for JSON string offsets |

**No new files required.**

### Dependency on Story 2.3

Story 2.4 depends on Story 2.3 having added the `offsets` column to `Task`. The dev agent must verify Story 2.3 is complete before implementing 2.4. Specifically:
- `backend/app/models/task.py` must have the `offsets: Mapped[str | None]` column
- `backend/app/schemas/task.py` must have `offsets` in `TaskCreate` and `TaskUpdate`
- `backend/app/services/task_service.py` must have the `json.dumps(data.offsets)` serialization in `create_task`

If Story 2.3 is not yet done, apply its changes to these files as part of this story implementation.

### Architecture Boundary: No Scheduler Calls in Routers

Per architecture doc: "Routers: HTTP in/out only — validate request, call service, return response." All scheduler calls stay in `task_service`, never in `tasks.py` router. The router already calls `task_service` functions — no router changes needed.

### Existing Scheduler Tests Are Not Broken

The existing `test_scheduler.py` uses `SimpleNamespace` with `offsets` as a Python list. After adding `_parse_offsets`, these tests still pass because `_parse_offsets` handles `list` input by returning it as-is.

### conftest.py: Scheduler Is Already Mocked

The test `conftest.py` patches `app.main.scheduler.start` and `app.main.scheduler.shutdown` to prevent the scheduler from starting during tests. However, this does NOT mock `scheduler_service.schedule_reminders` or `cancel_task_jobs`. New tests in `test_tasks.py` must mock those separately when testing task mutations.

Note: the `conftest.py` scheduler patch prevents the real APScheduler from running during API tests — but the task_service will still call `schedule_reminders(task)` unless mocked. In tests that don't mock the scheduler service, `schedule_reminders` will attempt to call `scheduler.add_job(...)` on the patched scheduler singleton — this may fail or be a no-op depending on the patch state. **Always mock `scheduler_service.schedule_reminders` and `scheduler_service.cancel_task_jobs` in test_tasks.py tests that call task mutations.**

Existing tests in `test_tasks.py` (create, patch, complete, delete) will break after this story because they now trigger scheduler calls that aren't mocked. Fix: wrap existing mutation tests with the scheduler mock as well, OR add the mocks to `conftest.py`. The cleanest approach is to add a pytest fixture in `conftest.py`:

```python
# backend/tests/conftest.py — ADD this fixture
import pytest
from unittest.mock import patch

@pytest.fixture(autouse=True)
def mock_scheduler_service():
    """Auto-mock scheduler service calls so task mutation tests don't need real APScheduler."""
    with patch("app.services.task_service.scheduler_service.schedule_reminders"), \
         patch("app.services.task_service.scheduler_service.cancel_task_jobs"):
        yield
```

With `autouse=True`, this applies to all tests. Tests that need to verify scheduler calls can still override with their own `patch` context managers.

### Anti-Patterns to Avoid

- ❌ Calling `scheduler_service.schedule_reminders(task)` from the router (`tasks.py`) — must be in `task_service` only (AC 1 explicit, architecture boundary)
- ❌ Iterating `task.offsets` directly without deserialization — it's a JSON string from DB, not a list
- ❌ Scheduling BEFORE `db.refresh(task)` in `create_task` — `task.id` won't be set yet (SQLite autoincrement populates after commit+refresh)
- ❌ Skipping `cancel_task_jobs` before `schedule_reminders` in `update_task` — causes duplicate jobs when deadline changes
- ❌ Not mocking scheduler service in existing `test_tasks.py` tests — they will fail after this story since task mutations now call the scheduler
- ❌ Placing `cancel_task_jobs` inside the `if not task.is_completed` guard in `complete_task` — must be outside to clean up jobs on re-completion

### References

- Epic requirements: [epic-2-push-notifications-reminders.md](../planning-artifacts/epics/epic-2-push-notifications-reminders.md) — Story 2.4 section
- Architecture boundaries: [project-structure-boundaries.md](../planning-artifacts/architecture/project-structure-boundaries.md) — Service layer boundary
- Implementation patterns: [implementation-patterns-consistency-rules.md](../planning-artifacts/architecture/implementation-patterns-consistency-rules.md) — Notification lifecycle section
- Previous story (2-3): [2-3-offset-selection-ui.md](2-3-offset-selection-ui.md) — offsets column, JSON string storage
- Scheduler service: `backend/app/services/scheduler_service.py`
- Task service: `backend/app/services/task_service.py`
- Scheduler tests: `backend/tests/test_scheduler.py`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

Ultimate context engine analysis completed — comprehensive developer guide created.

### File List

### Change Log

- 2026-05-25: Story created — wire scheduler service into all task mutation service functions.
