# Story 2.8: Trust Banner

Status: done

## Story

As a user,
I want to see the exact scheduled reminder times immediately after saving a task,
so that I can put my phone down knowing the reminders are set without having to verify.

## Acceptance Criteria

1. **Given** I save a task with one or more offsets selected
   **When** the ConfirmationSheet dismisses
   **Then** a TrustBanner appears pinned below the header: `bg-green-950 border border-green-900 rounded-xl` with a checkmark icon
   **And** the banner text reads "Saved · Reminders: {time1}, {time2}" where times are local-formatted (e.g. "Wed 9am, Thu 9am")

2. **Given** I save a task with zero offsets selected
   **When** the ConfirmationSheet dismisses
   **Then** the TrustBanner reads "Saved · No reminders set"

3. **Given** the TrustBanner is showing
   **When** 3 seconds elapse
   **Then** it fades out automatically; it does not stack if another task is saved before it fades

4. **Given** the TrustBanner is rendered
   **When** a screen reader reads the page
   **Then** the banner has `aria-live="polite"` so the reminder confirmation is announced without interrupting

## Tasks / Subtasks

- [x] Task 1: Create `frontend/src/features/notifications/TrustBanner.tsx` (AC: 1, 2, 3, 4)
  - [x] Create the `TrustBanner` component that reads `trustBannerMessage` from `useUIStore`
  - [x] Render the banner with: `bg-green-950 border border-green-900 rounded-xl` styling, a checkmark icon (`lucide-react` `Check` icon), and the message text
  - [x] Add `aria-live="polite"` to the container element (AC 4)
  - [x] Implement auto-dismiss: on mount when `trustBannerMessage` is non-null, start a 3-second timeout that calls `clearTrustBanner()`; clear the timeout on unmount to prevent memory leaks
  - [x] Cancel and restart the timeout if the message changes while the banner is showing (handles AC 3 "does not stack" — replaces old message with new one, resets timer)

- [x] Task 2: Mount `TrustBanner` in `TaskList.tsx` (AC: 1, 2)
  - [x] In `frontend/src/features/tasks/TaskList.tsx`, import `TrustBanner` from `@/features/notifications/TrustBanner`
  - [x] Render `<TrustBanner />` pinned below the header — place it between the `<div className="flex items-center justify-between mb-6">` header block and the task list content, inside the `max-w-lg` container div

- [x] Task 3: Wire `showTrustBanner` call into `ConfirmationSheet.tsx` (AC: 1, 2)
  - [x] In `frontend/src/features/voice/ConfirmationSheet.tsx`, import `useUIStore` from `@/lib/store`
  - [x] In `SheetForm`, destructure `showTrustBanner` from `useUIStore()`
  - [x] After `await createTask.mutateAsync(...)` succeeds and before `onClose()`, call `showTrustBanner(formatBannerMessage(selectedOffsets, deadlineUtcIso!))`
  - [x] Implement `formatBannerMessage(offsets: number[], deadlineUtcIso: string): string` as a local helper (see Dev Notes for implementation)

- [x] Task 4: Wire `showTrustBanner` call into `EditSheet.tsx` (AC: 1, 2)
  - [x] In `frontend/src/features/voice/EditSheet.tsx`, import `useUIStore` from `@/lib/store`
  - [x] In `EditForm`, destructure `showTrustBanner` from `useUIStore()`
  - [x] After `await updateTask.mutateAsync(payload)` succeeds and before `onClose()`, call `showTrustBanner(formatBannerMessage(selectedOffsets, deadlineUtcIso))`
  - [x] Same `formatBannerMessage` helper — extracted to `@/lib/offsets.ts` so both sheets can import it

- [x] Task 5: Frontend tests (AC: 1, 2, 3, 4)
  - [x] Create `frontend/src/features/notifications/TrustBanner.test.tsx`
  - [x] Test: renders with message when `trustBannerMessage` is set in the store
  - [x] Test: renders nothing (or empty) when `trustBannerMessage` is null
  - [x] Test: has `aria-live="polite"` attribute
  - [x] Test: calls `clearTrustBanner` after 3 seconds (use `vi.useFakeTimers()` and `vi.advanceTimersByTime(3000)`)
  - [x] Test: resets the 3-second timer when message changes (advancing 2s then changing message then advancing 3s should still show banner; advancing 3s more after that clears it)
  - [x] Use real Zustand store — call `useUIStore.setState({ trustBannerMessage: 'test' })` before render

- [x] Task 6: Run all tests and verify (AC: 1–4)
  - [x] `cd frontend && npm test -- --run` — all 32 tests pass
  - [x] `cd frontend && npm run build` — build succeeds

## Dev Notes

### Architecture: Where TrustBanner Lives

