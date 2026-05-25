# Story 3.2: iOS PWA Install Prompt

Status: done

## Story

As a user on iPhone,
I want a clear in-app prompt guiding me to install the app via Safari before I set my first reminder,
so that push notifications work on iOS without me needing to know the Safari-specific installation requirement.

## Acceptance Criteria

1. **Given** I am on iOS Safari and have not yet installed the PWA
   **When** I attempt to save a task with at least one offset selected for the first time
   **Then** the `PWAInstallPrompt` component appears before the save completes, framed as "Enable reminders — install the app to your home screen"
   **And** the prompt shows Safari-specific instructions: tap the Share icon → "Add to Home Screen"

2. **Given** the PWAInstallPrompt is showing
   **When** I dismiss it without installing
   **Then** the task is saved normally (without push subscription); the prompt does not re-appear on the same session; a non-blocking warning is shown: "Reminders won't fire until the app is installed"

3. **Given** I have already installed the PWA to my home screen
   **When** I open the app from the home screen icon (standalone mode)
   **Then** the PWAInstallPrompt never appears; push permission is requested normally on the first reminder-enabled save

4. **Given** the app is running in non-iOS browsers (Chrome Android, desktop)
   **When** the first reminder-enabled save occurs
   **Then** the PWAInstallPrompt is skipped entirely; the standard browser push permission prompt fires instead

5. **Given** the install state is detected
   **When** I inspect the logic in `usePushSubscription.ts`
   **Then** `window.navigator.standalone` (iOS) or `window.matchMedia('(display-mode: standalone)')` is used to detect installed state; detection happens before the permission flow

## Tasks / Subtasks

- [x] Task 1: Add iOS/standalone detection helpers to `usePushSubscription.ts` (AC: 3, 4, 5)
  - [x] Add `isIos(): boolean` — returns `true` when `/iphone|ipad|ipod/i.test(navigator.userAgent)` AND NOT `window.matchMedia('(display-mode: standalone)').matches` AND NOT `(window.navigator as any).standalone`
  - [x] Add `isStandalone(): boolean` — returns `true` when `window.matchMedia('(display-mode: standalone)').matches` OR `(window.navigator as any).standalone === true`
  - [x] Export `isIos` and `isStandalone` — `PWAInstallPrompt.tsx` and `ConfirmationSheet.tsx` need them
  - [x] Add `iosInstallDismissed` session flag: `sessionStorage.getItem('pwa-install-dismissed') === 'true'`
  - [x] Add `setIosInstallDismissed()` helper: `sessionStorage.setItem('pwa-install-dismissed', 'true')`
  - [x] Update `requestAndSubscribe` return type to include `'ios-needs-install'` as a possible result
  - [x] In `requestAndSubscribe`: before the existing `checkPushSupported()` check, add: if `isIos()` AND NOT `isStandalone()` AND NOT `iosInstallDismissed()` → return `'ios-needs-install'`
  - [x] If `isIos()` AND `isStandalone()` → proceed normally through existing permission flow (no iOS prompt)

- [x] Task 2: Create `PWAInstallPrompt` component (AC: 1, 2)
  - [x] Create `frontend/src/features/notifications/PWAInstallPrompt.tsx`
  - [x] Component accepts props: `open: boolean`, `onDismiss: () => void`
  - [x] Use shadcn `Sheet` (side="bottom") — same pattern as `ConfirmationSheet` and `EditSheet`: `bg-zinc-700 rounded-t-2xl px-4 pt-4 pb-8 border-0`
  - [x] Content layout:
    - Drag handle: `<div className="w-12 h-1 bg-zinc-500 rounded-full mx-auto mb-4" />`
    - Heading: `"Enable reminders"` — `text-xl font-semibold text-zinc-50 mb-2`
    - Body: `"Install this app to your home screen so reminders can reach you even when Safari is closed."` — `text-zinc-400 text-sm mb-6`
    - Instruction row 1: Share icon (use `Share` from `lucide-react`) + text `"Tap the Share button in Safari's toolbar"` — `flex items-center gap-3 bg-zinc-800 rounded-2xl px-4 py-3 mb-3`
    - Instruction row 2: Plus-square icon (use `PlusSquare` from `lucide-react`) + text `"Tap \"Add to Home Screen\""` — same row styling
    - Dismiss button: `"I'll do it later"` — `text-zinc-400 text-sm text-center w-full mt-4`, calls `onDismiss`
  - [x] Import `Sheet`, `SheetContent`, `SheetTitle` from `@/components/ui/sheet`
  - [x] Use `<VisuallyHidden.Root><SheetTitle>Install app</SheetTitle></VisuallyHidden.Root>` for screen reader title (same pattern as ConfirmationSheet)

