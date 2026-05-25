# Story 2.2: Push Subscription & VAPID Backend

Status: done

## Story

As a developer,
I want the backend to store push subscriptions and send a test web push,
so that the full push pipeline is verified before wiring it to task mutations.

## Acceptance Criteria

1. **Given** the Alembic migration is applied
   **When** I inspect the SQLite schema
   **Then** a `push_subscriptions` table exists with: `id` (int PK), `endpoint` (text not null unique), `p256dh` (text not null), `auth` (text not null), `created_at`

2. **Given** a browser push subscription object
   **When** I call `POST /api/v1/push/subscribe` with `{endpoint, p256dh, auth}`
   **Then** the subscription is saved (201) or updated if the endpoint already exists (200)

3. **Given** a subscription exists and VAPID keys are configured in `backend/.env`
   **When** `push_service.send_web_push(subscription, payload)` is called
   **Then** the web push is dispatched via `pywebpush` and the browser receives it
   **And** VAPID private key, public key, and claim email are read from environment; never hardcoded

4. **Given** the push service is invoked
   **When** the delivery fails (e.g. subscription expired)
   **Then** the error is logged but does not crash the scheduler job or the API response

## Tasks / Subtasks

- [x] Task 1: Create `PushSubscription` SQLAlchemy model (AC: 1)
  - [x] Create `backend/app/models/push_subscription.py`
  - [x] Model fields: `id` (int PK autoincrement), `endpoint` (Text, not null, unique), `p256dh` (Text, not null), `auth` (Text, not null), `created_at` (DateTime timezone=True, server_default=func.now())
  - [x] Import `Base` from `app.models.base`
  - [x] Register the model in `backend/alembic/env.py` — add `from app.models import push_subscription  # noqa: F401` alongside the existing `task` import

- [x] Task 2: Generate and apply Alembic migration (AC: 1)
  - [x] `cd backend && uv run alembic revision --autogenerate -m "add push_subscriptions table"`
  - [x] Review the generated migration file in `alembic/versions/` — ensure `push_subscriptions` table has all required columns including `unique=True` on `endpoint`
  - [x] `cd backend && uv run alembic upgrade head` — apply migration
  - [x] Verify: `uv run python -c "import sqlite3; c=sqlite3.connect('simple-todo.db'); print(c.execute(\"SELECT name FROM sqlite_master WHERE type='table'\").fetchall())"` — `push_subscriptions` must appear

- [x] Task 3: Create Pydantic schemas for push (AC: 2)
  - [x] Create `backend/app/schemas/push.py`
  - [x] `PushSubscribeRequest(BaseModel)`: fields `endpoint: str`, `p256dh: str`, `auth: str`
  - [x] `PushSubscriptionRead(BaseModel)`: fields `id: int`, `endpoint: str`, `p256dh: str`, `auth: str`, `created_at: datetime` — with `model_config = ConfigDict(from_attributes=True)`

- [x] Task 4: Create `push_service.py` — web push dispatch (AC: 3, 4)
  - [x] Create `backend/app/services/push_service.py`
  - [x] Implement `def send_web_push(subscription, payload: dict) -> None:`
  - [x] Use `pywebpush.webpush()` (sync, not `webpush_async`) — it is called from scheduler jobs which run in APScheduler's thread pool, not the async event loop
  - [x] `subscription_info` format (required by pywebpush)
  - [x] `vapid_private_key`: pass `settings.vapid_private_key` (string from env)
  - [x] `vapid_claims`: `{"sub": f"mailto:{settings.vapid_claim_email}"}`
  - [x] `data`: `json.dumps(payload)` (serialize dict to string)
  - [x] Wrap the `webpush()` call in `try/except WebPushException as e:` — log the error and return without re-raising (AC: 4)
  - [x] Also catch generic `Exception` as a fallback — log and swallow (AC: 4)
  - [x] Use `logging.getLogger(__name__)` for the module logger
  - [x] Guard: if `settings.vapid_private_key` is empty/blank, log a warning and return immediately

- [x] Task 5: Create `push.py` router — subscribe endpoint (AC: 2)
  - [x] Create `backend/app/routers/push.py`
  - [x] `router = APIRouter(prefix="/api/v1/push", tags=["push"])`
  - [x] Implement `POST /subscribe`: upsert logic — check if `endpoint` already exists; if yes, update `p256dh` and `auth` and return `200`; if no, insert new row and return `201`
  - [x] Place DB logic in the router (this is simple enough — no separate service file needed for upsert)
  - [x] Request body: `PushSubscribeRequest`; Response: `PushSubscriptionRead`
  - [x] Use `Response` class to set dynamic status code (201 vs 200)
  - [x] Register the router in `backend/app/main.py`: `from app.routers import push as push_router` then `app.include_router(push_router.router)`

