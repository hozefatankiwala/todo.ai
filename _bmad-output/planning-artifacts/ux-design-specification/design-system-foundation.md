# Design System Foundation

## Design System Choice

**Tailwind CSS v3 + shadcn/ui** — Tailwind as the styling foundation, shadcn/ui for pre-built accessible components (buttons, sheets, dialogs, chips), with Radix UI primitives underneath for robust accessibility without overhead.

## Rationale for Selection

- **Tailwind is the explicit requirement** — build on it fully; no tradeoff to evaluate
- **shadcn/ui is copy-paste, not a dependency** — components live in the codebase, fully customizable, no version lock-in
- **Radix primitives underneath** — keyboard navigation, focus management, and ARIA roles handled correctly without effort; critical for a PWA used on mobile
- **Dark mode first-class** — `dark:` variants in Tailwind plus shadcn's built-in theming; the sleek aesthetic requires a well-designed dark mode
- **Single developer** — shadcn/ui eliminates time spent building modal sheets, dialogs, and toggle components from scratch; focus goes to voice capture flow and notification logic instead

## Implementation Approach

- **Base palette:** `zinc` neutrals (zinc-50 through zinc-950) for backgrounds, surfaces, and text — warmer and less sterile than `slate`, pairs well with dark mode
- **Accent color:** Single vivid color for interactive elements (FAB, selected offset chips, save button) — `violet-500` / `violet-600`; modern, not overused in productivity apps
- **Typography:** System font stack (`font-sans`) at standard Tailwind sizes; no custom font import — keeps PWA load fast
- **Radius:** `rounded-2xl` for cards and sheets, `rounded-full` for FAB and chips — soft and modern without being bubbly
- **Dark mode strategy:** `class`-based dark mode; default to system preference on first load; no manual toggle in v1

## Customization Strategy

**Components from shadcn/ui (minimal customization needed):**
- `Sheet` — slide-up Confirmation Screen modal
- `Dialog` — delete/end-series confirmation prompts
- `Button` — save, cancel, FAB base
- `Badge` — reminder offset chips styled as toggleable pills

**Components built custom on top of Tailwind:**
- Voice FAB — animated component with distinct listening state (pulse ring, waveform indicator)
- Task list row — swipe gesture support + completion micro-animation
- Post-save trust banner — subtle inline confirmation, not a toast
- Overdue task indicator — muted amber left-border accent on list row

**Design tokens:**

| Token | Dark | Light |
|---|---|---|
| `--surface-base` | zinc-900 | zinc-50 |
| `--surface-elevated` | zinc-800 | white |
| `--text-primary` | zinc-50 | zinc-900 |
| `--text-muted` | zinc-400 | zinc-400 |
| `--accent` | violet-500 | violet-500 |
| `--accent-hover` | violet-600 | violet-600 |
| `--overdue` | amber-500 | amber-500 |
