# Requirements Inventory

## Functional Requirements

FR-1: User can tap the Voice FAB to initiate audio capture via the Web Speech API. System displays a listening indicator within 300ms of FAB tap. Capture ends on silence detection or manual stop (within 1 second of silence).

FR-2: System sends the voice transcript to an LLM and receives a structured parse: name, deadline (date + time), description (if mentioned), recurrence (if mentioned). Parsed result appears on the Confirmation Screen within 3 seconds of capture completing (P90). If no deadline, field is blank and required. Relative dates resolved against device current date/time.

FR-3: System displays all parsed fields on the Confirmation Screen before saving. User can edit any field inline. Recurrence field shown if parsed; hidden otherwise (user can expose manually). Save button disabled until name and deadline both populated. Cancelling returns user to task list with nothing saved.

FR-4: On the Confirmation Screen, user selects one or more Offsets (15 min, 30 min, 1 hr, 1 day, 2 days) for this Task. Multi-select. Defaults to no Offsets pre-selected. Past Offsets trigger a warning but do not block saving. Zero Offsets is valid.

FR-5: User can create a Task by typing instead of speaking. Tapping "Type instead" opens a manual form with the same fields as the Confirmation Screen. Text entry does not use AI parsing — all fields filled manually.

FR-6: User can view all active (incomplete) Tasks sorted by Deadline ascending. Each row shows Task name and Deadline. Overdue Tasks appear at the top with a visual indicator. List renders within 500ms of app open.

FR-7: User can mark a Task complete. Completed Tasks move to an archive view, not deleted. All scheduled Reminders for the Task are cancelled on completion. If the Task is part of a Series, next Instance is auto-created.

FR-8: User can edit any field of an existing Task from the task detail view. Saving edits reschedules any Reminders based on the updated Deadline and current Offsets. Recurrence pattern can be changed or removed.

FR-9: User can permanently delete a Task. For a Series Instance, user is prompted: delete this Instance only, or end the Series (delete this and all future Instances). All scheduled Reminders for deleted Task(s) are cancelled. Deleted Tasks are not recoverable.

FR-10: User can specify Recurrence in the voice utterance. LLM parses natural-language recurrence patterns (daily, weekly on named days, monthly on specific day). Parsed Recurrence shown on Confirmation Screen. If LLM cannot confidently parse Recurrence, the field is blank with an inline note.

FR-11: User can set or edit Recurrence manually on the Confirmation Screen or task edit view, using a picker covering: daily, weekly (day picker), monthly (day-of-month picker). UI picker produces the same structured representation as voice parsing.

FR-12: On Task completion, if the Task belongs to a Series, system creates the next Instance. Next Deadline = current Deadline + recurrence interval. Name, description, Recurrence, and Offsets are copied from the completed Instance. Reminders for the next Instance are scheduled automatically.

FR-13: User can end a Series when deleting or from the task edit view. Options: end after this Instance (complete but create no further Instances), or delete this and all future Instances.

FR-14: On first Task creation with at least one Offset selected, system requests browser push notification permission. If permission is denied, system warns that Reminders will not fire and allows Task to be saved. Permission state is persisted; prompt is not re-shown.

FR-15: On Task save or edit, system schedules a push notification for each selected Offset. Scheduling is performed server-side so notifications fire even when the browser tab is closed. Notifications fire within ±60 seconds of scheduled time. Rescheduling on edit cancels prior notifications for that Task.

FR-16: Push notification displays: Task name, time-to-deadline (e.g. "due in 1 hour"), and app name. Format: `{Task name} — due {relative time}`.

FR-17: Tapping the notification opens the app and navigates directly to that Task's detail view. If app is closed, it launches and routes to the Task detail. If app is open on a different screen, it navigates to the Task detail.

FR-18: Task list is the default landing surface. Shows active Tasks sorted by Deadline. Voice FAB prominently placed (bottom-right). Access to archive available.

FR-19: Confirmation Screen is shown after voice capture + parse. Not a persistent route — navigating away discards the draft.

FR-20: Task detail / edit view is shown when tapping a Task in the list or arriving via notification deep-link. Displays all fields; edit mode toggled from this view. Completion and deletion actions available here.

FR-21: Archive view shows completed Tasks in reverse-completion order. No active Reminders shown. Tasks can be permanently deleted from archive.

## NonFunctional Requirements

NFR-1: Listening indicator visible within 300ms of Voice FAB tap.

NFR-2: LLM parse result appears on the Confirmation Screen within 3 seconds of capture completing (P90 target).

NFR-3: Task list renders within 500ms of app open.

NFR-4: Push notifications fire within ±60 seconds of scheduled time, 99%+ of the time.