- [x] Task 3: Wire `PWAInstallPrompt` into `ConfirmationSheet.tsx` (AC: 1, 2, 4)
  - [x] Add state: `const [showInstallPrompt, setShowInstallPrompt] = useState(false)` in `SheetForm`
  - [x] Add state: `const [installDismissed, setInstallDismissed] = useState(false)`
  - [x] In `handleSave`, replace the `requestAndSubscribe()` call block with:
    ```
    if (selectedOffsets.length > 0) {
      const permResult = await requestAndSubscribe()
      if (permResult === 'ios-needs-install') {
        setShowInstallPrompt(true)
        return  // pause save — show the install prompt first
      }
      if (permResult === 'denied') {
        setNotifBlocked(true)
        // DO NOT return — task still saves
      }
    }
    ```
  - [x] Add `handleInstallDismiss` function
  - [x] **Important:** `handleInstallDismiss` must re-save the task directly (not call `handleSave` again — that would re-check iOS and re-show the prompt). Use `createTask.mutateAsync` directly.
  - [x] Render `<PWAInstallPrompt open={showInstallPrompt} onDismiss={handleInstallDismiss} />` inside `SheetForm` return (before the closing `</>`)
  - [x] Show "Reminders won't fire until the app is installed" warning when `installDismissed` is true (use existing `notifBlocked` pattern: `text-amber-400 text-sm mt-2`)
  - [x] Import `PWAInstallPrompt` from `@/features/notifications/PWAInstallPrompt`
  - [x] Import `isIos`, `isStandalone`, `setIosInstallDismissed` from `@/features/notifications/usePushSubscription`

- [x] Task 4: Wire `PWAInstallPrompt` into `EditSheet.tsx` (AC: 1, 2, 4)
  - [x] Same pattern as Task 3 — add `showInstallPrompt` and `installDismissed` state in `EditForm`
  - [x] Same `handleSave` modification for `'ios-needs-install'` result
  - [x] `handleInstallDismiss` calls `updateTask.mutateAsync(payload)` directly — the payload was already constructed before `handleSave` returned
  - [x] **Nuance for EditSheet:** The `payload` is built inside `handleSave` after the try block starts. To re-run the save after dismiss, you need to store the payload in a `useRef` before the early return, then use it in `handleInstallDismiss`
  - [x] Render `<PWAInstallPrompt open={showInstallPrompt} onDismiss={handleInstallDismiss} />` inside `EditForm` return
  - [x] Same imports as Task 3

- [x] Task 5: Write tests for `PWAInstallPrompt` and detection helpers (AC: 1, 2, 3, 4, 5)
  - [x] Create `frontend/src/features/notifications/PWAInstallPrompt.test.tsx`
  - [x] Test: renders sheet when `open=true` with heading "Enable reminders"
  - [x] Test: calls `onDismiss` when "I'll do it later" button is clicked
  - [x] Test: renders Share and PlusSquare instruction rows
  - [x] Test: sheet is not rendered (or empty) when `open=false`
  - [x] Add tests for `isIos` and `isStandalone` detection helpers in `usePushSubscription.test.ts`:
    - Test: `isIos()` returns `true` when UA contains "iPhone" and not standalone
    - Test: `isIos()` returns `false` when standalone (matchMedia)
    - Test: `isIos()` returns `false` on non-iOS UA
    - Test: `requestAndSubscribe` returns `'ios-needs-install'` when `isIos()` and sessionStorage flag not set
    - Test: `requestAndSubscribe` proceeds normally when iOS+standalone