- [x] Task 6: Write backend tests (AC: 1–4)
  - [x] Create `backend/tests/test_push.py`
  - [x] Test: `POST /api/v1/push/subscribe` with new endpoint → 201, row in DB
  - [x] Test: `POST /api/v1/push/subscribe` with same endpoint → 200, row updated (p256dh/auth refreshed)
  - [x] Test: `push_service.send_web_push()` with `WebPushException` → logs error, does NOT raise (use `unittest.mock.patch` to mock `pywebpush.webpush`)
  - [x] Test: `push_service.send_web_push()` with empty `vapid_private_key` → returns without calling pywebpush
  - [x] Use the existing `client` and `db_session` fixtures from `conftest.py`

- [x] Task 7: Verify (AC: 1–4)
  - [x] `cd backend && uv run uvicorn app.main:app --reload` — app starts, `/docs` shows push endpoint
  - [x] `cd backend && uv run pytest tests/ -v` — all tests pass (6 new push tests pass; 1 pre-existing unrelated failure in test_patch_partial_update)
  - [x] `cd backend && uv run ruff check app/` — lint passes clean

## Dev Notes

### Existing Code Being Modified

| File | Current State | Story 2.2 Changes |
|---|---|---|
| `backend/app/main.py` | Imports `tasks_router` only; includes `tasks_router.router` | ADD `push_router` import and `app.include_router(push_router.router)` |
| `backend/alembic/env.py` | Imports `from app.models import task  # noqa: F401` | ADD `from app.models import push_subscription  # noqa: F401` |

**New files to create:**
- `backend/app/models/push_subscription.py`
- `backend/app/schemas/push.py`
- `backend/app/services/push_service.py`
- `backend/app/routers/push.py`
- `backend/tests/test_push.py`
- `backend/alembic/versions/<hash>_add_push_subscriptions_table.py` (auto-generated by Alembic)

### `PushSubscription` Model — Complete Implementation

```python
# backend/app/models/push_subscription.py
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy import DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    endpoint: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    p256dh: Mapped[str] = mapped_column(Text, nullable=False)
    auth: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
```

No `updated_at` column — the architecture spec for `push_subscriptions` only lists `id`, `endpoint`, `p256dh`, `auth`, `created_at` (AC: 1).

### `push_service.py` — Complete Implementation

```python
# backend/app/services/push_service.py
import json
import logging

from pywebpush import WebPushException, webpush

from app.config import settings

logger = logging.getLogger(__name__)


def send_web_push(subscription, payload: dict) -> None:
    """Send a web push notification. Errors are logged, never re-raised."""
    if not settings.vapid_private_key:
        logger.warning("VAPID private key not configured — skipping push delivery")
        return

    subscription_info = {
        "endpoint": subscription.endpoint,
        "keys": {
            "p256dh": subscription.p256dh,
            "auth": subscription.auth,
        },
    }

    try:
        webpush(
            subscription_info=subscription_info,
            data=json.dumps(payload),
            vapid_private_key=settings.vapid_private_key,
            vapid_claims={"sub": f"mailto:{settings.vapid_claim_email}"},
        )
    except WebPushException as e:
        logger.error("Push delivery failed (WebPushException): %s", e)
    except Exception as e:
        logger.error("Push delivery failed (unexpected): %s", e)
```

**Key: `webpush()` is synchronous** — this is intentional. APScheduler job functions (`jobs.py`) run in a thread pool executor, not the async event loop. Using the sync `webpush()` is correct here. There is also a `webpush_async()` in pywebpush — do NOT use it here.

### `push.py` Router — Upsert Logic

The subscribe endpoint must handle both insert (201) and update (200):

