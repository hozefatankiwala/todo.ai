# UX Consistency Patterns

## Button Hierarchy

Three levels — never more:

| Level | Style | Usage |
|---|---|---|
| Primary | `bg-violet-500 text-white rounded-xl` full-width | One per screen: Save, Mark Complete |
| Secondary | `bg-zinc-700 text-zinc-100 rounded-xl` | Competing actions: Edit, Type instead |
| Ghost / Destructive | `text-zinc-400` or `text-red-400`, no background | Cancel, Delete |

**Rules:**
- Maximum one primary button per sheet/screen
- Cancel is always text-only, never a filled button
- Destructive actions use `text-red-400` ghost — never a red filled button (too alarming, too easy to tap accidentally on mobile)
- Buttons are full-width inside sheets; icon-only in list rows

## Feedback Patterns

| Situation | Pattern | Duration |
|---|---|---|
| Task saved | `TrustBanner` (green, specific times) | 3s then fade |
| Task completed | Card shrinks/fades out of list | ~300ms animation |
| Voice parse error | Inline error card, recovery action | Persistent until acted on |
| Network error | Inline error with "Try again" + "Type instead" | Persistent |
| Delete confirmation | `Dialog` modal | User dismissed |
| Permission denied | Warning banner, non-blocking | Until next relevant action |

**Rules:**
- No floating toasts — all feedback is inline and spatial
- Success is brief and auto-dismissing; errors are persistent until resolved
- Never use browser native `alert()` dialogs
- Loading states replace the triggering element (button spinner) — no full-screen loaders

## Form Patterns

- Fields displayed as inset zinc-800 cards, not traditional inputs with labels above
- Label appears as `text-xs text-zinc-500` inside the card above the value
- Tap anywhere on the card to edit — not just the text
- Validation is silent until Save is tapped — no inline red errors during typing
- Save button disability communicates what's missing (DeadlineChip turns amber when empty) — no error text needed
- Text entry fallback: same layout, all fields start empty, keyboard opens on task name automatically

## Navigation Patterns

- **Home → Task detail:** Card tap → full-screen slide-left push transition
- **Home → Confirmation Screen:** FAB tap → sheet slides up
- **Task detail → Home:** Back arrow or swipe-right → slide-right
- **Any sheet → dismiss:** Swipe down or Cancel → sheet slides down
- **Notification → Task detail:** Direct deep-link, no intermediate screen
- **Home → Archive:** Header icon → sheet slides up (not a navigation push)

Full navigation pushes only for task detail. Everything else is a sheet or stays in place.

## Empty States

| State | Message | Action |
|---|---|---|
| Task list empty (fresh) | "Nothing yet. Tap the mic to add your first task." | VoiceFAB pulse |
| Task list empty (all done) | "All done. Nice." | None |
| Archive empty | "No completed tasks yet." | None |

Empty states are short and human. No illustrations or decorative graphics.

## Loading & Skeleton States

- **Task list:** Renders from local state instantly. If server fetch needed: 3 placeholder `animate-pulse bg-zinc-800` cards for max 500ms
- **Voice processing:** VoiceFAB processing state is the loading indicator — no overlay
- **Save:** SaveButton spinner inline for API call duration — sheet stays open until confirmed

## Destructive Action Patterns

Always require a `Dialog` confirmation:
- **Single task delete:** "Delete this task? This can't be undone." → [Cancel] [Delete]
- **Recurring series:** "Delete just this task, or end the whole series?" → [This task only] [End series] [Cancel]

Confirmation dialogs always default to the safe action (Cancel). Never pre-select the destructive option.