- [x] Task 6: Run tests and build verification (AC: 1–5)
  - [x] `cd frontend && npx vitest run` — all tests pass (32 existing + new tests)
  - [x] `cd frontend && npm run build` — build succeeds

### Review Findings

- [x] [Review][Decision] iOS browser targeting is ambiguous — resolved: keep the prompt for all iOS browsers with the current Safari-specific instruction path.
- [x] [Review][Patch] Dismissal warning is not visible after successful save [frontend/src/features/voice/ConfirmationSheet.tsx:72]
- [x] [Review][Patch] Prompt does not use required framing copy [frontend/src/features/notifications/PWAInstallPrompt.tsx:18]
- [x] [Review][Patch] `isStandalone()` can throw when `window.matchMedia` is unavailable [frontend/src/features/notifications/usePushSubscription.ts:4]

## Dev Notes

### How the iOS Push Constraint Works

iOS Safari requires the app to be **installed as a PWA** (added to home screen) before web push notifications can be subscribed. When running in regular Safari (not standalone), `PushManager` does not exist or `Notification` is unsupported — `checkPushSupported()` will return `false`. However the key gate is user experience: we want to show a **helpful prompt** before the user tries to save a task with offsets, not silently fail.

The flow:
1. User selects offsets and taps Save
2. `handleSave` calls `requestAndSubscribe()`
3. `requestAndSubscribe()` detects: iOS + not standalone + not dismissed → returns `'ios-needs-install'`
4. `handleSave` sees `'ios-needs-install'` → shows `PWAInstallPrompt`, stops save
5. User dismisses prompt → `handleInstallDismiss` fires → saves task without push, shows warning
6. On next session, sessionStorage is cleared → prompt re-appears if user tries again with offsets

### Detection Logic — Precise Implementation

```typescript
// Add to usePushSubscription.ts (module-level helpers, exported)

export function isIos(): boolean {
  if (typeof window === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !isStandalone()
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  )
}

function iosInstallDismissed(): boolean {
  try { return sessionStorage.getItem('pwa-install-dismissed') === 'true' } catch { return false }
}

export function setIosInstallDismissed(): void {
  try { sessionStorage.setItem('pwa-install-dismissed', 'true') } catch { /* ignore */ }
}
```

**Updated `requestAndSubscribe` return type:**
```typescript
const requestAndSubscribe = async (): Promise<'granted' | 'denied' | 'unsupported' | 'ios-needs-install'> => {
  // NEW: iOS gate — check before push support check
  if (isIos() && !iosInstallDismissed()) return 'ios-needs-install'

  if (!checkPushSupported()) return 'unsupported'
  // ... rest unchanged
}
```

Note: `isIos()` already returns `false` when standalone, so the standalone case falls through to the normal push flow.

### `PWAInstallPrompt.tsx` Full Implementation

```tsx
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import { Share, PlusSquare } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'

interface PWAInstallPromptProps {
  open: boolean
  onDismiss: () => void
}

export default function PWAInstallPrompt({ open, onDismiss }: PWAInstallPromptProps) {
  return (
    <Sheet open={open} onOpenChange={onDismiss}>
      <SheetContent side="bottom" className="bg-zinc-700 rounded-t-2xl px-4 pt-4 pb-8 border-0">
        <VisuallyHidden.Root>
          <SheetTitle>Install app</SheetTitle>
        </VisuallyHidden.Root>
        <div className="w-12 h-1 bg-zinc-500 rounded-full mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-zinc-50 mb-2">Enable reminders</h2>
        <p className="text-zinc-400 text-sm mb-6">
          Install this app to your home screen so reminders can reach you even when Safari is closed.
        </p>
        <div className="flex items-center gap-3 bg-zinc-800 rounded-2xl px-4 py-3 mb-3">
          <Share className="h-5 w-5 text-zinc-300 shrink-0" />
          <p className="text-sm text-zinc-200">Tap the Share button in Safari's toolbar</p>
        </div>
        <div className="flex items-center gap-3 bg-zinc-800 rounded-2xl px-4 py-3">
          <PlusSquare className="h-5 w-5 text-zinc-300 shrink-0" />
          <p className="text-sm text-zinc-200">Tap "Add to Home Screen"</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-zinc-400 text-sm text-center w-full mt-4"
        >
          I'll do it later
        </button>
      </SheetContent>
    </Sheet>
  )
}
```

