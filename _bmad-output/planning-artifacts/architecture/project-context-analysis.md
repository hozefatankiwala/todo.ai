# Project Context Analysis

## Requirements Overview

**Functional Requirements:**
21 FRs across 5 feature groups:
- Voice Task Creation (FR-1–5): Web Speech API capture → LLM parse → Confirmation Screen → save
- Task Management (FR-6–9): Full CRUD, archive on complete (not hard-delete)
- Recurring Tasks (FR-10–13): Series/Instance model, auto-generation of next Instance on completion
- Push Notifications & Reminders (FR-14–17): Server-side scheduling, 5 preset offsets, deep-link on tap
- Information Architecture (FR-18–21): 4 surfaces — task list, confirmation screen, detail/edit, archive

**Non-Functional Requirements:**
- Voice listening indicator: < 300ms after FAB tap
- LLM parse result on Confirmation Screen: P90 < 3 seconds
- Task list render: < 500ms on app open
- Push notifications: fire within ±60 seconds of scheduled time (target 99%+)
- Accessibility: WCAG 2.1 AA
- Platform: PWA, mobile-first; iOS push requires Safari PWA installation
- No offline mode required

**Scale & Complexity:**
- Primary domain: Full-stack web (mobile-first PWA)
- Complexity level: Low-to-medium
  - Core data model is simple (Task: name, deadline, description, recurrence, offsets)
  - Two non-trivial integrations: LLM API (on every creation) and Web Push (server-side, persistent)
  - Single user eliminates auth, multi-tenancy, and collaboration complexity
- Estimated architectural components: ~5 (frontend PWA, backend API, LLM integration, push scheduler, reverse proxy)

## Technical Constraints & Dependencies

- **iOS Push:** Browser push requires PWA installation via Safari 16.4+ on iOS 16.4+. Onboarding must prompt installation before first Reminder-enabled save.
- **Server-side scheduling required:** Notifications must fire when browser is closed. In-process (APScheduler) or out-of-process (Celery+Redis) — decision pending.
- **LLM provider:** Claude, GPT-4o, or Gemini — all viable at single-user volume. Selection pending.
- **Deployment platform:** Railway, Fly.io, Render, or VPS — affects scheduler persistence model and ops complexity.
- **Access control:** HTTP Basic Auth at reverse proxy (nginx/caddy). Zero app-code changes; recommended approach from addendum.
- **No authentication at application layer:** Single user; access control is infrastructure-level.

## Cross-Cutting Concerns Identified

1. **Push notification lifecycle** — notifications must be created on task save, rescheduled on any field edit, and cancelled on complete or delete (including series cancellation). Touches every task mutation.
2. **Recurring series state machine** — Instance completion triggers next-Instance creation with same name/description/recurrence/offsets and advanced deadline. Series termination cancels scheduling for all future Instances.
3. **LLM error handling** — network errors during parse must surface a usable recovery path (retry or text fallback); never a dead end.
4. **PWA service worker lifecycle** — push subscription registration, renewal, and VAPID key management span frontend and backend.
5. **Task state transitions** — active → archived (on complete) → permanently deleted (from archive). Archive is non-default; scheduled reminders cancel on completion.
