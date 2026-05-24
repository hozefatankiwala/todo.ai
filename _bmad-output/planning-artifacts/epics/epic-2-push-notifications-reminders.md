# Epic 2: Push Notifications & Reminders

User can select reminder offsets when creating or editing a task, grant push notification permission, receive notifications on their phone within ±60 seconds of the scheduled time, and tap a notification to land directly on the task detail.

## Story 2.1: APScheduler & SQLAlchemy Job Store

As a developer,
I want APScheduler running inside the FastAPI process with jobs persisted in SQLite,
So that scheduled notifications survive server restarts and redeploys without being lost.

**Acceptance Criteria:**

**Given** the FastAPI app starts
**When** the lifespan context manager executes
**Then** `AsyncIOScheduler` starts with a SQLAlchemy job store pointing to the same SQLite DB (`apscheduler_jobs` table auto-created)
**And** the scheduler shuts down cleanly when the app stops

**Given** the scheduler is running and a test job is added
**When** the FastAPI process is restarted
**Then** the job is still present in the job store and will fire at its scheduled time

**Given** a notification job is scheduled
**When** the job ID is inspected
**Then** it follows the convention `reminder_{task_id}_{offset_minutes}` (e.g. `reminder_42_60`)

**Given** the scheduler setup
**When** I inspect the code
**Then** scheduler init lives in `backend/app/scheduler/setup.py`; job functions live in `backend/app/scheduler/jobs.py`; no DB mutations occur inside job functions (only `push_service` is called)

---

## Story 2.2: Push Subscription & VAPID Backend

As a developer,
I want the backend to store push subscriptions and send a test web push,
So that the full push pipeline is verified before wiring it to task mutations.

**Acceptance Criteria:**

**Given** the Alembic migration is applied
**When** I inspect the SQLite schema
**Then** a `push_subscriptions` table exists with: `id` (int PK), `endpoint` (text not null unique), `p256dh` (text not null), `auth` (text not null), `created_at`

**Given** a browser push subscription object
**When** I call `POST /api/v1/push/subscribe` with `{endpoint, p256dh, auth}`
**Then** the subscription is saved (201) or updated if the endpoint already exists (200)

**Given** a subscription exists and VAPID keys are configured in `backend/.env`
**When** `push_service.send_web_push(subscription, payload)` is called
**Then** the web push is dispatched via `pywebpush` and the browser receives it
**And** VAPID private key, public key, and claim email are read from environment; never hardcoded

**Given** the push service is invoked
**When** the delivery fails (e.g. subscription expired)
**Then** the error is logged but does not crash the scheduler job or the API response

---

## Story 2.3: Offset Selection UI

As a user,
I want to select one or more reminder offsets when creating or editing a task,
So that I can control exactly how far in advance I am reminded.

**Acceptance Criteria:**

**Given** the ConfirmationSheet is open (text creation or edit)
**When** I view the offset section
**Then** an OffsetSelector row shows 5 pill chips: 15m · 30m · 1h · 1d · 2d; none are selected by default
**And** the chips use `role="group" aria-label="Reminder offsets"`; each chip uses `role="checkbox"` with `aria-checked`

**Given** the OffsetSelector is visible
**When** I tap a chip
**Then** it toggles to selected state (`bg-violet-500 text-white`); tapping again deselects it (`bg-zinc-700 text-zinc-400`)
**And** multiple chips can be selected simultaneously

**Given** a chip is selected whose offset falls before the current time relative to the task deadline
**When** I tap Save
**Then** a non-blocking inline warning appears ("This reminder is in the past") but Save is not blocked

**Given** the task edit view is open for an existing task
**When** the OffsetSelector renders
**Then** chips corresponding to the task's existing offsets are pre-selected

**Given** the task model
**When** offsets are stored
**Then** they are persisted as an array of integer minutes: `[15, 30, 60, 1440, 2880]`; the `tasks` table gains an `offsets` column (JSON or comma-separated integers); an Alembic migration is created

---

## Story 2.4: Notification Scheduling on Task Mutations

As a user,
I want reminder notifications to be automatically scheduled, rescheduled, or cancelled whenever I create, edit, complete, or delete a task,
So that my scheduled reminders always reflect the current state of each task.

**Acceptance Criteria:**

**Given** a task is created with offsets `[60, 1440]` and `deadline_at = 2026-06-05T10:00:00Z`
**When** `POST /api/v1/tasks/` completes
**Then** two APScheduler jobs are created: `reminder_N_60` (fires at 09:00Z) and `reminder_N_1440` (fires on 2026-06-04T10:00Z)
**And** `scheduler_service.schedule_reminders(task)` is called from `task_service`, not from the router

**Given** a task is edited and its deadline or offsets change
**When** `PATCH /api/v1/tasks/{id}` completes
**Then** `scheduler_service.cancel_task_jobs(task_id)` is called first, then `scheduler_service.schedule_reminders(task)` — ensuring no duplicate jobs exist