NFR-5: WCAG 2.1 AA accessibility compliance (contrast, touch targets, keyboard navigation, screen reader support).

NFR-6: PWA deployed mobile-first; iOS push requires PWA installation via Safari before first Reminder-enabled save.

NFR-7: No offline mode required; connectivity assumed for LLM parsing and notification scheduling.

NFR-8: Deployed as PWA on Railway with persistent SQLite volume; access controlled via HTTP Basic Auth at Caddy reverse proxy.

## Additional Requirements

- AR-1: Project must be initialized using the monorepo starter template: Vite + React-TS + shadcn/ui v4 (frontend) · FastAPI + uv (backend). First implementation story must be project initialization with the defined init sequence.
- AR-2: Database: SQLite via SQLAlchemy 2.0 async (aiosqlite). Alembic for schema migrations. Persistent volume on Railway at /data/simple-todo.db. `alembic upgrade head` must run before FastAPI starts.
- AR-3: Scheduler: APScheduler with SQLAlchemy job store (same SQLite DB). Job ID convention: `reminder_{task_id}_{offset_minutes}`. Jobs survive server restarts.
- AR-4: LLM provider abstracted behind llm_service.py with LLM_PROVIDER env var. First story to select concrete provider (recommendation: Claude/Anthropic).
- AR-5: VAPID keys generated once at project init, stored in .env (not committed). Push subscription via pywebpush.
- AR-6: All API routes under /api/v1/ prefix. Error responses: `{"detail": "...", "code": "..."}`. HTTP status codes as per spec (200/201/204/400/404/422).
- AR-7: Frontend routing: React Router v7. Server state: TanStack Query v5. UI state: Zustand. All HTTP via single src/lib/api.ts axios instance — no raw fetch() in components.
- AR-8: Notification lifecycle is mandatory on every task mutation: Create → schedule_reminders; Edit → cancel_task_jobs then schedule_reminders; Complete → cancel_task_jobs + recurrence; Delete → cancel_task_jobs.
- AR-9: All datetimes stored and transmitted as UTC ISO 8601. Frontend converts to local time for display only. Field name: deadline_at in API payload and DB column.
- AR-10: CORS driven by ALLOWED_ORIGINS env var. No application-level auth. HTTP Basic Auth via Caddy. Deployment on Railway with Caddy as reverse proxy.
- AR-11: Reminder offsets stored as integer minutes (15, 30, 60, 1440, 2880). Frontend maps to display labels.
- AR-12: Business logic in services/ only. Routers handle HTTP in/out only. Scheduler jobs only call push_service — no DB mutations from jobs.

## UX Design Requirements

UX-DR1: VoiceFAB component with 4 distinct states — resting (violet-500 circle, mic icon), listening (double pulse ring animation + waveform indicator + "Listening…" label), processing (spinner + "Thinking…" label), error (brief red flash → returns to resting). Specs: h-14 w-14 (56px), rounded-full, fixed bottom-6 right-6, z-50. aria-label="Add task by voice", role="button", aria-live="polite" for state changes.

UX-DR2: TaskCard component with 4 states — default (bg-zinc-800 rounded-2xl), overdue (border-l-4 border-amber-500), new (ring-1 ring-violet-500/40 fades to default after 2s), completing (strikethrough animation + card shrinks and fades out). Anatomy: card wrapper → left accent bar (overdue only) → task name → deadline + recurrence badge → completion circle button.

UX-DR3: ConfirmationSheet component wrapping shadcn Sheet. Anatomy: handle bar → NameField card → DeadlineChip card → OffsetSelector → RepeatToggle row → SaveButton → Cancel link. States: reviewing, editing-deadline (date picker open), saving (button loading). bg-zinc-700 sheet with bg-zinc-800 inset field cards.

UX-DR4: DeadlineChip component with 3 states — filled (formatted chip: "Thu, Jun 5 · 10:00 AM"), empty (amber border + "Tap to set deadline" placeholder), open (picker active). Tap behavior opens date/time picker.

UX-DR5: OffsetSelector component — row of 5 pill chips (15m, 30m, 1h, 1d, 2d); tap to toggle; selected = bg-violet-500 text-white; unselected = bg-zinc-700 text-zinc-400; role="group" aria-label="Reminder offsets"; each chip role="checkbox" with aria-checked. Touch target minimum h-9 with horizontal padding.

UX-DR6: TrustBanner component — bg-green-950 border border-green-900 rounded-xl; checkmark icon; "Saved · Reminders: {time1}, {time2}" or "Saved · No reminders set"; appears below header on save, persists 3 seconds then fades out; aria-live="polite"; never stacks.