From `project-structure-boundaries.md`:
```
src/features/notifications/
    TrustBanner.tsx    # Post-save confirmation with scheduled times  ← Story 2.8 NEW
    usePushSubscription.ts
```

From `core-architectural-decisions.md`:
```
UI state: Zustand — One store for: confirmationSheetOpen, activeTaskId, trustBannerMessage
```

The Zustand store in `frontend/src/lib/store.ts` already has `trustBannerMessage`, `showTrustBanner`, and `clearTrustBanner`:
```typescript
// store.ts (already implemented — DO NOT modify)
interface UIStore {
  trustBannerMessage: string | null
  showTrustBanner: (message: string) => void
  clearTrustBanner: () => void
}
```

### `TrustBanner` Component Implementation

```tsx
// frontend/src/features/notifications/TrustBanner.tsx
import { useEffect, useRef } from 'react'
import { Check } from 'lucide-react'
import { useUIStore } from '@/lib/store'

export default function TrustBanner() {
  const { trustBannerMessage, clearTrustBanner } = useUIStore()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (trustBannerMessage) {
      timerRef.current = setTimeout(() => {
        clearTrustBanner()
      }, 3000)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [trustBannerMessage, clearTrustBanner])

  if (!trustBannerMessage) return null

  return (
    <div
      aria-live="polite"
      className="flex items-center gap-2 bg-green-950 border border-green-900 rounded-xl px-4 py-3 mb-4"
    >
      <Check className="h-4 w-4 text-green-400 shrink-0" />
      <p className="text-sm text-green-300">{trustBannerMessage}</p>
    </div>
  )
}
```

Key points:
- `useRef<ReturnType<typeof setTimeout>>` to track the timer — clears and restarts on every message change (handles AC 3: no stacking)
- `if (!trustBannerMessage) return null` — renders nothing when no message (Zustand state drives visibility)
- `aria-live="polite"` on the container — screen reader announces without interrupting (AC 4)

### `formatBannerMessage` Helper

Extract to `frontend/src/lib/offsets.ts` so both `ConfirmationSheet` and `EditSheet` can import it without duplication:

```typescript
// Add to frontend/src/lib/offsets.ts (existing file — APPEND only)

/**
 * Formats a trust banner message after saving a task.
 * - With offsets: "Saved · Reminders: Wed 9am, Thu 9am"
 * - Without offsets: "Saved · No reminders set"
 */
export function formatBannerMessage(offsets: number[], deadlineUtcIso: string): string {
  if (offsets.length === 0) return 'Saved · No reminders set'
  const times = offsets
    .map((offset) => {
      const reminderTime = new Date(new Date(deadlineUtcIso).getTime() - offset * 60_000)
      return reminderTime.toLocaleString(undefined, {
        weekday: 'short',
        hour: 'numeric',
        minute: reminderTime.getMinutes() !== 0 ? '2-digit' : undefined,
      })
    })
    .join(', ')
  return `Saved · Reminders: ${times}`
}
```

**Time format:** The AC example says "Wed 9am, Thu 9am" — `toLocaleString` with `{ weekday: 'short', hour: 'numeric' }` on a whole-hour time will produce exactly that. The `minute: reminderTime.getMinutes() !== 0 ? '2-digit' : undefined` guards against showing unnecessary `:00` for round hours.

**How reminder times are calculated:**
- Reminder fires at: `deadline - offset_minutes`
- So for a task due Thu 10am with 1440min (1 day) offset: reminder at Wed 10am → "Wed 10am"
- For a task due Thu 10am with 60min (1 hour) offset: reminder at Thu 9am → "Thu 9am"

### Wiring `ConfirmationSheet.tsx`

Current state of `handleSave` in `SheetForm` (already implemented for Story 2.5):
```tsx
const handleSave = async () => {
  if (!canSave) return
  const hasPast = selectedOffsets.some(...)
  setHasPastWarning(hasPast)
  if (selectedOffsets.length > 0) {
    const permResult = await requestAndSubscribe()
    if (permResult === 'denied') { setNotifBlocked(true) }
  }
  try {
    await createTask.mutateAsync({ name, deadline_at, description, offsets: selectedOffsets })
    onClose()  // ← ADD showTrustBanner CALL BEFORE onClose()
  } catch { ... }
}
```

Updated `handleSave` (only the try block changes):
```tsx
const { showTrustBanner } = useUIStore()  // ADD this destructure

// in handleSave try block:
try {
  await createTask.mutateAsync({
    name: name.trim(),
    deadline_at: deadlineUtcIso!,
    description: description.trim() || undefined,
    offsets: selectedOffsets,
  })
  showTrustBanner(formatBannerMessage(selectedOffsets, deadlineUtcIso!))  // ADD
  onClose()
} catch {
  // createTask.isError will be true
}
```