```python
# backend/app/routers/push.py
from fastapi import APIRouter, Depends, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.push_subscription import PushSubscription
from app.schemas.push import PushSubscribeRequest, PushSubscriptionRead

router = APIRouter(prefix="/api/v1/push", tags=["push"])


@router.post("/subscribe", response_model=PushSubscriptionRead)
async def subscribe(
    body: PushSubscribeRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> PushSubscription:
    result = await db.execute(
        select(PushSubscription).where(PushSubscription.endpoint == body.endpoint)
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.p256dh = body.p256dh
        existing.auth = body.auth
        await db.commit()
        await db.refresh(existing)
        response.status_code = 200
        return existing

    sub = PushSubscription(
        endpoint=body.endpoint,
        p256dh=body.p256dh,
        auth=body.auth,
    )
    db.add(sub)
    await db.commit()
    await db.refresh(sub)
    response.status_code = 201
    return sub
```

### VAPID Key Generation

The `.env.example` already documents how to generate VAPID keys. For development/testing, you can generate them manually:

```bash
cd backend
uv run python -c "
from py_vapid import Vapid
v = Vapid()
v.generate_keys()
private_key = v.private_key
public_key = v.public_key
print('VAPID_PRIVATE_KEY=', v.private_pem().decode().strip())
print('VAPID_PUBLIC_KEY=', v.public_key.decode().strip())
"
```

However, for Story 2.2 the keys are NOT required to be populated in `.env` — `push_service.send_web_push()` guards against empty keys (Task 4). Tests mock pywebpush entirely, so real keys are not needed for tests to pass.

### `alembic/env.py` — Model Registration

Current `env.py` imports:
```python
from app.models import task  # noqa: F401
```

ADD directly below it:
```python
from app.models import push_subscription  # noqa: F401
```

This ensures Alembic autogenerate sees `PushSubscription` when generating the migration. Missing this import → `push_subscriptions` table will not appear in the generated migration.

### Test Strategy — Mock pywebpush

```python
# backend/tests/test_push.py (relevant test)
from unittest.mock import patch
from pywebpush import WebPushException

def test_send_web_push_logs_on_failure(monkeypatch):
    from app.services import push_service
    from app.models.push_subscription import PushSubscription

    # Minimal mock subscription
    sub = PushSubscription(endpoint="https://ex.com", p256dh="abc", auth="xyz")

    monkeypatch.setattr("app.config.settings.vapid_private_key", "fake_key")
    monkeypatch.setattr("app.config.settings.vapid_claim_email", "test@test.com")

    with patch("app.services.push_service.webpush", side_effect=WebPushException("expired")):
        # Must NOT raise
        push_service.send_web_push(sub, {"title": "Test"})
```

### pywebpush API Reference (installed version 2.3.0)

Confirmed working `webpush()` signature:
```python
webpush(
    subscription_info={"endpoint": "...", "keys": {"p256dh": "...", "auth": "..."}},
    data="<json string>",
    vapid_private_key="<base64url PKCS8 string from env>",
    vapid_claims={"sub": "mailto:you@example.com"},
)
```

- `subscription_info.keys` must be a nested dict — NOT flat fields
- `data` must be a string, not bytes — use `json.dumps(payload)`
- `vapid_private_key` accepts a string (reads the env var directly) or a PEM path — passing the key string directly works
- Raises `WebPushException` on any non-2xx response from the push service

### Architecture Boundaries (Must Follow)

- All DB access in `push.py` router (upsert logic is simple enough — no separate service needed)
- `push_service.py` contains NO DB access — it only dispatches the network call
- `send_web_push()` is synchronous — called from APScheduler jobs in thread pool context
- Scheduler jobs (`jobs.py`) will call `send_web_push()` in Story 2.6 — this story just wires it so it works standalone
- Error handling: catch-and-log, never propagate from `send_web_push()`

### Anti-Patterns to Avoid

- ❌ Using `webpush_async()` from pywebpush — scheduler jobs run synchronously
- ❌ Hardcoding VAPID keys in source — always read from `settings`
- ❌ Passing `data` as a dict to `webpush()` — it must be a JSON string
- ❌ Flat `subscription_info` (e.g. `{"endpoint": ..., "p256dh": ..., "auth": ...}`) — pywebpush requires `"keys"` as a nested dict
- ❌ Forgetting to register `push_subscription` model in `alembic/env.py` — migration will not include the table
- ❌ Adding `updated_at` to `PushSubscription` — not in the architecture spec; endpoint is updated in-place via upsert
- ❌ Creating a `push_service.py` that imports from `app.routers` — service layer must never import HTTP layer
- ❌ Making `send_web_push` raise on failure — it must catch all exceptions to protect scheduler jobs (AC: 4)
- ❌ Using `response_class=Response` on the subscribe endpoint — use `response: Response` as a parameter to set `status_code` dynamically while still returning a `response_model`

