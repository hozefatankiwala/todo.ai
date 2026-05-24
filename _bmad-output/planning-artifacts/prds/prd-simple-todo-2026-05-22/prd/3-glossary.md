# 3. Glossary

- **Task** — The core entity. Has exactly three fields: `name` (required), `deadline` (required, date + time), `description` (optional, free text). No other mandatory fields exist.
- **Deadline** — A required date and time attached to a Task, representing when the Task must be acted on.
- **Reminder** — A scheduled push notification tied to a Task, firing at a Offset before the Deadline. A Task may have multiple Reminders.
- **Offset** — One of five preset intervals before a Deadline at which a Reminder fires: 15 minutes, 30 minutes, 1 hour, 1 day, 2 days.
- **Recurrence** — A repeating pattern that auto-generates a new Task instance after the current one is completed. Expressed as day-specific intervals (e.g. "every Monday and Thursday") or natural-language voice input parsed by the AI.
- **Confirmation Screen** — The UI surface shown after voice capture and AI parsing, before a Task is saved. Displays all parsed fields; user can edit any field before confirming.
- **Voice FAB** — The floating action button (primary CTA) that initiates voice capture.
- **Series** — A set of Task instances sharing the same Recurrence pattern.
- **Instance** — One specific occurrence within a Series.

---
