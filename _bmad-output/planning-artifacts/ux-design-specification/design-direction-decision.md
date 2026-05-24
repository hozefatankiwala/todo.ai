# Design Direction Decision

## Design Directions Explored

Six directions were generated covering: minimal dark flat list (1), elevated cards (2), grouped-by-day sections (3), bold gradient header (4), light mode (5), and a hybrid dark flat-list direction (6). Full mockups available in `ux-design-directions.html`.

## Chosen Direction

**Direction 2 — Elevated Cards**

- zinc-800 base background, zinc-700 card surfaces
- Each task is a distinct rounded card (`rounded-2xl`) with clear physical separation
- Overdue tasks: amber left-border accent on cards
- Header: compact with active task count badge
- Confirmation sheet: inset zinc-800 field cards inside the zinc-700 sheet
- Post-save: green trust banner at top of list showing specific reminder times
- Newly saved task: brief violet ring highlight on card before fading to normal

## Design Rationale

Cards work especially well for this app because:
1. **Touch target clarity** — each card is a distinct, generous tap target with no ambiguity about what is being tapped on mobile
2. **Overdue treatment** — amber left-border on a card is visually contained and non-alarming; neutral enough to signal without inducing guilt
3. **Trust banner** — the green save confirmation reads naturally against the card grid as an inline banner, not a floating toast
4. **Confirmation screen layering** — inset field cards within the sheet create a clear visual hierarchy (sheet → field card → content) that mirrors the home screen card language

## Implementation Approach

- `bg-zinc-900` page, `bg-zinc-800` task cards with `rounded-2xl`, elevation via background contrast (no borders, no drop shadows)
- `border-l-4 border-amber-500` on overdue cards only
- New task card gets `ring-1 ring-violet-500/40` for ~2 seconds on appear, then transitions to normal
- Trust banner: `bg-green-950 border border-green-900 rounded-xl` pinned below header, auto-dismisses after 3s with fade
- Confirmation sheet: `bg-zinc-700` sheet with `bg-zinc-800` inset field cards
