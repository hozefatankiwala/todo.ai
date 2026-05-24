# Core Architectural Decisions

## Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Database migrations: Alembic
- Scheduler job persistence: SQLAlchemy job store (SQLite)
- Frontend routing: React Router v7 (required for notification deep-links)
- Frontend server state: TanStack Query

**Important Decisions (Shape Architecture):**
- API versioning: `/api/v1/` prefix
- CORS: Environment-driven via `ALLOWED_ORIGINS` env var
- Frontend UI state: Zustand
- Deployment: Railway (persistent volume for SQLite)
- Reverse proxy: Caddy (automatic HTTPS + HTTP Basic Auth)

**Deferred Decisions (Post-MVP):**
- Notification snooze — explicitly out of scope (PRD Non-Goals)
- Calendar sync — deferred indefinitely
- Native mobile app — revisit if PWA push limitations on iOS become blocking

## Data Architecture

**Database:** SQLite via SQLAlchemy 2.0 async (`aiosqlite` driver)
- Single file, zero ops, sufficient for single-user volume
- Persistent volume on Railway ensures file survives redeploys

**Migrations:** Alembic
- Migration history tracked in `backend/alembic/versions/`
- `uv add alembic` added to init sequence
- Rationale: builds the right habit for future projects; safe schema evolution without data loss

**Scheduler Job Store:** APScheduler SQLAlchemy job store
- Jobs persisted in the same SQLite DB (`apscheduler_jobs` table)
- Jobs survive server restarts and redeploys
- Rationale: prevents silent notification failures after any server event

## Authentication & Security

**Application-level auth:** None — single user, no accounts

**Access control:** HTTP Basic Auth via Caddy at reverse proxy level
- Username/password in Caddy environment variables (not in app code)
- Zero application code changes required

**VAPID keys (Web Push):** Generated once at project init, stored in `.env` (never committed)

**CORS:** Enabled in FastAPI middleware, driven by `ALLOWED_ORIGINS` env var
- Development: `ALLOWED_ORIGINS=http://localhost:5173`
- Production: `ALLOWED_ORIGINS=` (empty — same-origin via Caddy, no CORS needed)

## API & Communication Patterns

**Style:** REST, FastAPI auto-generates OpenAPI docs at `/docs`

**Versioning:** All routes under `/api/v1/` prefix
- Implemented via FastAPI `APIRouter(prefix="/api/v1")`

**Error handling:** FastAPI exception handlers return consistent JSON:
```json
{ "detail": "human-readable message", "code": "MACHINE_READABLE_CODE" }
```

**Key endpoints:**
- `POST /api/v1/tasks/` — create task, schedule notifications
- `GET /api/v1/tasks/` — list active tasks
- `PATCH /api/v1/tasks/{id}` — edit task, reschedule notifications
- `POST /api/v1/tasks/{id}/complete` — complete task, cancel notifications, trigger recurrence
- `DELETE /api/v1/tasks/{id}` — delete task, cancel notifications
- `GET /api/v1/tasks/{id}` — task detail (notification deep-link target)
- `POST /api/v1/push/subscribe` — save push subscription (VAPID)

## Frontend Architecture

**Server state:** TanStack Query (React Query v5)
- Owns all API fetching, caching, loading/error states
- Cache invalidated on every task mutation

**UI state:** Zustand
- One store for: `confirmationSheetOpen`, `activeTaskId`, `trustBannerMessage`

**Routing:** React Router v7
- `"/"` — task list (home)
- `"/tasks/:taskId"` — task detail (notification deep-link target)
- `"/archive"` — archive view
- Confirmation screen: not a route — rendered as a Sheet over the task list

**Component structure:**
- `src/features/tasks/` — task list, task card, task detail
- `src/features/voice/` — VoiceFAB, confirmation sheet
- `src/features/notifications/` — push subscription, trust banner
- `src/components/ui/` — shadcn/ui components (owned by codebase)
- `src/hooks/` — shared hooks (useTasks, useVoiceCapture, usePushSubscription)

## Infrastructure & Deployment

**Platform:** Railway
- Frontend: built by Vite (`npm run build`) → static files served by Caddy
- Backend: FastAPI via Uvicorn, single Railway service
- Persistent volume mounted at `/data/` → SQLite file at `/data/simple-todo.db`

**Reverse proxy:** Caddy
- Automatic HTTPS (Let's Encrypt)
- HTTP Basic Auth for access control
- Routes `/api/` → FastAPI (Uvicorn), everything else → Vite static build

**Environment configuration:**
- `backend/.env` — `DATABASE_URL`, `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_CLAIM_EMAIL`, `ALLOWED_ORIGINS`
- `frontend/.env` — `VITE_API_BASE_URL`, `VITE_VAPID_PUBLIC_KEY`
- Neither `.env` committed to git

## Decision Impact Analysis

**Implementation Sequence (order matters):**
1. Monorepo init + project scaffolding (frontend + backend)
2. Alembic + SQLAlchemy models (Task, Reminder, PushSubscription)
3. FastAPI CRUD routes (`/api/v1/tasks/`)
4. APScheduler + SQLAlchemy job store wired to task mutations
5. VAPID key generation + push subscription endpoint + pywebpush dispatch
6. React Router v7 + TanStack Query + Zustand wired to API
7. Voice capture (Web Speech API) + LLM parse endpoint
8. PWA manifest + service worker (vite-plugin-pwa) + push permission flow
9. Caddy config + Railway deployment + persistent volume

**Cross-Component Dependencies:**
- Every task mutation (create/edit/complete/delete) must touch the scheduler — notification lifecycle is a cross-cutting concern on all task endpoints
- Push subscription must exist before any notification can fire — onboarding sequence must enforce this order
- Alembic migration must run before FastAPI starts — Railway start command: `alembic upgrade head && uvicorn app.main:app`
- VAPID public key must be shared between backend (signing) and frontend (subscription) via environment variables
