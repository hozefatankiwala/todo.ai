# Story 1.2: Task Data Model & CRUD API

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the Task data model in the database and all task CRUD endpoints responding correctly,
so that the full API surface is verifiable before the frontend is built.

## Acceptance Criteria

1. **Given** the Alembic migration is applied
   **When** I inspect the SQLite schema
   **Then** a `tasks` table exists with: `id` (int PK auto-increment), `name` (text not null), `deadline_at` (datetime UTC not null), `description` (text nullable), `is_completed` (bool default false), `completed_at` (datetime nullable), `created_at`, `updated_at`

2. **Given** the API is running
   **When** I call `GET /api/v1/tasks/`
   **Then** it returns `[]` (200) when empty; returns only active tasks by default; `?include_archived=true` returns all tasks including completed; results are sorted by `deadline_at` ascending

3. **Given** the API is running
   **When** I call `POST /api/v1/tasks/` with `{"name": "Call dentist", "deadline_at": "2026-06-05T10:00:00Z"}`
   **Then** it returns the created task (201) with all fields in `snake_case`; `deadline_at` stored and returned as UTC ISO 8601

4. **Given** a task exists
   **When** I call `GET /api/v1/tasks/{id}`
   **Then** it returns the task (200); non-existent id returns `{"detail": "Task not found", "code": "TASK_NOT_FOUND"}` (404)

5. **Given** a task exists
   **When** I call `PATCH /api/v1/tasks/{id}` with updated fields
   **Then** it returns the fully updated task (200); only provided fields are changed; `updated_at` is refreshed

6. **Given** a task exists
   **When** I call `POST /api/v1/tasks/{id}/complete`
   **Then** it sets `is_completed=true` and `completed_at` to current UTC; returns 204; calling complete on an already-completed task is idempotent (still 204, no error, `completed_at` is preserved)

7. **Given** a task exists
   **When** I call `DELETE /api/v1/tasks/{id}`
   **Then** it permanently removes the task and returns 204; deleting a non-existent id returns 404 with the same error envelope

8. **Given** any task mutation runs
   **When** the service layer executes
   **Then** all business logic is in `task_service.py`; routers contain only HTTP handling; no business logic in Pydantic schemas

## Tasks / Subtasks

- [x] Task 1: Create the `Task` SQLAlchemy model (AC: 1)
  - [x] Create `backend/app/models/task.py` with `Task(Base)` mapping to `tasks` table
  - [x] Columns (exact names, types, nullability — see Dev Notes "Task Model Spec"):
    - `id: Mapped[int]` — primary key, autoincrement
    - `name: Mapped[str]` — `String`, `nullable=False`
    - `deadline_at: Mapped[datetime]` — `DateTime(timezone=True)`, `nullable=False`
    - `description: Mapped[str | None]` — `Text`, `nullable=True`
    - `is_completed: Mapped[bool]` — `Boolean`, `nullable=False`, `default=False`, `server_default=sa.false()`
    - `completed_at: Mapped[datetime | None]` — `DateTime(timezone=True)`, `nullable=True`
    - `created_at: Mapped[datetime]` — `DateTime(timezone=True)`, `nullable=False`, `server_default=func.now()`
    - `updated_at: Mapped[datetime]` — `DateTime(timezone=True)`, `nullable=False`, `server_default=func.now()`, `onupdate=func.now()`
  - [x] Register the module import in `backend/alembic/env.py` so autogenerate sees the metadata: `from app.models import task  # noqa: F401` (the import comment is already stubbed at env.py:9)
  - [x] Export `Task` from `backend/app/models/__init__.py`

- [x] Task 2: Create the Alembic migration for `tasks` (AC: 1)
  - [x] Run `uv run alembic revision --autogenerate -m "add tasks table"` from `backend/`
  - [x] Inspect the generated migration; confirm it creates the `tasks` table with all 8 columns and uses the documented downgrade (`op.drop_table("tasks")`)
  - [x] Run `uv run alembic upgrade head` and verify the table appears in `simple-todo.db` (e.g., via `sqlite3 simple-todo.db ".schema tasks"`)
  - [x] Verify `uv run alembic downgrade -1` cleanly drops the table, then upgrade head again

