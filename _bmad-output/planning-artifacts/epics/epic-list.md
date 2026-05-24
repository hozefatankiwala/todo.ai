# Epic List

## Epic 1: Task Management Foundation
User can create tasks via a text form (name + deadline + description), view them sorted by deadline, edit, mark complete (→ archive), delete, and browse the archive. The app runs end-to-end with solid CRUD — no reminders yet.
**FRs covered:** FR-5, FR-6, FR-7, FR-8, FR-9, FR-18, FR-19, FR-20, FR-21

## Epic 2: Push Notifications & Reminders
User can select reminder offsets when creating or editing a task, grant push notification permission, receive notifications on their phone within ±60 seconds of the scheduled time, and tap a notification to land directly on the task detail. The "trust it's handled" core value is real.
**FRs covered:** FR-4, FR-3 (offset addition), FR-14, FR-15, FR-16, FR-17

## Epic 3: Voice Capture & AI Parsing
User can tap the Voice FAB, speak naturally, and see the task pre-filled on the Confirmation Screen from the AI parse. Voice is the primary creation path; text fallback remains available.
**FRs covered:** FR-1, FR-2, FR-3 (voice prefill enhancement)

## Epic 4: Recurring Tasks
User can set a task to repeat via voice or UI picker; completing an instance auto-generates the next one with the same offsets and reminders already scheduled — no action required.
**FRs covered:** FR-10, FR-11, FR-12, FR-13, FR-3 (recurrence section addition)

## Epic 5: PWA & Production Deployment
The app is installable to the home screen on iOS/Android, push notifications work on iOS Safari via PWA, and the app is publicly deployed on Railway with automatic HTTPS via Caddy and HTTP Basic Auth access control.
**FRs covered:** FR-14 (iOS PWA install flow), NFR-6, NFR-8

---
