# UX Pattern Analysis & Inspiration

## Inspiring Products Analysis

**Linear** — The gold standard for fast, keyboard/gesture-driven productivity UI. Minimal chrome, instant feedback, transitions that feel snappy rather than decorative. Proves that a task-management tool can feel like a premium native app in the browser.

**Apple Reminders (iOS 17+)** — The baseline the user is already familiar with and the benchmark to beat. Strength: notification reliability and deep OS integration. Weakness: creation friction (too many fields, no voice-first path) and no urgency hierarchy.

**Overcast** — A masterclass in opinionated, single-purpose mobile design. One clear primary action, no feature bloat, dark/clean aesthetic, typography-first layout. Shows how a solo-developer app can feel more refined than enterprise software.

**Fantastical** — Best-in-class natural language date/time parsing with an inline confirmation pattern. The way it shows "interpreted as: Thursday, June 5 at 10am" inline is directly applicable to our Confirmation Screen approach.

## Transferable UX Patterns

**Navigation Patterns:**
- **Single-surface home** (Linear, Overcast) — no bottom tabs, no sidebar; one primary list view with a FAB as the only persistent CTA. Directly adopt.
- **Slide-up modal sheet for creation** (iOS Reminders, Fantastical) — creation flows as modal sheets, not full-screen navigations; preserves spatial context. Adopt for Confirmation Screen.

**Interaction Patterns:**
- **Inline parse preview** (Fantastical) — show interpreted deadline as a formatted date chip on the Confirmation Screen, editable on tap. Adapt for our voice parse result.
- **Chip-style multi-select** — reminder offsets as pill chips that toggle on/off with a single tap; selected state visually distinct with fill color. Adopt for offset selection.
- **Swipe-to-complete** (Things 3, iOS Reminders) — swipe gesture on a task row to mark complete; satisfying and one-handed. Adopt for task list.
- **Subtle haptic + micro-animation on save** — brief scale pulse or checkmark animation on task save; reinforces "it's done" without being celebratory.

**Visual Patterns:**
- Tailwind-native neutral base (zinc/slate grays) with a single accent color for interactive elements — keeps UI calm and focused
- Typography-first hierarchy — task name in medium-weight sans-serif; deadline in smaller muted text; no icons cluttering rows
- FAB as the visual anchor — large, rounded, fixed bottom-right, accent-colored; the only element competing for attention on the task list

## Anti-Patterns to Avoid

- **Feature-discovery carousels on first launch** — wastes time, violates the speed principle
- **Required fields beyond name + deadline** — any mandatory field beyond these two is a friction tax
- **Toast notifications for every action** — use inline state changes instead (task disappears on complete, counts update silently)
- **Confirmation dialogs for low-stakes actions** — only prompt for destructive actions (delete, end series); never for completion
- **Skeleton loaders on the task list** — must render from local state instantly
- **Hidden navigation patterns** (hamburger, drawer) — all surfaces reachable from the task list directly

## Design Inspiration Strategy

**Adopt directly:**
- Single-surface home with FAB-only creation entry point
- Chip-style toggle for reminder offset selection
- Swipe-to-complete on task rows
- Slide-up modal sheet for Confirmation Screen
- Tailwind + zinc/slate neutral palette with a single accent color

**Adapt:**
- Fantastical's inline parse preview → parsed deadline shown as an editable formatted chip on the Confirmation Screen
- Linear's snappy transitions → animation duration under 200ms; nothing lingers

**Avoid entirely:**
- Mandatory fields beyond name + deadline
- Navigation patterns that hide primary actions
- Guilt-signaling visual treatments for overdue tasks
