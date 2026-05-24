# Core User Experience

## Defining Experience

The core loop is: **tap Voice FAB → speak task → confirm → save → put phone down**. This single flow, completed in under 15 seconds, *is* the product. All other surfaces (task list, archive, edit view) are supporting infrastructure. The voice capture loop must be treated as a first-class, signature interaction — not a feature.

The Confirmation Screen is the critical pivot point. It is where the user trusts or distrusts the AI parse. When the deadline is correct and Save is one tap away, the loop feels magical. When a correction requires more than two taps, the friction breaks the illusion and undermines trust in voice capture generally.

## Platform Strategy

- **PWA deployed to web**, installable to home screen via Safari (iOS) and Chrome (Android)
- **Mobile-first, touch-based, one-handed** — the golden path must be completable with a single thumb, without reading small text or hitting small targets
- **iOS push notification constraint:** browser push requires PWA installation via Safari — a proactive onboarding prompt must appear before the user's first Reminder-enabled save, framed as enabling the core value (not as a setup step)
- **No offline mode required** — connectivity assumed; LLM parsing and notification scheduling require it

## Effortless Interactions

- **Knowing the app is listening** — zero ambiguity after FAB tap; instant, clear listening state
- **Selecting reminder offsets** — feels like flipping a switch, not configuring a form; the 5 presets should be visually scannable and tappable in one gesture
- **Post-save handoff** — the user's responsibility ends at Save; everything after (scheduling, recurrence, notification delivery) happens invisibly and automatically
- **Recurring task continuation** — marking complete and seeing the next instance appear immediately, with no action required

## Critical Success Moments

1. **First voice capture succeeds** — Parsed result appears on the Confirmation Screen and is correct. This is the "oh, this works" moment that determines whether the user will reach for the app again.
2. **First push notification fires** — User receives a reminder for a task they captured by voice. Trust is formed: the product does exactly what it promised, without any follow-up action from the user.
3. **Recurring task auto-continues** — Marking a standing task complete and seeing next week's instance appear automatically. This is the "set it and forget it" moment that separates this app from a generic todo list.

## Experience Principles

1. **Speed is the feature.** Every tap, transition, and confirmation is optimized to minimize time between intent and saved task. Anything that adds time without adding value is a bug.
2. **The phone does the remembering.** The user's job ends at Save. Reminder scheduling, recurrence, and notification delivery happen without them — and the design should make this handoff feel complete and trustworthy.
3. **Trust must be earned on every save.** A visible, specific confirmation ("Reminders set: 1 day and 1 hour before deadline") removes post-save anxiety better than any visual polish.
4. **One hand, any context.** The golden path — FAB tap → speak → confirm → save — must be completable one-handed, without requiring precise targeting or small-text reading.