### `ConfirmationSheet.tsx` — Updated `handleSave` and `handleInstallDismiss`

Current `handleSave` in `SheetForm` (lines 33–63 in `ConfirmationSheet.tsx`):
```tsx
const handleSave = async () => {
  if (!canSave) return
  setNotifBlocked(false)
  setHasPastWarning(false)
  const hasPast = selectedOffsets.some(...)
  setHasPastWarning(hasPast)
  if (selectedOffsets.length > 0) {
    const permResult = await requestAndSubscribe()
    if (permResult === 'denied') { setNotifBlocked(true) }
  }
  try {
    await createTask.mutateAsync({...})
    showTrustBanner(...)
    onClose()
  } catch { }
}
```

Updated (only the `requestAndSubscribe` block changes):
```tsx
// Add to SheetForm state:
const [showInstallPrompt, setShowInstallPrompt] = useState(false)
const [installDismissed, setInstallDismissed] = useState(false)

// Updated requestAndSubscribe block in handleSave:
if (selectedOffsets.length > 0) {
  const permResult = await requestAndSubscribe()
  if (permResult === 'ios-needs-install') {
    setShowInstallPrompt(true)
    return
  }
  if (permResult === 'denied') {
    setNotifBlocked(true)
    // DO NOT return
  }
}

// handleInstallDismiss (new function in SheetForm):
const handleInstallDismiss = async () => {
  setIosInstallDismissed()
  setInstallDismissed(true)
  setShowInstallPrompt(false)
  try {
    await createTask.mutateAsync({
      name: name.trim(),
      deadline_at: deadlineUtcIso!,
      description: description.trim() || undefined,
      offsets: selectedOffsets,
    })
    showTrustBanner(formatBannerMessage(selectedOffsets, deadlineUtcIso!))
    onClose()
  } catch { }
}

// In the JSX return, add before closing </>:
{notifBlocked || installDismissed ? (
  <p className="text-amber-400 text-sm mt-2">
    {installDismissed
      ? "Reminders won't fire until the app is installed"
      : "Reminders won't fire — notifications are blocked"}
  </p>
) : null}
<PWAInstallPrompt open={showInstallPrompt} onDismiss={handleInstallDismiss} />
```

**Note:** Remove the standalone `{notifBlocked && <p>...</p>}` inline in the JSX and replace with the combined version above.

Add imports at top:
```tsx
import PWAInstallPrompt from '@/features/notifications/PWAInstallPrompt'
import { setIosInstallDismissed } from '@/features/notifications/usePushSubscription'
```

### `EditSheet.tsx` — `handleInstallDismiss` Nuance

The `EditSheet` payload is built inside `handleSave` after the return point. To pass it to `handleInstallDismiss`, store it in a ref:

```tsx
// In EditForm — add ref:
const pendingPayloadRef = useRef<Parameters<typeof updateTask.mutateAsync>[0] | null>(null)

// In handleSave — store payload BEFORE the early return:
const trimmedName = name.trim()
const trimmedDesc = description.trim() || null
const payload: Parameters<typeof updateTask.mutateAsync>[0] = { id: task.id }
if (trimmedName !== task.name) payload.name = trimmedName
if (deadlineUtcIso !== task.deadline_at) payload.deadline_at = deadlineUtcIso
if (trimmedDesc !== (task.description ?? null)) payload.description = trimmedDesc
const currentOffsets = task.offsets ?? []
if (JSON.stringify([...selectedOffsets].sort((a,b)=>a-b)) !== JSON.stringify([...currentOffsets].sort((a,b)=>a-b))) {
  payload.offsets = selectedOffsets
}
pendingPayloadRef.current = payload  // ← store BEFORE early return

if (selectedOffsets.length > 0) {
  const permResult = await requestAndSubscribe()
  if (permResult === 'ios-needs-install') {
    setShowInstallPrompt(true)
    return  // payload already stored in ref
  }
  ...
}

try {
  await updateTask.mutateAsync(payload)
  ...
}

// handleInstallDismiss uses the stored payload:
const handleInstallDismiss = async () => {
  setIosInstallDismissed()
  setInstallDismissed(true)
  setShowInstallPrompt(false)
  const payload = pendingPayloadRef.current
  if (!payload) return
  try {
    await updateTask.mutateAsync(payload)
    showTrustBanner(formatBannerMessage(selectedOffsets, deadlineUtcIso))
    onClose()
  } catch { }
}
```

