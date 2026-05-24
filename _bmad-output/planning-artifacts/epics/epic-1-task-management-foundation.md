# Epic 1: Task Management Foundation

User can create tasks via a text form (name + deadline + description), view them sorted by deadline, edit, mark complete (→ archive), delete, and browse the archive. The app runs end-to-end with solid CRUD — no reminders yet.

## Story 1.1: Project Initialization & Running Skeleton

As a developer,
I want the monorepo initialized with Vite + React-TS frontend and FastAPI + uv backend both running locally,
So that I have a connected development environment ready to build on.

**Acceptance Criteria:**

**Given** the repository is set up using the architecture's init sequence (monorepo root → frontend Vite scaffold → backend uv init)
**When** I run `npm run dev` in `/frontend` and `uv run uvicorn app.main:app --reload` in `/backend`
**Then** the frontend renders at `http://localhost:5173` and `GET /health` returns `{"status": "ok"}` (200)
**And** the frontend `VITE_API_BASE_URL` points to the backend; FastAPI CORS allows `localhost:5173` via `ALLOWED_ORIGINS` env var

**Given** the backend environment is configured
**When** I run `alembic upgrade head`
**Then** the command completes without error against a fresh SQLite DB at the path specified by `DATABASE_URL`

**Given** the project tooling is installed
**When** I run `ruff check .` (backend), `npx vitest run` (frontend), and `uv run pytest` (backend)
**Then** all three commands complete with no errors on the empty project

**Given** push notification support is needed later
**When** project init is complete
**Then** VAPID keys have been generated and recorded in `backend/.env` (file not committed); `.env.example` documents all required env vars for both frontend and backend

---

## Story 1.2: Task Data Model & CRUD API

As a developer,
I want the Task data model in the database and all task CRUD endpoints responding correctly,
So that the full API surface is verifiable before the frontend is built.

**Acceptance Criteria:**

**Given** the Alembic migration is applied
**When** I inspect the SQLite schema
**Then** a `tasks` table exists with: `id` (int PK auto-increment), `name` (text not null), `deadline_at` (datetime UTC not null), `description` (text nullable), `is_completed` (bool default false), `completed_at` (datetime nullable), `created_at`, `updated_at`

**Given** the API is running
**When** I call `GET /api/v1/tasks/`
**Then** it returns `[]` (200) when empty; returns only active tasks by default; `?include_archived=true` returns all tasks including completed

**Given** the API is running
**When** I call `POST /api/v1/tasks/` with `{"name": "Call dentist", "deadline_at": "2026-06-05T10:00:00Z"}`
**Then** it returns the created task (201) with all fields in `snake_case`; `deadline_at` stored and returned as UTC ISO 8601

**Given** a task exists
**When** I call `GET /api/v1/tasks/{id}`
**Then** it returns the task (200); non-existent id returns `{"detail": "Task not found", "code": "TASK_NOT_FOUND"}` (404)

**Given** a task exists
**When** I call `PATCH /api/v1/tasks/{id}` with updated fields
**Then** it returns the fully updated task (200); only provided fields are changed

**Given** a task exists
**When** I call `POST /api/v1/tasks/{id}/complete`
**Then** it sets `is_completed=true` and `completed_at` to current UTC; returns 204

**Given** a task exists
**When** I call `DELETE /api/v1/tasks/{id}`
**Then** it permanently removes the task and returns 204

**Given** any task mutation runs
**When** the service layer executes
**Then** all business logic is in `task_service.py`; routers contain only HTTP handling; no business logic in Pydantic schemas

---

## Story 1.3: Frontend Foundation & Task List

As a user,
I want to open the app and immediately see my active tasks sorted by deadline,
So that I know what's next without any loading friction.

**Acceptance Criteria:**

**Given** the frontend is open in a browser
**When** the task list renders
**Then** active tasks appear sorted by `deadline_at` ascending; each TaskCard shows task name (`text-base font-medium`) and deadline in local time (`text-sm`)
**And** overdue tasks (deadline in the past) appear at the top with `border-l-4 border-amber-500` on the card

**Given** there are no active tasks
**When** the task list renders
**Then** the empty state "Nothing yet. Tap the mic to add your first task." is displayed

**Given** the API response is slow
**When** the task list is loading
**Then** 3 `animate-pulse bg-zinc-800 rounded-2xl` placeholder cards show for up to 500ms then resolve to real data

**Given** the design system is applied
**When** I view any screen
**Then** page background is `bg-zinc-900`; cards are `bg-zinc-800 rounded-2xl`; accent is `violet-500`; font stack is system sans-serif; layout is `max-w-lg mx-auto` (full-bleed on mobile)
**And** dark mode defaults to system preference via `class`-based Tailwind dark mode

**Given** the frontend architecture is wired
**When** any API call is made
**Then** all HTTP goes through `src/lib/api.ts` (single Axios instance); TanStack Query manages cache with key `["tasks"]`; Zustand manages UI state

