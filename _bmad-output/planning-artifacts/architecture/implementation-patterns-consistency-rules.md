# Implementation Patterns & Consistency Rules

## Naming Patterns

**Database (SQLAlchemy models + Alembic):**
- Table names: `snake_case` plural — `tasks`, `push_subscriptions`, `apscheduler_jobs`
- Column names: `snake_case` — `task_id`, `deadline_at`, `created_at`
- Primary keys: always `id` (integer, auto-increment)
- Foreign keys: `{table_singular}_id` — e.g. `task_id`
- Timestamps: `created_at`, `updated_at` (UTC ISO 8601)

**API endpoints:**
- Plural nouns, `snake_case`: `/api/v1/tasks/`, `/api/v1/push/`
- Path parameters: `{id}` — e.g. `/api/v1/tasks/{id}`
- Query params: `snake_case` — `?include_archived=true`
- JSON request/response fields: `snake_case` end-to-end

**Frontend — files:**
- React components: `PascalCase.tsx` — `TaskCard.tsx`, `VoiceFAB.tsx`
- Hooks: `camelCase` prefixed with `use` — `useTasks.ts`, `useVoiceCapture.ts`
- Zustand stores: `camelCase` suffixed with `Store` — `uiStore.ts`
- Feature folders: `camelCase` — `src/features/tasks/`, `src/features/voice/`
- Utility files: `camelCase` — `src/lib/api.ts`, `src/lib/dateUtils.ts`

**Frontend — code:**
- Components: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE` — `MAX_OFFSET_COUNT`, `API_BASE_URL`
- TypeScript types/interfaces: `PascalCase` — `Task`, `PushSubscription`, `ReminderOffset`

**Backend — code:**
- Pydantic schemas: `PascalCase` with suffix — `TaskCreate`, `TaskRead`, `TaskUpdate`
- SQLAlchemy models: `PascalCase` singular — `Task`, `PushSubscription`
- Route functions: `snake_case` verb-noun — `create_task`, `list_tasks`, `complete_task`
- Service functions: `snake_case` — `schedule_reminders`, `cancel_task_jobs`

## Structure Patterns

**Backend layout:**
```
backend/
  app/
    main.py              # FastAPI app + lifespan (scheduler start/stop)
    config.py            # Settings via pydantic-settings
    database.py          # SQLAlchemy async engine + session factory
    models/              # SQLAlchemy ORM models (one file per domain)
      task.py
      push_subscription.py
    schemas/             # Pydantic request/response schemas
      task.py
      push.py
    routers/             # FastAPI routers (one file per resource)
      tasks.py
      push.py
      parse.py           # LLM parse endpoint
    services/            # Business logic (no HTTP concerns)
      task_service.py
      scheduler_service.py
      push_service.py
      llm_service.py
    scheduler/
      setup.py           # APScheduler init + SQLAlchemy job store config
      jobs.py            # Scheduled job functions (send_notification)
  alembic/
    versions/
  tests/
    test_tasks.py
    test_scheduler.py
```

**Frontend layout:**
```
frontend/src/
  features/
    tasks/
      TaskList.tsx
      TaskCard.tsx
      TaskDetail.tsx
      useTasks.ts        # TanStack Query hooks for task CRUD
    voice/
      VoiceFAB.tsx
      ConfirmationSheet.tsx
      useVoiceCapture.ts
    notifications/
      TrustBanner.tsx
      usePushSubscription.ts
  components/ui/         # shadcn/ui components (do not edit directly)
  hooks/                 # Shared hooks used across features
  lib/
    api.ts               # Axios/fetch wrapper with base URL + error handling
    queryClient.ts       # TanStack Query client config
    store.ts             # Zustand UI store
  router.tsx             # React Router v7 route definitions
  main.tsx
