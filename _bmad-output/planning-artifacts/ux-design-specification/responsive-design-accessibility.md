# Responsive Design & Accessibility

## Responsive Strategy

Mobile-first by design. The entire product is built around phone use, one-handed, in motion. Desktop and tablet are secondary surfaces.

**Mobile (primary):** Full-bleed single column. FAB fixed bottom-right. Sheets slide up from bottom. PWA installed to home screen on iOS/Android.

**Tablet:** Same single-column layout, centered with `max-w-lg`. No layout changes — card design scales gracefully. Extra space left as breathing room.

**Desktop:** `max-w-lg` centered column. Sheets become centered modal dialogs. VoiceFAB remains; keyboard shortcut `V` also triggers voice capture. Mouse hover states on task cards.

## Breakpoint Strategy

Mobile-first. Minimal breakpoint usage:

| Breakpoint | Width | Change |
|---|---|---|
| Base | 0–767px | Full-bleed, bottom sheets, touch targets |
| `md` | 768px+ | Content centered at `max-w-lg`, card shadow for visual separation |
| `lg` | 1024px+ | Sheet → centered dialog, keyboard shortcut enabled, hover states |

`sm:` breakpoint not used — no design changes needed in that range.

## Accessibility Strategy

**Target: WCAG 2.1 AA.**

**Color contrast (verified):**
- zinc-50 on zinc-900: ~19:1 ✓
- zinc-400 on zinc-900: ~5.9:1 ✓
- violet-500 on zinc-900: ~4.7:1 ✓
- amber-500 on zinc-900: ~8.3:1 ✓

**Keyboard navigation:**
- Full tab-order through task list and all sheet fields
- `Enter`/`Space` on task cards opens detail
- `Escape` dismisses any open sheet or dialog
- `V` shortcut triggers VoiceFAB on desktop
- Focus trap inside sheets and dialogs while open

**Screen reader support:**
- `aria-live="polite"` for VoiceFAB state changes and TrustBanner
- Task list: `role="list"`, cards `role="listitem"`
- Completion circle: `<button aria-label="Mark complete: {task name}">`
- OffsetSelector: `role="group" aria-label="Reminder offsets"`, chips as `role="checkbox"`
- Sheets: `aria-modal="true"`, focus moves to first element on open, returns to trigger on close

**Motion:** All animations in `motion-safe:`. Prefers-reduced-motion users get instant state changes.

**PWA accessibility:** iOS install prompt timed to first Reminder-enabled save, framed as "Enable reminders". Push permission requested in same flow. If denied: non-blocking warning, task still saves.

## Testing Strategy

- **Primary:** iPhone 14 (390px) Safari — exact target device
- **Secondary:** Android Chrome (Pixel 7, ~393px)
- **Desktop:** Chrome 1280px and 1920px
- **Edge case:** iPhone SE (375px) — narrowest common modern iPhone
- **Accessibility:** VoiceOver on iOS, Chrome DevTools accessibility panel, keyboard-only walkthrough of all three user journeys before ship

## Implementation Guidelines

**Responsive:**
- `max-w-lg mx-auto` on root layout container handles all breakpoints in one rule
- Bottom sheets: shadcn `Sheet side="bottom"` handles mobile vs. desktop automatically
- Safe areas: `pb-[env(safe-area-inset-bottom)]` on task list scroll container for iPhone notch

**Accessibility:**
- All interactive elements: `focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900`
- Never suppress focus ring with `outline-none` without a `focus-visible:` replacement
- `aria-disabled` on Save button (not HTML `disabled`) to keep it in tab order
- Use `<time datetime="...">` for all deadline displays
