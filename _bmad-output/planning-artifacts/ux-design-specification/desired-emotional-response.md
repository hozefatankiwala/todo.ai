# Desired Emotional Response

## Primary Emotional Goals

The north star emotional goal is stated directly in the PRD: **"feel confident nothing important is falling through the cracks."** This is not excitement or delight — it is calm, reliable trust. The product succeeds emotionally when the user can put the phone down after saving a task and genuinely not think about it again until the notification arrives.

## Emotional Journey Mapping

| Moment | Desired feeling |
|---|---|
| FAB tap → speaking | Effortless, uninterrupted — no friction, no mode-switching |
| Confirmation Screen loads | Impressed, quietly delighted — "it understood me" |
| Selecting offsets + tapping Save | In control, decisive — quick choice, done |
| Post-save | Calm relief — "it's handled, I can move on" |
| Notification arrives | Gratitude, trust confirmed — "it remembered, I didn't have to" |
| Recurring task reappears automatically | Quietly satisfied — the system works without me |
| Misparse or correction needed | Mildly inconvenienced, not anxious — easy to fix, not catastrophic |

## Micro-Emotions

- **Trust over skepticism** — the app must earn "I don't need to double-check this" status quickly, ideally within the first two uses
- **Calm over anxiety** — the user is already moving fast; the app should reduce cognitive load, not add to it
- **Confidence over confusion** — every screen state must be unambiguous; no wondering what the app is doing
- **Quiet satisfaction over delight** — this is not a gamified app; "nice and invisible" beats "exciting and noticeable"

## Design Implications

- **Trust** → Explicit, specific post-save confirmation naming the actual reminder times ("Reminders set: Wednesday 10am, Thursday 9am") — not a generic checkmark
- **Calm** → Minimal visual noise; the task list must feel fully scannable in 2 seconds, not overwhelming
- **Confidence** → Listening, processing, and error states must be unmistakably distinct with clear, large affordances
- **Quiet satisfaction** → Subtle micro-animations on save and task completion — present but never attention-grabbing
- **No guilt** → Overdue tasks surfaced at top with a neutral visual treatment (muted amber, not alarm red)

## Emotional Design Principles

1. **Invisible reliability beats visible delight.** The best emotional outcome is that the user forgets they have a task manager because it just works. Design for forgettable excellence.
2. **Doubt is a product failure.** Any moment where the user wonders "did that save?" or "will the reminder actually fire?" is a design defect. Eliminate uncertainty with explicit system feedback.
3. **Correction without shame.** Misparsed tasks and overdue items are normal; the design must treat them as neutral states to resolve, never as failures to highlight.