Add `useRef` to imports from 'react'.

### Current State of Files Being Modified

**`usePushSubscription.ts`** — currently exports `usePushSubscription()` with `permissionState` and `requestAndSubscribe`. No iOS detection. `requestAndSubscribe` returns `'granted' | 'denied' | 'unsupported'`. The `checkPushSupported()` and `_registerPushSubscription()` are module-level functions (not exported).

**`ConfirmationSheet.tsx`** — `SheetForm` currently has `notifBlocked` state for the blocked warning. The `requestAndSubscribe()` call is at line 44. The `{notifBlocked && <p>...</p>}` warning is at line 98. No iOS install prompt state exists yet.

**`EditSheet.tsx`** — Similar structure to ConfirmationSheet. `requestAndSubscribe()` call at line 47. The `notifBlocked` warning at line 107. Payload currently built at lines 54–62 immediately before `try { await updateTask.mutateAsync(payload) }`. The payload building needs to move ABOVE the `requestAndSubscribe()` early-return check.

### `PWAInstallPrompt.tsx` Location

Per project structure: `src/features/notifications/PWAInstallPrompt.tsx` — already listed in `project-structure-boundaries.md` as a planned file.

### shadcn Sheet Component — Available Imports

From existing usage in `ConfirmationSheet.tsx` and `EditSheet.tsx`:
```tsx
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
```
Both `sheet.tsx` and `dialog.tsx` are in `frontend/src/components/ui/`. Use `Sheet` (bottom sheet), not `Dialog` (centered modal) — consistent with existing sheets.

### Testing Patterns

Use the same patterns established in `usePushSubscription.test.ts` and `TrustBanner.test.tsx`:
- `vi.stubGlobal` for `navigator.userAgent`, `window.matchMedia`, `window.navigator.standalone`
- For sessionStorage: `vi.stubGlobal('sessionStorage', { getItem: vi.fn(), setItem: vi.fn() })`
- For component tests: `@testing-library/react` render + screen queries
- The `usePushSubscription` module must be dynamically imported (`await import(...)`) in tests because it uses top-level globals — same pattern already in the test file

**Stubbing `matchMedia` for standalone detection:**
```typescript
vi.stubGlobal('window', {
  ...window,
  matchMedia: vi.fn().mockReturnValue({ matches: false }),
})
// or directly:
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockReturnValue({ matches: false }),
  writable: true,
  configurable: true,
})
```

**Stubbing `navigator.userAgent`:**
```typescript
Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
  writable: true,
  configurable: true,
})
```

### Anti-Patterns to Avoid

- ❌ Re-calling `handleSave` from `handleInstallDismiss` — that would re-check iOS and re-show the prompt
- ❌ Adding `pwa-install-dismissed` to Zustand store — this is session-scoped, not app-UI state; sessionStorage is correct
- ❌ Using `Dialog` instead of `Sheet` for `PWAInstallPrompt` — must match the existing sheet pattern (bottom sheet)
- ❌ Checking iOS detection in component JSX — detection belongs in `usePushSubscription.ts`, not scattered in components
- ❌ Skipping the `pendingPayloadRef` in `EditSheet` — the payload building is after the function start but the early return means the payload needs to be pre-computed
- ❌ Hiding the install prompt when the sheet is closed — `onOpenChange={onDismiss}` handles the close gesture; `onDismiss` must call `setIosInstallDismissed()` and save the task

