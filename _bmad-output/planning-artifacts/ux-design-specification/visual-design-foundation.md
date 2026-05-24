# Visual Design Foundation

## Color System

**Base palette — zinc neutrals:**

| Role | Dark mode | Light mode | Tailwind token |
|---|---|---|---|
| Page background | `#18181b` | `#fafafa` | zinc-900 / zinc-50 |
| Surface (cards, sheets) | `#27272a` | `#ffffff` | zinc-800 / white |
| Surface elevated | `#3f3f46` | `#f4f4f5` | zinc-700 / zinc-100 |
| Border / divider | `#52525b` | `#e4e4e7` | zinc-600 / zinc-200 |
| Text primary | `#fafafa` | `#09090b` | zinc-50 / zinc-950 |
| Text secondary | `#a1a1aa` | `#71717a` | zinc-400 |
| Text muted | `#71717a` | `#a1a1aa` | zinc-500 |

**Accent — violet:**

| Role | Value | Tailwind token |
|---|---|---|
| Primary interactive (FAB, save, selected chips) | `#8b5cf6` | violet-500 |
| Hover state | `#7c3aed` | violet-600 |
| Subtle tint (backgrounds) | violet-900 at 20% opacity | violet-900/20 |

**Semantic colors:**

| Role | Value | Usage |
|---|---|---|
| Overdue | `#f59e0b` | amber-500 — left border on overdue task rows |
| Success / confirmation | `#22c55e` | green-500 — post-save trust banner |
| Destructive | `#ef4444` | red-500 — delete action only |

Dark mode is the primary design target; light mode must meet WCAG AA contrast (4.5:1 minimum for body text).

## Typography System

**Font stack:** System sans-serif — `ui-sans-serif, system-ui, -apple-system, sans-serif`. No external font load; keeps PWA fast and feels native on iOS/Android.

**Type scale (Tailwind):**

| Role | Size | Weight | Tailwind |
|---|---|---|---|
| Task name (list row) | 16px | 500 medium | `text-base font-medium` |
| Task name (detail) | 20px | 600 semibold | `text-xl font-semibold` |
| Deadline / metadata | 13px | 400 normal | `text-sm` |
| Section headers | 11px uppercase | 600 | `text-xs font-semibold uppercase tracking-wider` |
| Body / description | 14px | 400 | `text-sm` |
| Confirmation Screen input | 18px | 500 | `text-lg font-medium` |
| Buttons / chips | 14px | 500 | `text-sm font-medium` |

**Line height:** `leading-snug` (1.375) for list rows; `leading-normal` (1.5) for body text and description fields.

## Spacing & Layout Foundation

**Base unit:** 4px (Tailwind default). All spacing in multiples of 4.

**Layout:**
- Single-column, full-bleed on mobile
- Max content width: `max-w-lg` (512px) centered on wider screens
- Safe area insets respected via `pb-safe` for FAB clearance on iOS notch devices

**Key spacing decisions:**

| Element | Spacing |
|---|---|
| Task list row padding | `px-4 py-3` (16px / 12px) |
| FAB position | `bottom-6 right-6` (24px from edges) |
| FAB size | `h-14 w-14` (56px) |
| Sheet padding | `px-4 pt-4 pb-8` |
| Offset chips gap | `gap-2` (8px) |
| Section spacing | `space-y-1` within, `mt-6` between |

**Elevation model:** Two levels only — base surface and elevated surface. Background color differentiation instead of drop shadows (cleaner, faster on mobile).

## Accessibility Considerations

- **Contrast:** All text/background combinations meet WCAG AA (4.5:1 body, 3:1 large text). zinc-400 on zinc-900 = 5.9:1 ✓
- **Touch targets:** Minimum 44×44px for all interactive elements; FAB at 56px; offset chips at `h-9` with horizontal padding
- **Focus states:** `focus-visible:ring-2 focus-visible:ring-violet-500` on all interactive elements
- **Reduced motion:** All animations wrapped in `motion-safe:` — users with prefers-reduced-motion get instant state changes
- **Font sizing:** No text below 12px; deadline metadata at 13px with sufficient contrast
