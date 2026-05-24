# 4. Features

## 4.1 Voice Task Creation

**Description:** The primary creation path. User taps the Voice FAB, speaks naturally, and the system returns a parsed Task on the Confirmation Screen. The AI extracts Task name, Deadline, optional description, and optional Recurrence from the utterance. User reviews, edits if needed, selects Offsets, and saves. A text fallback exists for when voice is unavailable or inconvenient. Realizes UJ-1, UJ-2.

**Functional Requirements:**

### FR-1: Voice capture
User can tap the Voice FAB to initiate audio capture via the Web Speech API. System displays a listening indicator while capturing. Capture ends on silence detection or manual stop.

**Consequences:**
- Listening indicator is visible within 300ms of FAB tap.
- Capture stops and transcript is sent for parsing within 1 second of silence detection.

### FR-2: AI parsing
System sends the voice transcript to an LLM and receives a structured parse: `name`, `deadline` (date + time), `description` (if mentioned), `recurrence` (if mentioned).

**Consequences:**
- Parsed result appears on the Confirmation Screen within 3 seconds of capture completing (P90).
- If LLM returns no deadline, the Deadline field on the Confirmation Screen is blank and required before saving.
- `[ASSUMPTION]` Relative date expressions ("Thursday", "next week", "in 2 hours") are resolved against the device's current date/time at parse time.

### FR-3: Confirmation Screen
System displays all parsed fields on the Confirmation Screen before saving. User can edit any field inline. Recurrence field is shown if parsed; hidden otherwise (user can expose it manually). Realizes UJ-1.

**Consequences:**
- All parsed fields are editable on this screen.
- Save button is disabled until `name` and `deadline` are both populated.
- Cancelling returns user to task list with nothing saved.

### FR-4: Reminder offset selection
On the Confirmation Screen, user selects one or more Offsets for this Task. Multi-select. Defaults to no Offsets pre-selected. `[ASSUMPTION]` If a selected Offset falls in the past relative to the current time, system warns but does not block saving.

**Consequences:**
- All five Offsets (15 min, 30 min, 1 hr, 1 day, 2 days) are always visible.
- Multiple Offsets can be selected simultaneously.
- At least one Offset must be selected to schedule any Reminder; zero Offsets is valid (task with no reminder).

### FR-5: Text fallback
User can create a Task by typing instead of speaking. Tapping a "Type instead" option on the creation surface opens a manual form with the same fields as the Confirmation Screen. `[ASSUMPTION: Text entry does not use AI parsing — all fields are filled manually by the user. If AI-assisted text entry is wanted, treat as a v2 enhancement.]`

**Consequences:**
- All fields available in voice creation are available in text creation.
- Manual form uses the same Offset selection as the Confirmation Screen.

---

## 4.2 Task Management

**Description:** Full CRUD on Tasks. The primary surface is a task list sorted by Deadline (soonest first). Completed Tasks are archived rather than deleted. Realizes UJ-3.

**Functional Requirements:**

### FR-6: Task list view
User can view all active (incomplete) Tasks sorted by Deadline ascending. Each row shows Task name and Deadline. Overdue Tasks (Deadline in the past) are visually distinguished.

**Consequences:**
- List renders within 500ms of app open.
- Overdue Tasks appear at the top of the list with a visual indicator.

### FR-7: Task completion
User can mark a Task complete. `[ASSUMPTION]` Completed Tasks move to an archive view, not deleted — accessible but not shown by default on the main list.

**Consequences:**
- Marking complete removes Task from the active list immediately.
- All scheduled Reminders for the Task are cancelled on completion.
- If the Task is part of a Series, next Instance is auto-created (see FR-13).

### FR-8: Task edit
User can edit any field of an existing Task from the task detail view. Realizes the correction case from UJ-1 Edge case.

**Consequences:**
- Saving edits reschedules any Reminders based on the updated Deadline and current Offsets.
- Recurrence pattern can be changed or removed from edit view.

### FR-9: Task deletion
User can permanently delete a Task. For a Series Instance, user is prompted: delete this Instance only, or end the Series (delete this and all future Instances).

