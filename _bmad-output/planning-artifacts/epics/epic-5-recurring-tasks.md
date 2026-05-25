# Epic 5: Recurring Tasks

User can set a task to repeat via voice or UI picker; completing an instance auto-generates the next one with the same offsets and reminders already scheduled — no action required.

## Story 5.1: Recurrence Data Model & API

As a developer,
I want the recurrence pattern stored on tasks and the API to support the series/instance model,
So that the backend can correctly generate next instances and manage series termination.

**Acceptance Criteria:**

**Given** an Alembic migration is applied
**When** I inspect the SQLite schema
**Then** the `tasks` table has a `recurrence` column (JSON, nullable) storing: `{"type": "weekly", "days": [1, 4]}` for "every Monday and Thursday"; `{"type": "daily"}` for daily; `{"type": "monthly", "day": 15}` for monthly on the 15th
**And** a `series_id` column (int nullable, self-referencing) links instances to their originating series task

**Given** a task is created with a recurrence pattern
**When** `POST /api/v1/tasks/` is called with a `recurrence` field
**Then** the task is saved with the recurrence JSON; the response includes the `recurrence` field

**Given** a task has a recurrence pattern
**When** `PATCH /api/v1/tasks/{id}` is called with an updated or removed recurrence
**Then** the task's recurrence is updated; reminders are rescheduled via `cancel_task_jobs` then `schedule_reminders`

**Given** the task list API
**When** `GET /api/v1/tasks/` is called
**Then** the response includes `recurrence` and `series_id` on each task object

---

## Story 5.2: Recurrence UI — Picker & Badge

As a user,
I want to set a recurrence pattern manually on the Confirmation Sheet and see it displayed on the task card,
So that I can configure and identify recurring tasks at a glance.

**Acceptance Criteria:**

**Given** the ConfirmationSheet is open (text creation or edit)
**When** I view the recurrence section
**Then** a "Repeat" toggle row is visible below the OffsetSelector; it is collapsed by default (hidden unless the task has a parsed recurrence)

**Given** I tap the Repeat toggle
**When** the recurrence picker expands
**Then** I can choose: Daily, Weekly (with a day-of-week multi-picker), or Monthly (with a day-of-month picker)
**And** selecting "Weekly" shows checkboxes for Mon–Sun; selecting "Monthly" shows a number input (1–31)

**Given** I select "Weekly → Monday & Thursday"
**When** I tap Save
**Then** the task is saved with `recurrence: {"type": "weekly", "days": [1, 4]}`; the API receives the correct JSON

**Given** a task has a recurrence pattern
**When** its TaskCard is rendered in the list
**Then** a RecurrenceBadge appears inline alongside the deadline: repeat icon (10px) + short label ("Mon", "Daily", "Mon & Thu"); styled `text-xs text-zinc-500`

**Given** the task edit view opens for a recurring task
**When** the ConfirmationSheet renders
**Then** the Repeat toggle is expanded and pre-populated with the existing recurrence pattern

---

## Story 5.3: Recurrence via Voice

As a user,
I want to speak a recurring task naturally and have the recurrence pattern parsed and shown on the Confirmation Sheet,
So that setting up a standing task requires no manual configuration.

**Acceptance Criteria:**

**Given** I speak "Prep for standup every Monday at 8:30am"
**When** `POST /api/v1/parse` processes the transcript
**Then** the response includes `recurrence: {"type": "weekly", "days": [1]}` alongside the parsed name and deadline
**And** the LLM prompt instructs the model to parse supported patterns: daily, weekly on named days, monthly on a specific day

**Given** the parse returns a recurrence pattern
**When** the ConfirmationSheet opens
**Then** the Repeat toggle is auto-expanded showing the parsed pattern (e.g. "Every Monday"); the user can confirm or edit it via the picker

**Given** the LLM cannot confidently parse the recurrence from the utterance
**When** the ConfirmationSheet opens
**Then** the `recurrence` field is null; the Repeat toggle is collapsed; an inline note reads "Recurrence not detected — set it manually if needed"

**Given** the parse returns a recurrence
**When** I review it on the Confirmation Sheet
**Then** I can edit the parsed recurrence using the same UI picker from Story 4.2 before saving

---

## Story 5.4: Auto-Generation of Next Instance

As a user,
I want completing a recurring task to automatically create the next occurrence with reminders already scheduled,
So that a standing task is never lost and I never have to re-enter it.

**Acceptance Criteria:**

**Given** a recurring task exists with `recurrence: {"type": "weekly", "days": [1]}` and `deadline_at: 2026-06-02T08:30:00Z` (Monday)
**When** `POST /api/v1/tasks/{id}/complete` is called
**Then** `task_service.complete_task()` creates a new task instance with: same `name`, `description`, `recurrence`, `offsets`; `deadline_at` advanced by one recurrence interval (next Monday: 2026-06-09T08:30:00Z); `series_id` set to the original task's id
**And** this logic lives exclusively in `task_service.complete_task()` — never in the router or scheduler jobs

**Given** the next instance is created
**When** `schedule_reminders(next_task)` is called
**Then** APScheduler jobs are created for the new instance using the same offsets; the new task appears in the active list immediately
**And** TanStack Query cache `["tasks"]` is invalidated so the new card is visible without a manual refresh

**Given** a monthly recurring task with `deadline_at` on the 31st
**When** the next month has fewer than 31 days
**Then** `deadline_at` is clamped to the last day of that month (e.g. Feb 28/29)

**Given** a daily recurring task
**When** it is completed
**Then** the next `deadline_at` is exactly 24 hours later (UTC)

---

## Story 5.5: End a Series

As a user,
I want to stop a recurring task series when I no longer need it,
So that future instances are not generated and no ghost reminders fire.

**Acceptance Criteria:**

**Given** a recurring task detail view is open
**When** I tap "Delete"
**Then** the confirmation dialog shows a 3-way choice: "Delete just this task, or end the whole series?" with buttons [This task only] [End series] [Cancel]
**And** [Cancel] is focused by default; Escape key dismisses the dialog

**Given** the delete dialog is open for a recurring task
**When** I tap "This task only"
**Then** `DELETE /api/v1/tasks/{id}` is called for the current instance only; `cancel_task_jobs(task_id)` removes its jobs; no further instances are affected; the series continues from the next existing instance

**Given** the delete dialog is open for a recurring task
**When** I tap "End series"
**Then** all tasks sharing the same `series_id` (including the current one) are deleted; `cancel_task_jobs` is called for each; no future instances are generated
**And** the API handles this via a dedicated `DELETE /api/v1/tasks/{id}/series` endpoint that cascades deletion

**Given** the task edit view is open for a recurring task
**When** I remove the recurrence pattern (clear the Repeat toggle) and save
**Then** the task is saved with `recurrence: null`; no future instances will be auto-generated after this one is completed; existing jobs are rescheduled normally
**And** this is treated as "end after this instance" — not a series deletion

---