**Given** voice capture is not yet implemented
**When** the task list is visible
**Then** a violet circular FAB placeholder is fixed at `bottom-6 right-6` (56px `rounded-full`); visible but not yet wired to creation

---

## Story 1.4: Text Task Creation

As a user,
I want to create a task by typing its name and deadline in a form,
So that I can add tasks immediately without needing voice capture.

**Acceptance Criteria:**

**Given** the task list is visible
**When** I tap the FAB
**Then** a ConfirmationSheet slides up (`shadcn Sheet side="bottom"`, `bg-zinc-700`) with: a NameField card (`bg-zinc-800`, `text-lg font-medium` input, auto-focused), a DeadlineChip card, and an optional description textarea

**Given** the ConfirmationSheet is open and deadline is not set
**When** I view the DeadlineChip
**Then** it shows an amber border and "Tap to set deadline" placeholder

**Given** the ConfirmationSheet is open
**When** I tap the DeadlineChip
**Then** a date/time picker opens; selecting a value updates the chip to "Thu, Jun 5 · 10:00 AM" format (local time)

**Given** name or deadline is missing
**When** I view the Save button
**Then** it has `aria-disabled="true"` and does not respond to taps

**Given** both name and deadline are filled
**When** I tap Save
**Then** `POST /api/v1/tasks/` is called with `deadline_at` as UTC ISO 8601; the sheet slides down; the new TaskCard fades into the list at the correct deadline-sorted position; TanStack Query cache `["tasks"]` is invalidated

**Given** the ConfirmationSheet is open
**When** I tap Cancel or swipe the sheet down
**Then** the sheet dismisses and the task list is unchanged

---

## Story 1.5: Task Detail & Edit

As a user,
I want to tap a task to see its full details and edit any field,
So that I can review and correct tasks after they are created.

**Acceptance Criteria:**

**Given** tasks exist in the list
**When** I tap a TaskCard
**Then** the app navigates to `/tasks/:taskId` (slide-left push transition) showing: name (`text-xl font-semibold`), deadline in local time inside `<time datetime="...">` (UTC value in attribute), and description if set

**Given** the task detail view is open
**When** I tap Edit
**Then** all fields become editable using the same ConfirmationSheet field layout (NameField card, DeadlineChip, description textarea)

**Given** I have made edits and tap Save
**When** the API call completes
**Then** `PATCH /api/v1/tasks/{id}` is called; the detail view reflects updated data; TanStack Query caches `["tasks"]` and `["tasks", taskId]` are both invalidated

**Given** the task detail view is open
**When** I tap the back arrow or swipe right
**Then** the app returns to the task list with a slide-right transition

**Given** any interactive element on the detail or edit view
**When** it receives keyboard focus
**Then** a `focus-visible:ring-2 ring-violet-500 ring-offset-2 ring-offset-zinc-900` ring is visible

---

## Story 1.6: Task Completion & Archive

As a user,
I want to mark a task complete and browse completed tasks in the archive,
So that I can close out finished work and see what I've accomplished.

**Acceptance Criteria:**

**Given** a task detail view is open
**When** I tap "Mark complete" (primary `bg-violet-500` button)
**Then** `POST /api/v1/tasks/{id}/complete` is called; the TaskCard animates out of the active list (shrink + fade ~300ms); TanStack Query cache `["tasks"]` is invalidated

**Given** all tasks are completed
**When** the active list renders
**Then** the empty state "All done. Nice." is displayed

**Given** I tap the archive icon in the header
**When** the archive sheet opens
**Then** it slides up (not a push navigation) and shows completed tasks in reverse-completion order; each row shows name and local completion time

**Given** the archive is empty
**When** the archive sheet opens
**Then** "No completed tasks yet." is displayed

**Given** a TaskCard is showing in the active list
**When** I swipe left on the card
**Then** a green complete action is revealed; confirming it triggers the same completion flow as tapping "Mark complete" on the detail view

---

## Story 1.7: Task Deletion

As a user,
I want to permanently delete a task with a confirmation step,
So that I can remove unwanted tasks without accidentally losing data.

**Acceptance Criteria:**

**Given** a task detail view is open
**When** I tap "Delete"
**Then** a `shadcn Dialog` opens: "Delete this task? This can't be undone." with [Cancel] (focused by default) and [Delete]

**Given** the delete dialog is open
**When** I tap Cancel or press Escape
**Then** the dialog closes and the task is unchanged

**Given** the delete dialog is open
**When** I tap Delete
**Then** `DELETE /api/v1/tasks/{id}` is called (204); dialog closes; app navigates back to task list; task is gone; TanStack Query cache `["tasks"]` is invalidated

**Given** the Delete button is rendered anywhere
**When** I view it
**Then** it uses `text-red-400` ghost style (no filled red button) and is never the default-focused element

**Given** a completed task is shown in the archive
**When** I tap Delete on it
**Then** the same confirmation dialog and deletion flow applies

**Given** a TaskCard is showing in the active list
**When** I swipe right on the card
**Then** a red delete action is revealed; confirming it triggers the same deletion dialog as tapping "Delete" on the detail view

---