UX-DR7: RecurrenceBadge component — repeat icon (10px) + short label ("Mon", "Daily", "Mon & Thu"); text-xs text-zinc-500 inline alongside deadline text on TaskCard.

UX-DR8: PWAInstallPrompt component — timed to first Reminder-enabled save; framed as "Enable reminders" (not "setup"); non-blocking if dismissed; appears before push permission request.

UX-DR9: Design token system — zinc neutrals for all surfaces/text, violet-500/600 for interactive elements, amber-500 for overdue, green-500 for success, red-500 for destructive. CSS custom properties: --surface-base, --surface-elevated, --text-primary, --text-muted, --accent, --accent-hover, --overdue.

UX-DR10: Class-based dark mode; default to system preference on first load; no manual toggle in v1. Dark mode is the primary design target; light mode meets WCAG AA.

UX-DR11: Typography system: system font stack (no external font load). 7-level type scale: task name list (text-base font-medium), task name detail (text-xl font-semibold), deadline/metadata (text-sm), section headers (text-xs uppercase tracking-wider), body (text-sm), confirmation input (text-lg font-medium), buttons/chips (text-sm font-medium).

UX-DR12: Three-level button hierarchy: Primary (bg-violet-500 text-white rounded-xl full-width, one per screen), Secondary (bg-zinc-700 text-zinc-100 rounded-xl), Ghost/Destructive (text-zinc-400 or text-red-400, no background). Cancel is always text-only.

UX-DR13: Navigation patterns — task detail: full-screen slide-left push; confirmation screen + archive: sheet slide-up from bottom; sheets dismiss via swipe-down or Cancel; notification deep-link → task detail, bypassing task list; Escape key dismisses sheets on desktop.

UX-DR14: Responsive design — max-w-lg mx-auto on root layout container; mobile-first full-bleed (base); md: centered with card shadow; lg: sheet→centered dialog, keyboard shortcut V triggers VoiceFAB, mouse hover states on task cards. Safe area insets: pb-[env(safe-area-inset-bottom)].

UX-DR15: Accessibility — focus-visible:ring-2 ring-violet-500 ring-offset-2 ring-offset-zinc-900 on all interactive elements; aria-disabled (not HTML disabled) on Save button; time datetime attribute for all deadline displays; focus trap inside sheets and dialogs; role="list" on task list; full keyboard navigation (Enter/Space on cards, Escape to dismiss).

UX-DR16: Empty states — 3 defined: task list fresh ("Nothing yet. Tap the mic to add your first task."), all done ("All done. Nice."), archive empty ("No completed tasks yet."). Short, human, no illustrations.

UX-DR17: Swipe gesture support on TaskCard — left swipe reveals complete action (green); right swipe reveals delete action (red). One-handed gesture.

UX-DR18: Loading states — task list: 3 animate-pulse bg-zinc-800 placeholder cards for max 500ms; VoiceFAB processing state is sole voice overlay; SaveButton inline spinner during API call — sheet stays open until confirmed.

UX-DR19: Destructive action confirmation dialogs — single task delete: "Delete this task? This can't be undone." [Cancel] [Delete]; series delete: 3-way choice "Delete just this task, or end the whole series?" [This task only] [End series] [Cancel]. Dialogs default to safe action (Cancel).

## FR Coverage Map

FR-1: Epic 3 — Voice capture via Web Speech API
FR-2: Epic 3 — LLM transcript parsing → structured task fields
FR-3: Epic 1 (base text form) → Epic 2 (+ offset selection) → Epic 3 (+ voice prefill) → Epic 4 (+ recurrence section)
FR-4: Epic 2 — Reminder offset selection (5 presets, multi-select)
FR-5: Epic 1 — Text fallback task creation form
FR-6: Epic 1 — Task list view sorted by deadline
FR-7: Epic 1 — Task completion → archive
FR-8: Epic 1 — Task edit with reminder reschedule
FR-9: Epic 1 — Task deletion (single + series prompt)
FR-10: Epic 4 — Recurrence specification via voice
FR-11: Epic 4 — Recurrence specification via UI picker
FR-12: Epic 4 — Auto-generation of next series instance
FR-13: Epic 4 — End a series (after this / delete all future)
FR-14: Epic 2 (push permission flow) / Epic 5 (iOS PWA install prompt)
FR-15: Epic 2 — Server-side reminder scheduling via APScheduler
FR-16: Epic 2 — Notification content format
FR-17: Epic 2 — Notification tap deep-link to task detail
FR-18: Epic 1 — Task list home screen with Voice FAB placeholder
FR-19: Epic 1 (base, not persistent route) → enhanced each epic
FR-20: Epic 1 — Task detail / edit view (deep-link target)
FR-21: Epic 1 — Archive view (reverse-completion order, permanent delete)
