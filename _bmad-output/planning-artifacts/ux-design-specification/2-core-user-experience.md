# 2. Core User Experience

## 2.1 Defining Experience

> **"Speak a task. Trust it's handled."**

The defining interaction: tap the Voice FAB → speak naturally → see the parsed result → confirm and save in one tap. Under 15 seconds. No typing, no fields, no decisions beyond which reminder offsets to select.

This is the interaction users will describe: *"I just talk to it and it reminds me."* Everything else in the app — the task list, archive, edit view — exists only to support this loop or recover from it.

## 2.2 User Mental Model

The user's mental model coming in is Apple Reminders / Google Tasks — functional but with too much friction. They expect a form with fields to fill in, manual date/time pickers, and a separate reminders section to configure.

What simple-todo does differently: the AI collapses that entire sequence into a spoken sentence. The Confirmation Screen is not a form — it's a *verification*. The user's mental frame should shift from "I'm filling this out" to "I'm confirming what was understood."

The primary trust barrier is skepticism about the AI parse on first use ("did it get the date right?"). The Confirmation Screen must be instantly scannable — parsed deadline as a formatted, prominent chip — to resolve this skepticism in under 2 seconds.

## 2.3 Success Criteria

The core interaction succeeds when:
- Parsed name + deadline appear without needing correction (target: >80% of captures per PRD SM-4)
- The user taps Save without opening any picker or typing anything
- Post-save state communicates exactly what reminders were scheduled, with specific times
- Full flow — FAB tap to saved task — completes in under 15 seconds (PRD SM-1)

Gracefully handled failure states:
- LLM returns wrong or missing deadline → deadline field highlighted, editable, Save blocked until filled
- Voice capture fails (no speech detected) → clear retry affordance with "try again" state
- Network error during parse → inline error with option to switch to manual text entry

## 2.4 Novel vs. Established Patterns

The core loop combines familiar patterns in a novel order — voice input (established), confirmation before save (established), reminder offset selection (established) — but inverts the standard creation flow: the user never sees a blank form. They see a pre-filled verification. This removes the "what do I fill in?" cognitive load entirely.

No user education needed for voice capture itself; the FAB is a universally understood record affordance. The main onboarding moment is the first Confirmation Screen — users must immediately understand they can edit any field before saving.

## 2.5 Experience Mechanics

**1. Initiation**
- User taps the Voice FAB (bottom-right, violet, large tap target ≥ 56px)
- Microphone permission requested on first use with contextual explanation
- FAB transforms to listening state: pulse ring animation, waveform indicator, "Listening…" label

**2. Interaction**
- User speaks naturally: *"Call the dentist Thursday at 10am"*
- On silence or manual stop tap: FAB transitions to processing state (spinner, "Thinking…")
- LLM parse result returned within 3 seconds (P90)
- Confirmation Screen slides up as a modal sheet

**3. Feedback on Confirmation Screen**
- Task name: large editable text field, pre-filled with parsed value
- Deadline: prominent formatted chip ("Thu, Jun 5 · 10:00 AM") — tap to open date/time picker
- Reminder offsets: row of 5 pill chips (15m, 30m, 1h, 1d, 2d) — tap to toggle; violet fill = selected
- Recurrence: collapsed by default; "Repeat" toggle reveals picker
- Save button: disabled until name + deadline populated; violet, full-width, bottom of sheet

**4. Completion**
- On Save: sheet dismisses with smooth slide-down
- Task appears at correct position in list (sorted by deadline) with subtle fade-in
- Post-save banner beneath header: *"Saved · Reminders: Thu 9am, Wed 10am"* — fades out after 3 seconds
- FAB returns to resting state, ready for next capture