Add import: `import { formatBannerMessage } from '@/lib/offsets'`

### Wiring `EditSheet.tsx`

Same pattern. Current `EditForm.handleSave` try block:
```tsx
try {
  await updateTask.mutateAsync(payload)
  onClose()  // ← ADD showTrustBanner CALL BEFORE onClose()
} catch { ... }
```

Updated:
```tsx
const { showTrustBanner } = useUIStore()  // ADD this destructure

// in handleSave try block:
try {
  await updateTask.mutateAsync(payload)
  showTrustBanner(formatBannerMessage(selectedOffsets, deadlineUtcIso))  // ADD
  onClose()
} catch { ... }
```

Add imports: `import { useUIStore } from '@/lib/store'` and `import { formatBannerMessage } from '@/lib/offsets'`

### Where TrustBanner Is Mounted in `TaskList.tsx`

`TaskList` is the home screen rendered at `/`. The banner should sit between the header row and the task list:

```tsx
// In TaskList.tsx — current structure:
return (
  <div className="min-h-screen bg-zinc-900">
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-zinc-50">Tasks</h1>
        ...
      </div>

      {/* ADD TrustBanner HERE — between header and task content */}
      <TrustBanner />

      {/* ... task list content ... */}
    </div>
    ...
  </div>
)
```

TrustBanner has `mb-4` to maintain spacing from the content below.

### Testing Patterns

The existing `usePushSubscription.test.ts` uses `vi.stubGlobal` for browser APIs. For `TrustBanner.test.tsx`, use `@testing-library/react` with real Zustand store state:

```tsx
// Pattern for setting Zustand store state before render:
import { useUIStore } from '@/lib/store'

beforeEach(() => {
  useUIStore.setState({ trustBannerMessage: null })
})

it('renders message from store', () => {
  useUIStore.setState({ trustBannerMessage: 'Saved · No reminders set' })
  render(<TrustBanner />)
  expect(screen.getByText('Saved · No reminders set')).toBeInTheDocument()
})

it('renders nothing when no message', () => {
  const { container } = render(<TrustBanner />)
  expect(container).toBeEmptyDOMElement()
})

it('has aria-live="polite"', () => {
  useUIStore.setState({ trustBannerMessage: 'test' })
  render(<TrustBanner />)
  expect(screen.getByRole('...')).toHaveAttribute('aria-live', 'polite')
  // or: expect(document.querySelector('[aria-live="polite"]')).toBeTruthy()
})

it('auto-dismisses after 3 seconds', () => {
  vi.useFakeTimers()
  useUIStore.setState({ trustBannerMessage: 'test' })
  render(<TrustBanner />)
  expect(screen.getByText('test')).toBeInTheDocument()
  act(() => vi.advanceTimersByTime(3000))
  expect(screen.queryByText('test')).not.toBeInTheDocument()
  vi.useRealTimers()
})
```

**Important:** The `clearTrustBanner` call from the timer updates Zustand state (`trustBannerMessage = null`), which causes the component to re-render and return `null`. The `queryByText` check will work because React re-renders synchronously after store update in test mode.

### Files Being Modified

| File | Current State | Story 2.8 Changes |
|---|---|---|
| `frontend/src/features/tasks/TaskList.tsx` | Renders task list; no TrustBanner | ADD `<TrustBanner />` between header and content |
| `frontend/src/features/voice/ConfirmationSheet.tsx` | Saves task and calls `onClose()` | ADD `showTrustBanner(...)` call after mutateAsync succeeds |
| `frontend/src/features/voice/EditSheet.tsx` | Saves task and calls `onClose()` | ADD `showTrustBanner(...)` call after mutateAsync succeeds |
| `frontend/src/lib/offsets.ts` | Has REMINDER_OFFSETS + OFFSET_LABELS | ADD `formatBannerMessage()` function |

**New files:**
- `frontend/src/features/notifications/TrustBanner.tsx` (NEW)
- `frontend/src/features/notifications/TrustBanner.test.tsx` (NEW)

### What the Zustand Store Already Provides