- [x] Task 3: Create Pydantic schemas (AC: 3, 5, 8)
  - [x] Create `backend/app/schemas/task.py` with:
    - `TaskBase` — shared fields (`name: str`, `deadline_at: datetime`, `description: str | None = None`)
    - `TaskCreate(TaskBase)` — used for `POST /` body
    - `TaskUpdate(BaseModel)` — all fields `Optional`, only set fields are applied
    - `TaskRead(TaskBase)` — adds `id`, `is_completed`, `completed_at`, `created_at`, `updated_at`; `model_config = ConfigDict(from_attributes=True)`
  - [x] NO business logic in schemas (validators may normalize, but not enforce domain rules)
  - [x] All field names are `snake_case` end-to-end (no `alias_generator`, no `camelCase`)
  - [x] Export schemas from `backend/app/schemas/__init__.py`

- [x] Task 4: Implement `task_service.py` (AC: 2, 3, 4, 5, 6, 7, 8)
  - [x] Create `backend/app/services/task_service.py` with these async functions (all take `db: AsyncSession` first):
    - `list_tasks(db, include_archived: bool = False) -> list[Task]` — filters `is_completed == False` unless `include_archived`; ordered by `deadline_at` asc
    - `get_task(db, task_id: int) -> Task | None`
    - `create_task(db, data: TaskCreate) -> Task` — insert, commit, refresh, return
    - `update_task(db, task_id: int, data: TaskUpdate) -> Task | None` — use `data.model_dump(exclude_unset=True)`; if no fields provided, still return the task unchanged; commit + refresh
    - `complete_task(db, task_id: int) -> Task | None` — set `is_completed=True`, `completed_at=datetime.now(UTC)`; idempotent (do not overwrite `completed_at` if already set); commit + refresh. Do NOT call any scheduler functions — that wiring lands in Story 2.4.
    - `delete_task(db, task_id: int) -> bool` — delete + commit; return True if a row was removed, False if not found
  - [x] Use `datetime.now(UTC)` (Python 3.13 — no `datetime.utcnow()` deprecation warnings)
  - [x] NO FastAPI imports in this file (service layer boundary)
  - [x] NO scheduler imports (Story 2.4 will compose calls, not embed them here)

- [x] Task 5: Implement the tasks router (AC: 2, 3, 4, 5, 6, 7)
  - [x] Create `backend/app/routers/tasks.py` with `router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])`
  - [x] Endpoints (use the response models and status codes from "Endpoint Spec" in Dev Notes):
    - `GET "/"` → `list_tasks` (query param `include_archived: bool = False`) — `response_model=list[TaskRead]`
    - `POST "/"` → `create_task` — `status_code=201`, `response_model=TaskRead`
    - `GET "/{task_id}"` → `get_task` — 404 on miss with the standard error envelope
    - `PATCH "/{task_id}"` → `update_task` — 404 on miss
    - `POST "/{task_id}/complete"` → `complete_task` — `status_code=204`, `response_class=Response` (no body); 404 on miss
    - `DELETE "/{task_id}"` → `delete_task` — `status_code=204`, `response_class=Response`; 404 on miss
  - [x] Inject `db: AsyncSession = Depends(get_db)` per route
  - [x] On not-found, raise `HTTPException(status_code=404, detail={"detail": "Task not found", "code": "TASK_NOT_FOUND"})` — see "Error Envelope" pattern below; do NOT return plain `{"detail": "..."}` strings
  - [x] Routers contain only HTTP concerns: parse request → call service → shape response

- [x] Task 6: Wire the consistent error envelope (AC: 4, 7, 8)
  - [x] Add a global exception handler in `backend/app/main.py` for `HTTPException` that re-shapes the response body to `{"detail": <message>, "code": <code>}` when the route raised `HTTPException(detail={"detail": ..., "code": ...})` (a dict), and falls back to the default body when `detail` is a plain string
  - [x] OR: define a small helper `def not_found(code: str, message: str) -> HTTPException` and use it consistently — pick one approach and document it in the router
  - [x] Pydantic 422 validation errors retain their default FastAPI shape (do not reshape)

