# 6. MVP Scope

## 6.1 In Scope

- Voice capture → LLM parse → Confirmation Screen → save (FR-1 through FR-5)
- Full CRUD on Tasks (FR-6 through FR-9)
- Recurring Tasks with auto-generation (FR-10 through FR-13)
- Push notifications with preset Offsets, server-side scheduling (FR-14 through FR-17)
- Four-surface IA: task list, confirmation screen, task detail/edit, archive (FR-18 through FR-21)
- Deployed web app on a public server, accessible from any network
- `[ASSUMPTION]` Deployed as a PWA (installable to home screen) to enable push notifications on iOS Safari — iOS requires PWA installation via Safari for browser push to function; onboarding flow should prompt installation before the first Reminder-enabled Task is created

> **Access control note:** No application-level authentication. Because the app is publicly deployed, deployment-level access control is required — HTTP Basic Auth at the reverse proxy is the recommended approach. Options are captured in `addendum.md`. `[NOTE FOR PM: confirm access control approach before architecture kick-off.]`

## 6.2 Out of Scope for MVP

- Snooze on notification (v2 candidate — see Non-Goals)
- Calendar sync — deferred indefinitely; not aligned with the product's anti-organization philosophy
- Collaboration features — out of scope by design
- Native mobile app (iOS/Android) — web PWA covers the use case; revisit if PWA push limitations on iOS become blocking
- Siri / Google Assistant integration — interesting but not needed for v1

---
