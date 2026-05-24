# Component Strategy

## Design System Components (shadcn/ui — use directly)

| Component | Usage in app |
|---|---|
| `Sheet` | Confirmation Screen slide-up modal |
| `Dialog` | Delete task / end series confirmation |
| `Button` | Save, Cancel, Mark Complete, Delete |
| `Input` | Task name field on Confirmation Screen and edit view |
| `Textarea` | Optional description field |
| `Switch` | Repeat (recurrence) toggle on Confirmation Screen |

## Custom Components

### VoiceFAB

**Purpose:** Primary CTA that initiates voice capture; visually anchors the home screen.

**States:**
- `resting` — violet-500 circle, mic icon, `shadow-violet-500/40`
- `listening` — double pulse ring animation, waveform indicator, "Listening…" label
- `processing` — spinner replaces mic icon, "Thinking…" label, no pulse ring
- `error` — brief red flash, returns to resting

**Specs:** `h-14 w-14` (56px), `rounded-full`, fixed `bottom-6 right-6`, `z-50`.

**Accessibility:** `aria-label="Add task by voice"`, `role="button"`, state changes announced via `aria-live="polite"`.

### TaskCard

**Purpose:** Primary list item — the repeating unit of the task list.

**Anatomy:** Card wrapper → [left accent bar (overdue only)] → [task name] → [deadline + recurrence badge] → [completion circle]

**States:**
- `default` — `bg-zinc-800 rounded-2xl`
- `overdue` — `border-l-4 border-amber-500`
- `new` — `ring-1 ring-violet-500/40`, fades to default after 2s
- `completing` — strikethrough animation, card shrinks and fades out

**Swipe:** Left swipe reveals complete (green); right swipe reveals delete (red).

**Accessibility:** `role="listitem"`. Completion circle is a `<button>` with `aria-label="Mark complete: {task name}"`.

### ConfirmationSheet

**Purpose:** Wraps shadcn `Sheet` with the specific field layout for voice parse review.

**Anatomy:** Sheet → handle bar → [NameField card] → [DeadlineChip card] → [OffsetSelector] → [RepeatToggle row] → [SaveButton] → [Cancel link]

**States:** `reviewing`, `editing-deadline` (date picker open), `saving` (button loading)

**Save button:** Disabled until both name and deadline populated.

### DeadlineChip

**Purpose:** Displays parsed deadline as a tappable formatted string inside the Confirmation Sheet.

**States:** `filled`, `empty` (amber border + "Tap to set deadline" placeholder), `open` (picker active)

**Tap behavior:** Opens date/time picker.

### OffsetSelector

**Purpose:** Multi-select pill group for reminder offset selection.

**Anatomy:** Row of 5 pills: 15m · 30m · 1h · 1d · 2d

**States per chip:** `unselected` — `bg-zinc-700 text-zinc-400`; `selected` — `bg-violet-500 text-white`

**Accessibility:** `role="group"` with `aria-label="Reminder offsets"`. Each chip `role="checkbox"` with `aria-checked`.

### TrustBanner

**Purpose:** Post-save confirmation showing specific scheduled reminder times.

**Anatomy:** Green-950 card → checkmark icon → "Saved" title → reminder times subtitle

**Behavior:** Appears below header on save, persists 3 seconds, fades out. Never stacks.

**Content:** "Saved · Reminders: {time1}, {time2}" or "Saved · No reminders set".

### RecurrenceBadge

**Purpose:** Compact inline indicator on TaskCard showing recurrence pattern.

**Anatomy:** Repeat icon (10px) + short label ("Mon", "Daily", "Mon & Thu")

**Style:** `text-xs text-zinc-500` inline alongside deadline text.

## Component Implementation Roadmap

**Phase 1 — Core creation flow (must ship together):**
1. `VoiceFAB` (all 4 states)
2. `ConfirmationSheet` + `DeadlineChip` + `OffsetSelector`
3. `TaskCard` (default + overdue states)
4. `TrustBanner`

**Phase 2 — Task management:**
5. `TaskCard` swipe gestures + completion animation
6. Task detail / edit view (reuses `ConfirmationSheet` layout)
7. Delete `Dialog`

**Phase 3 — Recurring + polish:**
8. `RecurrenceBadge`
9. `TaskCard` new-item ring highlight animation
10. Archive view (reuses `TaskCard` in read-only state)