From `store.ts` (do NOT modify this file — it already has everything needed):
- `trustBannerMessage: string | null` — the message to display (null = hidden)
- `showTrustBanner(message: string)` — sets the message (called from ConfirmationSheet/EditSheet after save)
- `clearTrustBanner()` — sets message to null (called from TrustBanner's setTimeout after 3s)

### Anti-Patterns to Avoid

- ❌ Using `useState` in `TrustBanner` for the message — Zustand `trustBannerMessage` IS the source of truth; read it directly
- ❌ Using `useEffect` with `setTimeout` that doesn't clean up — always return a cleanup function that calls `clearTimeout(timerRef.current)`
- ❌ Using `setInterval` instead of `setTimeout` — only need to fire once after 3s
- ❌ Calling `showTrustBanner` from an `onSuccess` TanStack Query callback — the message depends on `selectedOffsets` and `deadlineUtcIso` which are component state, not available in the mutation's `onSuccess`; call it inline in `handleSave` after `await mutateAsync`
- ❌ Putting `TrustBanner` inside `ConfirmationSheet` or `EditSheet` — the banner persists after the sheet closes; it belongs in `TaskList` which is always mounted
- ❌ Formatting times without `weekday: 'short'` — the AC specifies "Wed 9am" not just "9am"
- ❌ Forgetting `minute` option for non-round-hour times — "Thu 9:30am" not "Thu 9am"

### Current ConfirmationSheet and EditSheet State

Both sheets are already wired with `usePushSubscription` (Story 2.5) and `selectedOffsets` state. The `handleSave` functions already:
1. Compute `hasPastWarning`
2. Call `requestAndSubscribe()` if offsets selected
3. Call `mutateAsync` to save the task
4. Call `onClose()` on success

Story 2.8 inserts one line before `onClose()` in both sheets — no structural changes needed.

### References

- Epic requirements: [epic-2-push-notifications-reminders.md](../planning-artifacts/epics/epic-2-push-notifications-reminders.md) — Story 2.8 section
- Architecture: [core-architectural-decisions.md](../planning-artifacts/architecture/core-architectural-decisions.md) — `trustBannerMessage` Zustand state, `TrustBanner.tsx` component location
- Project structure: [project-structure-boundaries.md](../planning-artifacts/architecture/project-structure-boundaries.md) — `features/notifications/TrustBanner.tsx`
- Zustand store: `frontend/src/lib/store.ts` — already has `trustBannerMessage`, `showTrustBanner`, `clearTrustBanner`
- ConfirmationSheet (file to modify): `frontend/src/features/voice/ConfirmationSheet.tsx`
- EditSheet (file to modify): `frontend/src/features/voice/EditSheet.tsx`
- TaskList (mount point): `frontend/src/features/tasks/TaskList.tsx`
- offsets.ts (helper to add): `frontend/src/lib/offsets.ts`
- Test pattern reference: `frontend/src/features/notifications/usePushSubscription.test.ts`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Created `TrustBanner.tsx` in `src/features/notifications/` — reads `trustBannerMessage` from Zustand store, auto-dismisses after 3s via `useRef`+`setTimeout`, resets timer on message change, returns null when no message.
- Added `formatBannerMessage()` to `src/lib/offsets.ts` — formats reminder times using `toLocaleString` with `weekday:'short'` + `hour:'numeric'`, omits minute display for round hours.
- Mounted `<TrustBanner />` in `TaskList.tsx` between header and task list content.
- Wired `showTrustBanner(formatBannerMessage(...))` in both `ConfirmationSheet.tsx` and `EditSheet.tsx` after successful `mutateAsync`, before `onClose()`.
- 5 TrustBanner tests cover: message render, null render, aria-live, 3s auto-dismiss, timer reset on message change.
- All 32 tests pass; production build succeeds.

### File List

- frontend/src/features/notifications/TrustBanner.tsx (new)
- frontend/src/features/notifications/TrustBanner.test.tsx (new)
- frontend/src/lib/offsets.ts (modified — added formatBannerMessage)
- frontend/src/features/tasks/TaskList.tsx (modified — added TrustBanner mount)
- frontend/src/features/voice/ConfirmationSheet.tsx (modified — showTrustBanner wiring)
- frontend/src/features/voice/EditSheet.tsx (modified — showTrustBanner wiring)

### Change Log

- 2026-05-25: Story created — TrustBanner component + formatBannerMessage helper + ConfirmationSheet/EditSheet wiring.
- 2026-05-25: Story implemented — all tasks complete, 32/32 tests pass, build succeeds.

### Review Findings

- [x] [Review][Decision] TrustBanner auto-dismiss: resolved with CSS fade — `opacity-0 transition-opacity duration-300` on hide, `clearTrustBanner` called after 300ms [frontend/src/features/notifications/TrustBanner.tsx]
- [x] [Review][Patch] `aria-live` region unmounts on null — fixed: container always rendered, message content conditional inside it [frontend/src/features/notifications/TrustBanner.tsx]
- [x] [Review][Patch] `toLocaleString` without `hour12: true` — fixed: added `hour12: true` [frontend/src/lib/offsets.ts]
- [x] [Review][Defer] `formatBannerMessage` with invalid `deadlineUtcIso` renders "Invalid Date" — deferred, deadline is validated before save; runtime impossible in current call-sites