**Given** a task is marked complete
**When** `POST /api/v1/tasks/{id}/complete` completes
**Then** `scheduler_service.cancel_task_jobs(task_id)` is called; no further notifications fire for this task

**Given** a task is deleted
**When** `DELETE /api/v1/tasks/{id}` completes
**Then** `scheduler_service.cancel_task_jobs(task_id)` is called; all associated jobs are removed from the job store

**Given** a task with zero offsets selected
**When** it is saved
**Then** no jobs are scheduled; no error is raised

---

## Story 2.5: Push Permission & Subscription Flow

As a user,
I want the app to request push notification permission at the right moment and subscribe my browser,
So that reminders can reach me even when the app tab is closed.

**Acceptance Criteria:**

**Given** I am saving a task with at least one offset selected for the first time
**When** I tap Save
**Then** the browser push notification permission prompt fires before the API call completes
**And** the permission prompt does not fire on app open or on saves with zero offsets

**Given** I grant notification permission
**When** the browser subscribes
**Then** `POST /api/v1/push/subscribe` is called with the VAPID subscription object; the subscription is stored; subsequent saves do not re-prompt
**And** `VITE_VAPID_PUBLIC_KEY` is used on the frontend to create the push subscription (never the private key)

**Given** I deny notification permission
**When** the denial is detected
**Then** an inline non-blocking warning appears: "Reminders won't fire — notifications are blocked"; the task is still saved normally
**And** the permission state is persisted; the prompt is not shown again on subsequent saves

**Given** permission has already been granted in a previous session
**When** I open the app again
**Then** no permission prompt appears; `usePushSubscription` re-registers the subscription silently if needed

---

## Story 2.6: Notification Delivery & Content

As a user,
I want to receive a push notification on my device at the scheduled time with the task name and time-to-deadline,
So that I am reminded of the task at exactly the right moment.

**Acceptance Criteria:**

**Given** a task has a scheduled APScheduler job
**When** the job fires (`send_notification(task_id, offset_minutes)` in `scheduler/jobs.py`)
**Then** `push_service.send_web_push(subscription, payload)` is called with payload: `{"title": "{task name}", "body": "{task name} — due in {human offset}", "task_id": "{id}"}`
**And** the human offset maps: 15→"15 minutes", 30→"30 minutes", 60→"1 hour", 1440→"1 day", 2880→"2 days"

**Given** the service worker receives the push event
**When** the push data is parsed
**Then** `self.registration.showNotification(title, {body, data: {task_id}})` is called; the notification is visible on the device lock screen

**Given** the notification fires
**When** I check the timing
**Then** the notification fires within ±60 seconds of the scheduled UTC time

**Given** the service worker is registered
**When** I inspect the frontend build
**Then** `vite-plugin-pwa` generates the service worker; the push event handler and `notificationclick` handler are in `src/service-worker.ts`

---

## Story 2.7: Notification Deep-Link

As a user,
I want tapping a notification to open the app directly on the relevant task,
So that I can act on it immediately without searching through the task list.

**Acceptance Criteria:**

**Given** a push notification is showing on my device
**When** I tap it
**Then** the app opens (or focuses if already open) and navigates to `/tasks/:taskId` for the task referenced in the notification payload

**Given** the app is closed when the notification is tapped
**When** the app launches
**Then** React Router resolves `/tasks/:taskId` and renders the TaskDetail view for that task
**And** `useDeepLink.ts` in `src/hooks/` handles the `notificationclick` event and posts a message to the app to trigger navigation

**Given** the app is open on the task list when the notification is tapped
**When** the navigation fires
**Then** the app slides to the TaskDetail view for the correct task without a full reload

**Given** the task referenced in the notification has been deleted
**When** the deep-link resolves
**Then** the API returns 404; the app shows an inline message "This task no longer exists" and returns to the task list

---

## Story 2.8: Trust Banner

As a user,
I want to see the exact scheduled reminder times immediately after saving a task,
So that I can put my phone down knowing the reminders are set without having to verify.

**Acceptance Criteria:**

**Given** I save a task with one or more offsets selected
**When** the ConfirmationSheet dismisses
**Then** a TrustBanner appears pinned below the header: `bg-green-950 border border-green-900 rounded-xl` with a checkmark icon
**And** the banner text reads "Saved · Reminders: {time1}, {time2}" where times are local-formatted (e.g. "Wed 9am, Thu 9am")

**Given** I save a task with zero offsets selected
**When** the ConfirmationSheet dismisses
**Then** the TrustBanner reads "Saved · No reminders set"

**Given** the TrustBanner is showing
**When** 3 seconds elapse
**Then** it fades out automatically; it does not stack if another task is saved before it fades

**Given** the TrustBanner is rendered
**When** a screen reader reads the page
**Then** the banner has `aria-live="polite"` so the reminder confirmation is announced without interrupting

---