### File Locations Summary

```
backend/
  app/
    main.py                     ← UPDATE: add push_router.router include
    models/
      push_subscription.py       ← NEW: PushSubscription ORM model
    schemas/
      push.py                    ← NEW: PushSubscribeRequest, PushSubscriptionRead
    routers/
      push.py                    ← NEW: POST /api/v1/push/subscribe
    services/
      push_service.py            ← NEW: send_web_push()
  alembic/
    env.py                       ← UPDATE: import push_subscription model
    versions/
      <hash>_add_push_subscriptions_table.py  ← NEW (auto-generated)
  tests/
    test_push.py                 ← NEW: subscribe endpoint + push_service tests
```

### References

- Epic requirements: [epic-2-push-notifications-reminders.md#story-2.2](_bmad-output/planning-artifacts/epics/epic-2-push-notifications-reminders.md)
- Architecture: [core-architectural-decisions.md](_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md)
- Project structure: [project-structure-boundaries.md](_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md)
- Implementation patterns: [implementation-patterns-consistency-rules.md](_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md)
- Previous story (2-1): [2-1-apscheduler-sqlalchemy-job-store.md](_bmad-output/implementation-artifacts/2-1-apscheduler-sqlalchemy-job-store.md)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

Ultimate context engine analysis completed — comprehensive developer guide created.

Implementation complete (2026-05-25):
- Created PushSubscription model with all required fields (id, endpoint unique, p256dh, auth, created_at)
- Generated and applied Alembic migration 9bd82d4f717c — push_subscriptions table confirmed in DB
  - Note: removed autogenerated apscheduler_jobs drop/create from migration (APScheduler manages that table at runtime outside Alembic)
- Created PushSubscribeRequest and PushSubscriptionRead Pydantic schemas
- Created push_service.send_web_push() — sync, catches WebPushException and generic Exception, guards against missing VAPID key
- Created push router with upsert logic (201 new / 200 existing) registered in main.py
- 6 new tests all pass; ruff lint clean; pre-existing test_patch_partial_update failure unrelated to this story

### File List

- `backend/app/main.py` (modified — push router included)
- `backend/app/models/push_subscription.py` (NEW)
- `backend/app/schemas/push.py` (NEW)
- `backend/app/routers/push.py` (NEW)
- `backend/app/services/push_service.py` (NEW)
- `backend/alembic/env.py` (modified — push_subscription model registered)
- `backend/alembic/versions/9bd82d4f717c_add_push_subscriptions_table.py` (NEW — auto-generated)
- `backend/tests/test_push.py` (NEW)

### Review Findings

- [x] [Review][Patch] `@router.post("/subscribe")` missing `status_code=201` on decorator — OpenAPI docs advertise 200 for a create endpoint [backend/app/routers/push.py:12]
- [x] [Review][Patch] `vapid_private_key` blank guard misses whitespace-only strings — change `if not settings.vapid_private_key:` to `if not (settings.vapid_private_key or "").strip():` [backend/app/services/push_service.py:13]
- [x] [Review][Patch] Race condition in subscribe endpoint: check-then-insert without transaction isolation — catch `IntegrityError` on insert and fall back to update [backend/app/routers/push.py:30-40]
- [x] [Review][Patch] Add test: `send_web_push` called with valid key asserts `webpush` receives correct nested `subscription_info` with `keys` dict (validates AC 3 format constraint) [backend/tests/test_push.py]
- [x] [Review][Defer] `p256dh`/`auth` fields accept any string — no base64url validation; belongs in a future security hardening story [backend/app/schemas/push.py] — deferred, no spec requirement
- [x] [Review][Defer] 410 Gone from push service silently swallowed — stale subscription pruning is a future story concern [backend/app/services/push_service.py:32-33] — deferred, out of scope
- [x] [Review][Defer] No `unsubscribe` endpoint — stale subscriptions accumulate; future story [backend/app/routers/push.py] — deferred, not in 2.2 AC
- [x] [Review][Defer] CORS `allow_credentials` missing — pre-existing config, no spec requirement for these stories [backend/app/main.py] — deferred, pre-existing

## Change Log

- 2026-05-25: Story created — push subscription model, VAPID backend, subscribe endpoint, push service.
- 2026-05-25: Implementation complete — all 7 tasks done; 6 new tests passing; story status → review.
- 2026-05-25: Code review complete — 4 patch findings, 4 deferred.
