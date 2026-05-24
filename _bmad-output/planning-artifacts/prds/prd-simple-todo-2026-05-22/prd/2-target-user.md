# 2. Target User

## 2.1 Primary Persona

**The builder, acting as his own first user.** Phone-reliant, practical, and high task volume. Moves fast, hates UI friction, and does not want to manage a task system — he wants to not forget things. Currently defaults to Apple Reminders or Google Tasks when he bothers at all, but considers both too generic to bother opening consistently.

## 2.2 Jobs To Be Done

- *Functional:* Capture a task in under 15 seconds without breaking flow.
- *Functional:* Trust that a reminder will surface the task at the right moment without any follow-up action.
- *Functional:* Handle predictable recurring commitments (weekly meetings, regular calls) without re-entering them each time.
- *Emotional:* Feel confident nothing important is falling through the cracks.
- *Contextual:* Create tasks from a phone, one-handed, while doing something else.

## 2.3 Non-Users (v1)

- Anyone other than the builder. No collaboration, no sharing, no multi-user support.

## 2.4 Key User Journeys

- **UJ-1. Capture a task by voice and trust the reminder.**
  - **Persona + context:** Builder, phone in hand, something just came to mind that needs to happen Thursday.
  - **Entry state:** App open on task list (or launched from home screen). No prior auth required.
  - **Path:** (1) Taps the voice FAB. (2) Speaks: *"Call the dentist Thursday at 10am."* (3) Confirmation screen shows parsed result: name = "Call the dentist", deadline = Thursday 10:00. (4) Selects reminder offset(s) — taps "1 day" and "1 hour". (5) Taps Save.
  - **Climax:** Task appears in list. Push notifications are scheduled. Builder puts the phone down knowing it's handled.
  - **Resolution:** Two reminders scheduled. Builder receives them Wednesday at 10am and Thursday at 9am.
  - **Edge case:** LLM misparses deadline as Wednesday. Builder corrects it on the confirmation screen before saving.

- **UJ-2. Set up a recurring task.**
  - **Persona + context:** Builder wants to log every Monday standup so he doesn't forget to prep.
  - **Entry state:** App open on task list.
  - **Path:** (1) Taps voice FAB. (2) Speaks: *"Prep for standup every Monday at 8:30am."* (3) Confirmation screen shows: name = "Prep for standup", deadline = next Monday 8:30, recurrence = every Monday. (4) Selects "1 hour" reminder offset. (5) Taps Save.
  - **Climax:** Task appears. On completion, next occurrence auto-generates for the following Monday.
  - **Resolution:** Recurring series is live. Builder never has to re-enter this task.

- **UJ-3. Act on a reminder.**
  - **Persona + context:** Builder receives a push notification for "Call the dentist."
  - **Entry state:** Phone locked or on another app.
  - **Path:** (1) Notification fires: *"Reminder: Call the dentist — due in 1 hour."* (2) Builder taps notification. (3) App opens to that task's detail view.
  - **Climax:** Builder makes the call and marks the task complete in the app.
  - **Resolution:** Task marked done. If recurring, next occurrence auto-creates.

---