```

**Tests:**
- Backend: `backend/tests/` — top-level, not inside `app/`
- Frontend: co-located — `TaskCard.test.tsx` next to `TaskCard.tsx`

## Format Patterns

**API responses — success:**
- Return resource directly (no wrapper envelope)
- List endpoints return arrays: `[{...}, {...}]`
- Create/update return the full updated resource
- Complete/delete return `204 No Content`

**API responses — errors:**
```json
{ "detail": "Task not found", "code": "TASK_NOT_FOUND" }
```

**HTTP status codes:**
- `200` — successful GET, PATCH
- `201` — successful POST (resource created)
- `204` — successful DELETE or action (complete)
- `400` — validation error (bad input)
- `404` — resource not found
- `422` — Pydantic/FastAPI validation failure (automatic)

**Date/time:**
- All datetimes stored and transmitted as UTC ISO 8601: `"2026-05-24T10:00:00Z"`
- Frontend converts to local time for display only — never store local time
- Field name: `deadline_at` in both API payload and DB column

**Reminder offsets:**
- Stored as integer minutes: `15`, `30`, `60`, `1440`, `2880`
- Frontend maps to display labels: `{15: "15m", 30: "30m", 60: "1h", 1440: "1d", 2880: "2d"}`

## Communication Patterns

**TanStack Query — cache keys:**
- Task list: `["tasks"]`
- Single task: `["tasks", taskId]`
- Archive: `["tasks", "archive"]`
- Invalidate `["tasks"]` on any task mutation

**Zustand store shape:**
```typescript
interface UIStore {
  confirmationSheetOpen: boolean
  activeTaskId: string | null
  trustBannerMessage: string | null
  openConfirmationSheet: () => void
  closeConfirmationSheet: () => void
  setActiveTask: (id: string | null) => void
  showTrustBanner: (message: string) => void
  clearTrustBanner: () => void
}
```

**API client (`src/lib/api.ts`):**
- Single axios instance with `baseURL = import.meta.env.VITE_API_BASE_URL`
- All requests go through this instance — no raw `fetch()` calls in components
- Errors thrown as typed `ApiError` objects for consistent TanStack Query error handling

## Process Patterns

**Error handling:**
- Backend: `HTTPException` for expected errors; global 500 handler for unhandled exceptions
- Frontend: TanStack Query `onError` callbacks — never `try/catch` in components
- User-facing errors: inline only, never `alert()`

**Loading states:**
- TanStack Query `isLoading` / `isFetching` used directly in components
- No global loading overlay — local skeleton/spinner per component
- VoiceFAB processing state is the sole exception (full-FAB loading indicator)

**Notification lifecycle — mandatory for all task mutations:**
- Create → `schedule_reminders(task)`
- Edit → `cancel_task_jobs(task_id)` then `schedule_reminders(task)`
- Complete → `cancel_task_jobs(task_id)` + create next instance if recurring
- Delete → `cancel_task_jobs(task_id)`

**Recurring task generation:**
- Triggered only in `task_service.complete_task()` — never in routers or scheduler jobs
- Next deadline = current deadline + recurrence interval, computed in service layer

## Enforcement Guidelines

**All AI agents MUST:**
- Use `snake_case` for all JSON fields — no `camelCase` in API payloads
- Route all HTTP calls through `src/lib/api.ts` — no raw `fetch()` in components
- Call `scheduler_service` on every task mutation — never skip job sync
- Store and transmit all datetimes as UTC; convert to local only at display time
- Place business logic in `services/` — routers contain only HTTP handling
- Run `alembic upgrade head` before any schema-changing deployment

**Anti-patterns to avoid:**
- ❌ `camelCase` JSON fields in API responses
- ❌ Scheduling logic inside routers or models
- ❌ Raw `fetch()` calls outside `src/lib/api.ts`
- ❌ Local datetime storage or transmission
- ❌ Business logic in Pydantic schemas
- ❌ Skipping `cancel_task_jobs` before rescheduling (causes duplicate notifications)