### Files Being Modified

| File | Current State | Story 3.2 Changes |
|---|---|---|
| `frontend/src/features/notifications/usePushSubscription.ts` | No iOS detection, returns 3 values | ADD `isIos`, `isStandalone`, `setIosInstallDismissed` exports + `'ios-needs-install'` return value |
| `frontend/src/features/voice/ConfirmationSheet.tsx` | No install prompt | ADD `showInstallPrompt`/`installDismissed` state, `handleInstallDismiss`, `PWAInstallPrompt` render |
| `frontend/src/features/voice/EditSheet.tsx` | No install prompt | Same as ConfirmationSheet + `pendingPayloadRef` for payload storage |

**New files:**
- `frontend/src/features/notifications/PWAInstallPrompt.tsx`
- `frontend/src/features/notifications/PWAInstallPrompt.test.tsx`

### References

- Epic requirements: [epic-3-pwa-production-deployment.md](../planning-artifacts/epics/epic-3-pwa-production-deployment.md) — Story 3.2 section
- UX spec: [responsive-design-accessibility.md](../planning-artifacts/ux-design-specification/responsive-design-accessibility.md) — PWA accessibility section
- UX spec: [core-user-experience.md](../planning-artifacts/ux-design-specification/core-user-experience.md) — iOS push notification constraint
- Previous story (3.1): [3-1-pwa-manifest-service-worker.md](3-1-pwa-manifest-service-worker.md) — PWA manifest + service worker now complete
- `usePushSubscription.ts`: `frontend/src/features/notifications/usePushSubscription.ts`
- `ConfirmationSheet.tsx`: `frontend/src/features/voice/ConfirmationSheet.tsx`
- `EditSheet.tsx`: `frontend/src/features/voice/EditSheet.tsx`
- `store.ts` (Zustand — do NOT add to it): `frontend/src/lib/store.ts`
- Test pattern reference: `frontend/src/features/notifications/usePushSubscription.test.ts`
- Component strategy: [component-strategy.md](../planning-artifacts/ux-design-specification/component-strategy.md)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Added `isIos()`, `isStandalone()`, `setIosInstallDismissed()` as exported module-level helpers in `usePushSubscription.ts`. The `iosInstallDismissed()` helper is intentionally unexported (session-internal).
- Updated `requestAndSubscribe` return type to `'granted' | 'denied' | 'unsupported' | 'ios-needs-install'`. The iOS gate fires before the push support check so non-installed iOS users get the prompt rather than a silent unsupported result.
- Created `PWAInstallPrompt.tsx` as a bottom `Sheet` matching the existing ConfirmationSheet/EditSheet styling pattern.
- Wired `PWAInstallPrompt` into both `ConfirmationSheet` and `EditSheet`. In `EditSheet`, payload construction was moved above the `requestAndSubscribe()` early-return and stored in `pendingPayloadRef` so `handleInstallDismiss` can replay the save without re-triggering the iOS check.
- `handleInstallDismiss` in both sheets calls `createTask`/`updateTask` directly (not `handleSave`) per the anti-pattern guidance in Dev Notes.
- 43 tests pass (32 existing + 11 new). Build succeeds.

### File List

- `frontend/src/features/notifications/usePushSubscription.ts` (modified)
- `frontend/src/features/notifications/PWAInstallPrompt.tsx` (new)
- `frontend/src/features/notifications/PWAInstallPrompt.test.tsx` (new)
- `frontend/src/features/notifications/usePushSubscription.test.ts` (modified)
- `frontend/src/features/voice/ConfirmationSheet.tsx` (modified)
- `frontend/src/features/voice/EditSheet.tsx` (modified)

### Change Log

- 2026-05-25: Story created — iOS detection helpers, PWAInstallPrompt component, ConfirmationSheet/EditSheet wiring, session-scoped dismiss state.
- 2026-05-25: Story implemented — all 6 tasks complete, 43 tests pass, build clean.