**Consequences:**
- Deleted Tasks are not recoverable.
- All scheduled Reminders for deleted Task(s) are cancelled.

---

## 4.3 Recurring Tasks

**Description:** Tasks can have a Recurrence pattern. On completion of an Instance, the system auto-creates the next Instance in the Series with the same name, description, Recurrence, and Offsets, with the Deadline advanced by one recurrence interval. Realizes UJ-2.

**Functional Requirements:**

### FR-10: Recurrence specification via voice
User can specify Recurrence in the voice utterance. LLM parses natural-language recurrence patterns into structured form. Supported patterns: daily, weekly on one or more named days (e.g. "every Monday and Thursday"), monthly on a specific day of the month.

**Consequences:**
- Parsed Recurrence is shown on the Confirmation Screen for review before save.
- If the LLM cannot confidently parse the Recurrence, the field is blank on the Confirmation Screen with an inline note.

### FR-11: Recurrence specification via UI
User can set or edit Recurrence manually on the Confirmation Screen or task edit view, using a picker covering: daily, weekly (day picker), monthly (day-of-month picker).

**Consequences:**
- UI picker produces the same structured representation as voice parsing.

### FR-12: Auto-generation of next Instance
On Task completion, if the Task belongs to a Series, system creates the next Instance. Next Deadline = current Deadline + recurrence interval. Name, description, Recurrence, and Offsets are copied from the completed Instance.

**Consequences:**
- Next Instance appears in the active task list immediately after completion.
- Reminders for the next Instance are scheduled automatically.

### FR-13: End a Series
User can end a Series when deleting or from the task edit view. Options: end after this Instance (complete it but create no further Instances), or delete this and all future Instances.

**Consequences:**
- Choosing "end after this Instance" marks current Instance complete and cancels Series.
- Choosing "delete this and all future" deletes current Instance and cancels Series.

---

## 4.4 Push Notifications & Reminders

**Description:** The core value-delivery mechanism. Reminders are push notifications fired by the backend scheduler at the scheduled time. They fire reliably, carry the Task name and time-to-deadline, and deep-link to the Task on tap. Realizes UJ-3.

**Functional Requirements:**

### FR-14: Notification permission
On first Task creation with at least one Offset selected, system requests browser push notification permission. `[ASSUMPTION]` If permission is denied, system warns that Reminders will not fire and allows Task to be saved without them.

**Consequences:**
- Permission prompt fires exactly once (on first Reminder-enabled save, not on app open).
- Permission state is persisted; prompt is not re-shown if already granted or denied.

### FR-15: Reminder scheduling
On Task save or edit, system schedules a push notification for each selected Offset. Scheduling is performed server-side (backend scheduler) so notifications fire even when the browser tab is closed.

**Consequences:**
- Notifications fire within ±60 seconds of the scheduled time.
- Rescheduling on edit cancels prior notifications for that Task before creating new ones.

### FR-16: Notification content
Push notification displays: Task name, time-to-deadline (e.g. "due in 1 hour"), and app name.

**Consequences:**
- Notification body matches the format: `{Task name} — due {relative time}`.

### FR-17: Notification tap deep-link
Tapping the notification opens the app and navigates directly to that Task's detail view. Realizes UJ-3.

**Consequences:**
- If the app is closed, it launches and routes to the Task detail.
- If the app is open on a different screen, it navigates to the Task detail.

---

## 4.5 Information Architecture

**Description:** The app has four surfaces. Navigation is minimal — no sidebar, no tabs beyond archive access.

**Functional Requirements:**

### FR-18: Task list (home screen)
Default landing surface. Shows active Tasks sorted by Deadline. Voice FAB prominently placed (bottom-right). Access to archive available (e.g. via header icon).

### FR-19: Confirmation Screen
Shown after voice capture + parse. Not a persistent route — navigating away discards the draft.

### FR-20: Task detail / edit view
Shown when tapping a Task in the list or arriving via notification deep-link. Displays all fields; edit mode toggled from this view. Completion and deletion actions available here.

### FR-21: Archive view
Shows completed Tasks in reverse-completion order. No active Reminders shown here. Tasks can be permanently deleted from archive.

---