- [x] Task 7: Register the router and verify OpenAPI (AC: 2)
  - [x] In `backend/app/main.py`, `from app.routers import tasks as tasks_router` and `app.include_router(tasks_router.router)`
  - [x] Start the server and verify `/docs` shows all six task endpoints under the `tasks` tag

- [x] Task 8: Make `get_db` transactional for writes (AC: 3, 5, 6, 7)
  - [x] Update `backend/app/database.py` `get_db` to commit on success and rollback on exception (see "get_db Transaction Wrapper" in Dev Notes). This was deferred from Story 1.1 and is required now that writes are landing.
  - [x] Service functions may still call `await db.commit()` explicitly when they need the row refreshed mid-handler (`await db.refresh(obj)` requires a flush/commit). Pick ONE convention — service-level commit is recommended here for clarity since each service call is one logical write — and document it in `task_service.py` module docstring.
  - [x] Whichever convention is chosen, ensure no double-commit issues in tests

- [x] Task 9: Write integration tests (AC: 1, 2, 3, 4, 5, 6, 7)
  - [x] Create `backend/tests/test_tasks.py` covering at minimum:
    - `GET /api/v1/tasks/` returns `[]` when empty
    - `POST` creates a task; response has all fields in `snake_case`; `deadline_at` round-trips as UTC ISO 8601 (`...Z` or `+00:00`)
    - `GET /{id}` returns the task; non-existent id returns 404 with `{"detail": "Task not found", "code": "TASK_NOT_FOUND"}`
    - `PATCH` partial update changes only provided fields; `updated_at` advances
    - `POST /{id}/complete` returns 204; subsequent `GET /` (no `include_archived`) excludes it; `GET /?include_archived=true` includes it; calling complete again is idempotent
    - `DELETE` returns 204; subsequent `GET /{id}` returns 404; deleting a non-existent id returns 404
    - `GET /` sort order: insert two tasks with deadlines reversed and assert response order is ascending by `deadline_at`
  - [x] Tests must use an isolated DB — extend `backend/tests/conftest.py` to override `get_db` with an in-memory SQLite per test (see "Test Isolation Pattern" in Dev Notes). This addresses the deferred test-isolation item from Story 1.1.
  - [x] All tests must pass: `uv run pytest`

- [x] Task 10: Lint and final verification (AC: all)
  - [x] `uv run ruff check .` passes (auto-fix with `--fix` if safe)
  - [x] `uv run pytest` passes (existing health test + new task tests)
  - [x] Manual smoke: `uv run uvicorn app.main:app --reload` and exercise create → list → patch → complete → list → delete via `curl` or `/docs`

## Dev Notes

### Task Model Spec (authoritative — match exactly)

```python
# backend/app/models/task.py
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    deadline_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_completed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=sa.false()
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
```

**SQLite gotcha:** SQLite stores `DateTime(timezone=True)` as ISO-8601 text. SQLAlchemy returns naive `datetime` objects unless the driver is configured otherwise. When constructing UTC values in Python use `datetime.now(UTC)` — never `datetime.utcnow()` (deprecated in 3.12+). The tests must accept either `"...Z"` or `"+00:00"` suffix in the JSON output; Pydantic `datetime` serialization is ISO 8601 and FastAPI emits the offset form by default.

### Endpoint Spec

| Method | Path | Body schema | Response | Status |
|---|---|---|---|---|
| GET | `/api/v1/tasks/` | — | `list[TaskRead]` | 200 |
| POST | `/api/v1/tasks/` | `TaskCreate` | `TaskRead` | 201 |
| GET | `/api/v1/tasks/{task_id}` | — | `TaskRead` | 200 / 404 |
| PATCH | `/api/v1/tasks/{task_id}` | `TaskUpdate` | `TaskRead` | 200 / 404 |
| POST | `/api/v1/tasks/{task_id}/complete` | — | — | 204 / 404 |
| DELETE | `/api/v1/tasks/{task_id}` | — | — | 204 / 404 |

Query param: `GET /api/v1/tasks/?include_archived=true|false` (default `false`).

### Error Envelope

