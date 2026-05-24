# Executive Summary

## Project Vision

Simple Todo is a voice-first personal task manager whose entire design philosophy is **recall over organization**. Every design decision subordinates organizational overhead to the single goal: capture a task in under 15 seconds and trust that the right notification will surface it at the right moment. The differentiator is not feature count — it is ruthless elimination of friction at every step between "task in head" and "scheduled reminder."

## Target Users

**One persona: the builder himself.** Phone-reliant, practical, high task volume, low tolerance for UI friction. Captures tasks one-handed while doing other things. Currently defaults to Apple Reminders or Google Tasks but finds them too generic to open consistently. Core emotional job: *feel confident nothing important is falling through the cracks.* No secondary users in v1 — single-user, no accounts, no sharing.

## Key Design Challenges

1. **Voice state legibility** — Listening, processing, and error states during voice capture must be unmistakably clear on a moving phone, one-handed. Ambiguity in these states breaks the core flow.
2. **Confirmation screen balance** — Must be fast enough to not feel like friction, yet editable enough to catch ~20% of misparsed deadlines. The tension between speed and correctability is the central UX design problem.
3. **PWA + push permission onboarding** — iOS requires PWA installation via Safari before push notifications work. This non-obvious constraint needs a smooth, trust-building onboarding moment; otherwise users silently get an app with no reminders.
4. **Overdue task treatment** — Visual distinction is required by the PRD, but the design tone matters: guilt-inducing treatments risk making users avoid the app.

## Design Opportunities

1. **Voice capture as a signature moment** — The FAB + listening animation is the one interaction users will repeat dozens of times. Nailing it creates a "this just works" feeling that builds habitual use.
2. **Reminder offset selection as a fast ritual** — The 5 preset offsets are a feature, but their visual design can make selection feel instant and satisfying rather than another form field.
3. **Trust signaling** — Small post-save confirmations ("2 reminders scheduled") that explicitly tell the user they can put the phone down and trust the system.