The architecture standard ([core-architectural-decisions.md#api-communication-patterns](../planning-artifacts/architecture/core-architectural-decisions.md)) is:

```json
{ "detail": "Task not found", "code": "TASK_NOT_FOUND" }
```

The simplest way to keep that shape without writing a custom exception handler is to raise:

```python
raise HTTPException(status_code=404, detail={"detail": "Task not found", "code": "TASK_NOT_FOUND"})
```

FastAPI serializes `detail` verbatim if it's a dict — the resulting JSON is `{"detail": {"detail": "...", "code": "..."}}`. That's the wrong shape. Two acceptable fixes (pick ONE and apply consistently):

**Option A (recommended) — global handler that unwraps dict detail:**
```python
# in main.py
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException as FastAPIHTTPException

@app.exception_handler(FastAPIHTTPException)
async def http_exception_handler(request: Request, exc: FastAPIHTTPException):
    if isinstance(exc.detail, dict):
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
```

**Option B — helper that returns a pre-shaped JSONResponse:**
```python
def error_response(status_code: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"detail": message, "code": code})
```
Then routers `return error_response(...)` instead of raising. Less idiomatic in FastAPI but acceptable.

422 validation errors (Pydantic) keep FastAPI's default body — do not catch them.

### get_db Transaction Wrapper

Current `get_db` ([backend/app/database.py:11](../../backend/app/database.py)) yields a session but never commits or rolls back. With writes landing in this story, update to:

```python
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
```

Service functions own their own `await session.commit()` calls (one commit per logical write). This is the simpler of the two conventions and matches the FastAPI tutorial pattern for write-heavy APIs.

### Test Isolation Pattern

The deferred test-isolation item from Story 1.1 must be fixed here. Use `dependency_overrides` and a per-test in-memory SQLite engine. Replace `backend/tests/conftest.py` with:

```python
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import get_db
from app.main import app
from app.models.base import Base


@pytest.fixture
async def db_session():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as session:
        yield session
    await engine.dispose()


@pytest.fixture
async def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
```

Use `Base.metadata.create_all` to materialize the schema directly — no Alembic in tests. Each test gets a fresh in-memory DB.

### Why no scheduler wiring in this story

The architecture mandates that every task mutation touches the scheduler ([implementation-patterns-consistency-rules.md#process-patterns](../planning-artifacts/architecture/implementation-patterns-consistency-rules.md)). However, the scheduler infrastructure does not exist yet — it lands in Story 2.1 (APScheduler + SQLAlchemy job store) and is composed into task mutations in Story 2.4. **For this story, the service layer is intentionally pure CRUD with no `scheduler_service` calls.** Story 2.4's job is to insert those calls; do not pre-stub them here or the dev agent for 2.4 will have nothing to do.

### Naming & convention checklist (architecture-mandated)

- Table: `tasks` (plural snake_case)
- Columns: `snake_case`
- PK: `id` integer autoincrement
- Timestamps: `created_at`, `updated_at` (UTC, timezone-aware)
- Route function names: `list_tasks`, `create_task`, `get_task`, `update_task`, `complete_task`, `delete_task`
- Pydantic schemas: `TaskCreate`, `TaskRead`, `TaskUpdate`
- JSON field names: `snake_case` end-to-end (no aliasing)
- Path: `/api/v1/tasks/` with trailing slash; `{task_id}` as path param

### Files this story modifies (UPDATE) vs. creates (NEW)

**UPDATE (existing files — preserve current behavior):**
- `backend/app/main.py` — current state: FastAPI app with `/health` and CORS. Add: tasks router include + (optionally) global HTTPException handler. Preserve: lifespan, CORS, health endpoint.
- `backend/app/database.py` — current state: `get_db` yields a session with no commit/rollback. Add: rollback-on-exception wrapper. Preserve: engine + session factory.
- `backend/alembic/env.py` — current state: imports `Base`, has comment stub at line 9 for model imports. Add: `from app.models import task  # noqa: F401` at the marked location.
- `backend/app/models/__init__.py` — currently empty. Export `Task`.
- `backend/app/schemas/__init__.py` — currently empty. Export task schemas.
- `backend/app/routers/__init__.py` — currently empty. Optional: expose `tasks` module.
- `backend/app/services/__init__.py` — currently empty. Optional: expose `task_service` module.
- `backend/tests/conftest.py` — current state: single `client` fixture pointing at the real app/DB. Replace with the per-test in-memory pattern above; preserve compatibility with the existing `test_health.py` (the health endpoint does not use `get_db`, so the override is a no-op for it).

**NEW (create from scratch):**
- `backend/app/models/task.py`
- `backend/app/schemas/task.py`
- `backend/app/services/task_service.py`
- `backend/app/routers/tasks.py`
- `backend/alembic/versions/<hash>_add_tasks_table.py` (autogenerated)
- `backend/tests/test_tasks.py`

### Anti-Patterns to Avoid

- ❌ Putting any business logic in routers (`tasks.py`) — they only marshal HTTP
- ❌ Putting domain rules in Pydantic schemas (`schemas/task.py`) — validators OK for normalization only
- ❌ Importing FastAPI types in `services/task_service.py`
- ❌ Calling `scheduler_service` from anywhere in this story (the module doesn't exist yet)
- ❌ Using `datetime.utcnow()` — use `datetime.now(UTC)`
- ❌ `camelCase` anywhere in API JSON or model columns
- ❌ Returning the standard 404 body `{"detail": "Task not found"}` without the `code` key — full envelope is required
- ❌ Skipping the per-test in-memory DB and reusing the module-level engine — tests will leak state across runs
- ❌ Re-introducing a `tailwind.config.js` (irrelevant here but the project-wide ban still holds)
- ❌ Using sync SQLAlchemy or sync routes anywhere

### Previous Story Intelligence (from Story 1.1)

- The skeleton at `backend/app/` is in place. `models/base.py` exports `Base = DeclarativeBase`. Use it; do not create a second declarative base.
- `app/config.py` uses pydantic-settings with `database_url` required (no default). Alembic `env.py` already imports `settings` and uses `settings.database_url` — both runtime and migrations point at the same DB. Do not bypass this.
- `app/main.py` already has a `lifespan` placeholder for Story 2.1's scheduler — leave it alone, it's load-bearing later.
- The Story 1.1 review surfaced and patched: shadcn `@/` directory bug, `cn()` util, CORS `allow_credentials`, TypeScript strict mode, redundant `.gitignore` entries. None of those affect this story.
- Deferred to this story (from Story 1.1's review): `get_db` commit/rollback wrapper, pytest engine-state leak isolation. Tasks 8 and 9 address them.
- Still deferred (do NOT tackle here): SQLite `busy_timeout` tuning, `/health` DB check, service-worker `/api/*` interception, VAPID validation.

### Project Structure Notes

All target file locations match [project-structure-boundaries.md#complete-project-directory-structure](../planning-artifacts/architecture/project-structure-boundaries.md). No deviations.

### References

- Epic context: [epic-1-task-management-foundation.md#story-1.2](../planning-artifacts/epics/epic-1-task-management-foundation.md)
- API & error patterns: [core-architectural-decisions.md#api--communication-patterns](../planning-artifacts/architecture/core-architectural-decisions.md)
- Naming/format/process rules: [implementation-patterns-consistency-rules.md](../planning-artifacts/architecture/implementation-patterns-consistency-rules.md)
- File layout: [project-structure-boundaries.md](../planning-artifacts/architecture/project-structure-boundaries.md)
- Previous story: [1-1-project-initialization-running-skeleton.md](./1-1-project-initialization-running-skeleton.md)
- Deferred items log: [deferred-work.md](./deferred-work.md)

## Dev Agent Record

### Agent Model Used

claude-opus-4-7

### Debug Log References

None.

### Completion Notes List

- Created `Task` SQLAlchemy model with all 8 columns exactly as specified; registered in `env.py` for Alembic autogenerate.
- Generated and verified Alembic migration `7f9a186cff6e_add_tasks_table.py`; downgrade/upgrade cycle tested.
- Implemented `TaskBase`, `TaskCreate`, `TaskUpdate`, `TaskRead` Pydantic schemas with `snake_case` fields and no business logic.
- Implemented `task_service.py` with 6 async functions; service-level commit convention; no FastAPI or scheduler imports.
- Implemented `tasks.py` router with all 6 endpoints; HTTP concerns only; standard error envelope via `_NOT_FOUND` constant.
- Added global `HTTPException` handler in `main.py` (Option A) that unwraps dict `detail` to flat `{"detail": ..., "code": ...}`.
- Updated `get_db` with rollback-on-exception wrapper; service functions own their own `await db.commit()` calls.
- Replaced `conftest.py` with per-test in-memory SQLite isolation using `dependency_overrides`; health test still passes.
- 12 integration tests added covering all ACs: empty list, create, get, 404 envelope, patch partial, complete idempotency, archive filter, delete, sort order.
- `uv run pytest`: 12 passed. `uv run ruff check .`: all checks passed.

### File List

- `backend/app/models/task.py` (NEW)
- `backend/app/models/__init__.py` (MODIFIED)
- `backend/app/schemas/task.py` (NEW)
- `backend/app/schemas/__init__.py` (MODIFIED)
- `backend/app/services/task_service.py` (NEW)
- `backend/app/routers/tasks.py` (NEW)
- `backend/app/main.py` (MODIFIED)
- `backend/app/database.py` (MODIFIED)
- `backend/alembic/env.py` (MODIFIED)
- `backend/alembic/versions/7f9a186cff6e_add_tasks_table.py` (NEW)
- `backend/tests/conftest.py` (MODIFIED)
- `backend/tests/test_tasks.py` (NEW)

### Change Log

- 2026-05-24: Implemented Task data model, Alembic migration, Pydantic schemas, task service, tasks router, error envelope handler, transactional get_db, and integration tests. All ACs satisfied. 12/12 tests pass, ruff clean.

### Review Findings

- [x] [Review][Patch] Naive `deadline_at` accepted — replaced `TaskBase` with separate `TaskCreate`/`TaskRead` schemas; `TaskCreate` and `TaskUpdate` use `AwareDatetime`, `TaskRead` uses plain `datetime` to handle SQLite's naive output [backend/app/schemas/task.py]
- [x] [Review][Patch] `updated_at` not reliably updated by SQLite — set `updated_at = datetime.now(UTC)` explicitly in `update_task` and `complete_task` [backend/app/services/task_service.py]
- [x] [Review][Patch] `completed_at` idempotency not fully asserted — test now captures value before second complete and asserts equality [backend/tests/test_tasks.py]
- [x] [Review][Patch] `_NOT_FOUND` is a shared mutable singleton — replaced with `_not_found()` factory function [backend/app/routers/tasks.py]
- [x] [Review][Patch] `TaskUpdate` has no field allowlist in service layer — added `_TASK_UPDATE_FIELDS` frozenset guard in `update_task` [backend/app/services/task_service.py]
- [x] [Review][Patch] `asyncio_mode` not configured — already present in `pyproject.toml` [backend/pyproject.toml]
- [x] [Review][Defer] TOCTOU read-then-write without row locking — deferred, pre-existing; relevant when migrating to PostgreSQL (Story 2.1+), use `with_for_update()` then
- [x] [Review][Defer] No max length on `name`/`description` fields — deferred, pre-existing; add `String(255)` + Pydantic `max_length` in a hardening pass
- [x] [Review][Defer] No pagination on `list_tasks` endpoint — deferred, pre-existing; add `limit`/`offset` when data volume warrants it
- [x] [Review][Defer] Past `deadline_at` not rejected — deferred, pre-existing; intentional for now; revisit when scheduler (Story 2.4) is wired
- [x] [Review][Defer] Shared `db_session` fixture without savepoint rollback — deferred, pre-existing; works correctly because engine is per-fixture; revisit if fixture scope ever changes
- [x] [Review][Defer] 404 envelope nested `detail` key fragility — deferred, pre-existing; works at runtime via custom handler; latent risk if handler removed
- [x] [Review][Defer] `include_archived` naming misleads (maps to `is_completed`) — deferred, pre-existing; consistent with story spec naming
- [x] [Review][Defer] Service layer lacks unit-of-work abstraction — deferred, pre-existing; Story 2.4 concern when atomic multi-service calls are needed
