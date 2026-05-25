# Story 2.5: Push Permission & Subscription Flow

Status: done

## Story

As a user,
I want the app to request push notification permission at the right moment and subscribe my browser,
so that reminders can reach me even when the app tab is closed.

## Acceptance Criteria

1. **Given** I am saving a task with at least one offset selected for the first time
   **When** I tap Save
   **Then** the browser push notification permission prompt fires before the API call completes
   **And** the permission prompt does not fire on app open or on saves with zero offsets

2. **Given** I grant notification permission
   **When** the browser subscribes
   **Then** `POST /api/v1/push/subscribe` is called with the VAPID subscription object; the subscription is stored; subsequent saves do not re-prompt
   **And** `VITE_VAPID_PUBLIC_KEY` is used on the frontend to create the push subscription (never the private key)

3. **Given** I deny notification permission
   **When** the denial is detected
   **Then** an inline non-blocking warning appears: "Reminders won't fire — notifications are blocked"; the task is still saved normally
   **And** the permission state is persisted; the prompt is not shown again on subsequent saves

4. **Given** permission has already been granted in a previous session
   **When** I open the app again
   **Then** no permission prompt appears; `usePushSubscription` re-registers the subscription silently if needed

## Tasks / Subtasks

- [x] Task 1: Create `usePushSubscription` hook (AC: 1, 2, 3, 4)
  - [x] Create `frontend/src/features/notifications/usePushSubscription.ts`
  - [x] Hook exposes: `requestAndSubscribe(): Promise<'granted' | 'denied' | 'unsupported'>` and `permissionState: NotificationPermission | 'unsupported'`
  - [x] On mount, check `Notification.permission` and set initial `permissionState`
  - [x] If permission is already `"granted"` on mount, silently re-register the push subscription (call `_registerPushSubscription()` internally — see Dev Notes) — this handles AC 4
  - [x] `requestAndSubscribe()`: check if notifications are supported (`'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window`); if not, return `'unsupported'`
  - [x] If `Notification.permission === 'granted'`, skip the prompt and go straight to `_registerPushSubscription()`; return `'granted'`
  - [x] If `Notification.permission === 'denied'`, return `'denied'` immediately without prompting
  - [x] Otherwise call `await Notification.requestPermission()` — if result is `'granted'`, call `_registerPushSubscription()`; return result
  - [x] `_registerPushSubscription()`: get service worker registration via `navigator.serviceWorker.ready`; call `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY) })`; POST the subscription to `POST /api/v1/push/subscribe` via `api` (Axios); catch errors and log — do NOT re-throw (subscription failure should not block task save)
  - [x] `urlBase64ToUint8Array` utility: include as a private helper in the same file (see Dev Notes for implementation)

- [x] Task 2: Wire `usePushSubscription` into `ConfirmationSheet` (AC: 1, 2, 3)
  - [x] In `frontend/src/features/voice/ConfirmationSheet.tsx`, import `usePushSubscription`
  - [x] Call the hook inside `SheetForm` to get `requestAndSubscribe`
  - [x] Add state: `const [notifBlocked, setNotifBlocked] = useState(false)`
  - [x] In `handleSave`: if `selectedOffsets.length > 0`, call `const result = await requestAndSubscribe()` BEFORE calling `createTask.mutateAsync`
  - [x] If `result === 'denied'`, set `notifBlocked(true)` — do NOT block save, continue to create task
  - [x] Render inline warning below OffsetSelector (but above Save button): `{notifBlocked && <p className="text-amber-400 text-sm mt-2">Reminders won't fire — notifications are blocked</p>}`
  - [x] If `selectedOffsets.length === 0`, do NOT call `requestAndSubscribe` — no prompt when no offsets selected (AC 1)

- [x] Task 3: Wire `usePushSubscription` into `EditSheet` (AC: 1, 2, 3)
  - [x] In `frontend/src/features/voice/EditSheet.tsx`, import `usePushSubscription`
  - [x] Same pattern as ConfirmationSheet: call `requestAndSubscribe()` only if `selectedOffsets.length > 0` before `updateTask.mutateAsync`
  - [x] Show same `notifBlocked` warning inline

- [x] Task 4: Silent re-subscription on app open (AC: 4)
  - [x] In `frontend/src/main.tsx` OR `frontend/src/features/notifications/usePushSubscription.ts` (preferred: in the hook's `useEffect` on mount), silently re-register if permission is already granted
  - [x] The hook's mount effect handles this: if `Notification.permission === 'granted'` on mount, call `_registerPushSubscription()` silently (no await blocking mount — fire and forget)
  - [x] This handles AC 4: subsequent app opens re-register the subscription silently, no prompt

- [x] Task 5: Frontend tests for `usePushSubscription` hook (AC: 1, 2, 3, 4)
  - [x] Create `frontend/src/features/notifications/usePushSubscription.test.ts`
  - [x] Test: `requestAndSubscribe` returns `'unsupported'` when `window.Notification` is undefined
  - [x] Test: `requestAndSubscribe` returns `'denied'` immediately without calling `requestPermission` when `Notification.permission === 'denied'`
  - [x] Test: `requestAndSubscribe` calls `Notification.requestPermission` when permission is `'default'`
  - [x] Test: on mount with `permission === 'granted'`, `_registerPushSubscription` is called (mock `navigator.serviceWorker.ready`)
  - [x] Use `vi.stubGlobal` (Vitest) to mock `window.Notification` and `navigator.serviceWorker`

- [x] Task 6: Run all tests and verify (AC: 1–4)
  - [x] `cd frontend && npm test -- --run` — all existing + new tests pass
  - [x] Manual check: `VITE_VAPID_PUBLIC_KEY` is set in `frontend/.env` (copy from `backend/.env` after key generation); if not set, `_registerPushSubscription` must not crash — log warning and return

## Dev Notes

### Architecture Boundary: Notifications Feature

Per architecture doc: `src/features/notifications/` contains:
- `TrustBanner.tsx` — post-save confirmation (Story 2.8)
- `PWAInstallPrompt.tsx` — iOS install prompt (Epic 3)
- `usePushSubscription.ts` — **this story** — permission + VAPID subscription hook

The hook lives in `src/features/notifications/`, not `src/hooks/` (the architecture doc is inconsistent on this — `core-architectural-decisions.md` lists `src/hooks/usePushSubscription.ts` while `project-structure-boundaries.md` lists `src/features/notifications/usePushSubscription.ts`). **Use `src/features/notifications/usePushSubscription.ts`** — this matches the feature-centric organization used throughout the project and keeps notification concerns together.

### Web Push API: Key Conversion Utility

The VAPID public key from `VITE_VAPID_PUBLIC_KEY` is a base64url-encoded string. The Web Push API's `pushManager.subscribe()` requires an `applicationServerKey` as a `Uint8Array`. This conversion is a standard utility:

```typescript
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
```

Include this as a private module-level function in `usePushSubscription.ts`. Do NOT import it from elsewhere — keep the file self-contained.

### Complete `usePushSubscription` Hook Implementation

```typescript
// frontend/src/features/notifications/usePushSubscription.ts
import { useState, useEffect } from 'react'
import api from '@/lib/api'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

const isPushSupported =
  typeof window !== 'undefined' &&
  'Notification' in window &&
  'serviceWorker' in navigator &&
  'PushManager' in window

async function _registerPushSubscription(): Promise<void> {
  if (!isPushSupported) return
  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
  if (!vapidPublicKey) {
    console.warn('VITE_VAPID_PUBLIC_KEY not set — skipping push subscription')
    return
  }
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    })
    const { endpoint, keys } = subscription.toJSON() as {
      endpoint: string
      keys: { p256dh: string; auth: string }
    }
    await api.post('/api/v1/push/subscribe', {
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    })
  } catch (err) {
    console.error('Push subscription registration failed:', err)
    // Do not re-throw — subscription failure must not block task saves
  }
}

export function usePushSubscription() {
  const [permissionState, setPermissionState] = useState<
    NotificationPermission | 'unsupported'
  >(isPushSupported ? Notification.permission : 'unsupported')

  useEffect(() => {
    // Silently re-register on mount if already granted (AC 4)
    if (isPushSupported && Notification.permission === 'granted') {
      _registerPushSubscription()
    }
  }, [])

  const requestAndSubscribe = async (): Promise<'granted' | 'denied' | 'unsupported'> => {
    if (!isPushSupported) return 'unsupported'

    if (Notification.permission === 'granted') {
      await _registerPushSubscription()
      return 'granted'
    }

    if (Notification.permission === 'denied') {
      setPermissionState('denied')
      return 'denied'
    }

    const result = await Notification.requestPermission()
    setPermissionState(result)
    if (result === 'granted') {
      await _registerPushSubscription()
    }
    return result as 'granted' | 'denied'
  }

  return { permissionState, requestAndSubscribe }
}
```

### ConfirmationSheet Integration Pattern

Story 2.3 added `selectedOffsets` to ConfirmationSheet's `handleSave`. Story 2.5 adds push permission before `createTask.mutateAsync`:

```tsx
// frontend/src/features/voice/ConfirmationSheet.tsx (SheetForm additions)
import { usePushSubscription } from '@/features/notifications/usePushSubscription'

function SheetForm({ onClose }: SheetFormProps) {
  // ... existing state ...
  const [notifBlocked, setNotifBlocked] = useState(false)
  const { requestAndSubscribe } = usePushSubscription()

  const handleSave = async () => {
    if (!canSave) return

    // Story 2.3: past-reminder warning (may already be here)
    // ...

    // Story 2.5: request push permission if offsets selected
    if (selectedOffsets.length > 0) {
      const permResult = await requestAndSubscribe()
      if (permResult === 'denied') {
        setNotifBlocked(true)
        // DO NOT return — task still saves (AC 3)
      }
    }

    try {
      await createTask.mutateAsync({
        name: name.trim(),
        deadline_at: deadlineUtcIso!,
        description: description.trim() || undefined,
        offsets: selectedOffsets,  // from Story 2.3
      })
      onClose()
    } catch {
      /* createTask.isError handles this */
    }
  }

  // In JSX — add after OffsetSelector:
  // {notifBlocked && (
  //   <p className="text-amber-400 text-sm mt-2">
  //     Reminders won't fire — notifications are blocked
  //   </p>
  // )}
}
```

### The `subscription.toJSON()` Shape

The `PushSubscription` object from `pushManager.subscribe()` has a `toJSON()` method that returns:
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "expirationTime": null,
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}
```

Cast to `{ endpoint: string; keys: { p256dh: string; auth: string } }` when extracting. The API accepts `{ endpoint, p256dh, auth }` (flat, not nested `keys` — see push router from Story 2.2).

### VAPID Public Key Guard

If `VITE_VAPID_PUBLIC_KEY` is empty (developer hasn't set up keys yet), `_registerPushSubscription` logs a warning and returns. It does NOT throw. This means the permission prompt will still fire (if `Notification.permission` is `'default'`), but the backend subscription call will be skipped. This is the correct behavior — the permission prompt is user-facing, the VAPID key is a backend concern.

### Service Worker Readiness

`navigator.serviceWorker.ready` returns a Promise that resolves to the active `ServiceWorkerRegistration`. `vite-plugin-pwa` with `registerType: 'autoUpdate'` (already in `vite.config.ts`) auto-registers the service worker on app load. By the time the user opens the ConfirmationSheet and taps Save, the service worker should be registered and ready.

If the service worker is not ready (e.g., first app load before SW registers), `navigator.serviceWorker.ready` will wait indefinitely. This is acceptable — the `await` in `_registerPushSubscription()` will resolve once the SW is ready. Do NOT add a timeout; the UX impact is negligible on first save.

### Notification.requestPermission() Browser Behavior

- Returns a Promise resolving to `'granted'`, `'denied'`, or `'default'`
- `'default'` means the user dismissed the prompt without a choice — treat as not-granted; do NOT call `_registerPushSubscription`
- On iOS/Safari in PWA mode: permission prompt only fires if the app is installed as a PWA. In browser tab, the prompt is blocked. This is expected — iOS push notifications require PWA installation (Epic 3 scope).

```typescript
// Handle 'default' (dismissed) alongside 'denied':
const result = await Notification.requestPermission()
setPermissionState(result)
if (result === 'granted') {
  await _registerPushSubscription()
}
return result as 'granted' | 'denied'
// Note: 'default' maps to 'denied' return type — the caller only needs
// to know if it succeeded or not; 'default' is functionally 'not granted'
```

### Files Being Modified

| File | Current State | Story 2.5 Changes |
|---|---|---|
| `frontend/src/features/voice/ConfirmationSheet.tsx` | `selectedOffsets` exists but not wired to API (Story 2.3 changes it) | ADD `usePushSubscription` call; add `notifBlocked` state + warning |
| `frontend/src/features/voice/EditSheet.tsx` | No OffsetSelector (Story 2.3 adds it) | ADD `usePushSubscription` call; add `notifBlocked` state + warning |

**New files:**
- `frontend/src/features/notifications/usePushSubscription.ts` (NEW)
- `frontend/src/features/notifications/usePushSubscription.test.ts` (NEW)

### Dependency on Stories 2.3

Story 2.5's `ConfirmationSheet` changes assume Story 2.3's `selectedOffsets` wiring is complete. If Story 2.3 is not done, `selectedOffsets` state exists but is not passed to the API — apply Story 2.3's changes together with this story.

### Dependency on Story 2.2

`POST /api/v1/push/subscribe` was implemented in Story 2.2. The API endpoint is: `POST /api/v1/push/subscribe` with body `{ endpoint: string, p256dh: string, auth: string }`. The Axios `api` instance (from `src/lib/api.ts`) handles the base URL.

### Anti-Patterns to Avoid

- ❌ Calling `requestAndSubscribe()` on every save regardless of offsets — AC 1 explicitly says prompt must NOT fire when zero offsets selected
- ❌ Blocking task save when permission is denied — AC 3 says task saves normally; only the warning shows
- ❌ Using `VITE_VAPID_PRIVATE_KEY` on the frontend — never; only `VITE_VAPID_PUBLIC_KEY`
- ❌ Calling `Notification.requestPermission()` on app open — only on first save with offsets (AC 1)
- ❌ Storing the `PushSubscription` object in state or localStorage — re-subscribe via `pushManager.subscribe()` which returns existing sub if already subscribed (idempotent)
- ❌ Checking `Notification.permission` without guarding for environments where `Notification` is undefined (SSR, old browsers) — always check `isPushSupported` first
- ❌ Passing `subscription` object directly to the API — extract `endpoint`, `p256dh`, `auth` from `subscription.toJSON().keys`

### Testing with Vitest Globals

```typescript
// frontend/src/features/notifications/usePushSubscription.test.ts
import { renderHook, act } from '@testing-library/react'
import { usePushSubscription } from './usePushSubscription'

beforeEach(() => {
  // Reset Notification mock
  vi.stubGlobal('Notification', {
    permission: 'default',
    requestPermission: vi.fn().mockResolvedValue('granted'),
  })
  vi.stubGlobal('navigator', {
    serviceWorker: {
      ready: Promise.resolve({
        pushManager: {
          subscribe: vi.fn().mockResolvedValue({
            toJSON: () => ({
              endpoint: 'https://fcm.example.com/send/abc',
              keys: { p256dh: 'p256dh_key', auth: 'auth_key' },
            }),
          }),
        },
      }),
    },
  })
})

it('returns unsupported when Notification is not available', async () => {
  vi.stubGlobal('Notification', undefined)
  const { result } = renderHook(() => usePushSubscription())
  let res: string
  await act(async () => {
    res = await result.current.requestAndSubscribe()
  })
  expect(res!).toBe('unsupported')
})

it('returns denied without prompting when permission is already denied', async () => {
  vi.stubGlobal('Notification', { permission: 'denied' })
  const { result } = renderHook(() => usePushSubscription())
  let res: string
  await act(async () => {
    res = await result.current.requestAndSubscribe()
  })
  expect(res!).toBe('denied')
  expect(Notification.requestPermission).not.toHaveBeenCalled()
})
```

### References

- Epic requirements: [epic-2-push-notifications-reminders.md](../planning-artifacts/epics/epic-2-push-notifications-reminders.md) — Story 2.5 section
- Architecture: [core-architectural-decisions.md](../planning-artifacts/architecture/core-architectural-decisions.md) — Frontend Architecture
- Project structure: [project-structure-boundaries.md](../planning-artifacts/architecture/project-structure-boundaries.md) — `features/notifications/`
- Push router (Story 2.2): [2-2-push-subscription-vapid-backend.md](2-2-push-subscription-vapid-backend.md) — `POST /api/v1/push/subscribe`
- Previous story (2-4): [2-4-notification-scheduling-on-task-mutations.md](2-4-notification-scheduling-on-task-mutations.md)
- VAPID public key env: `frontend/.env` — `VITE_VAPID_PUBLIC_KEY`
- API client: `frontend/src/lib/api.ts`
- vite-plugin-pwa config: `frontend/vite.config.ts` — `VitePWA({ registerType: 'autoUpdate' })`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

Ultimate context engine analysis completed — comprehensive developer guide created.

Implementation complete (2026-05-25):
- Created `usePushSubscription.ts` with `checkPushSupported()` as a lazy function (not module-level const) to allow test mocking via `vi.stubGlobal`
- `requestAndSubscribe()` handles all three permission states: unsupported, denied (immediate return), default (calls requestPermission), granted (skip prompt, re-register)
- `useEffect` on mount silently re-registers push subscription if already granted (AC 4)
- `_registerPushSubscription()` catches all errors and logs — never throws (AC 3: task saves even if subscription fails)
- VAPID key guard: warns and returns if `VITE_VAPID_PUBLIC_KEY` is not set
- ConfirmationSheet and EditSheet both call `requestAndSubscribe()` only when `selectedOffsets.length > 0` (AC 1)
- `notifBlocked` warning shows inline but does NOT block task save (AC 3)
- 6 tests in usePushSubscription.test.ts; all 19 frontend tests pass; lint clean; 36 backend tests still pass

### File List

- `frontend/src/features/notifications/usePushSubscription.ts` — NEW: push permission + VAPID subscription hook with `requestAndSubscribe`, `permissionState`, silent re-register on mount, `urlBase64ToUint8Array` helper, VAPID key guard
- `frontend/src/features/notifications/usePushSubscription.test.ts` — NEW: 6 unit tests covering unsupported, denied, default permission flow, permissionState init, and silent mount re-registration
- `frontend/src/features/voice/ConfirmationSheet.tsx` — Added `usePushSubscription` import, `notifBlocked` state, `requestAndSubscribe` call in `handleSave` when offsets selected, `notifBlocked` warning JSX
- `frontend/src/features/voice/EditSheet.tsx` — Same additions as ConfirmationSheet

### Change Log

- 2026-05-25: Story created — usePushSubscription hook + ConfirmationSheet/EditSheet push permission wiring.
- 2026-05-25: Story implemented — created usePushSubscription hook with lazy support check (checkPushSupported), wired into ConfirmationSheet and EditSheet, 6 new tests passing. All 19 frontend tests pass, lint clean.

### Review Findings

- [x] [Review][Decision] `requestAndSubscribe` re-POSTs subscription on every save — dismissed, backend upserts by endpoint (verified)
- [x] [Review][Patch] `hasPastWarning` not cleared at start of `handleSave` — fixed: added `setHasPastWarning(false)` alongside `setNotifBlocked(false)` [frontend/src/features/voice/ConfirmationSheet.tsx, EditSheet.tsx]
- [x] [Review][Patch] `subscription.toJSON().keys` not null-guarded — fixed: optional chaining + early return if keys missing [frontend/src/features/notifications/usePushSubscription.ts]
- [x] [Review][Defer] Double-tap Save race — two concurrent `requestPermission()` calls possible before isPending gates the button; browser behaviour for concurrent prompts is undefined — deferred, pre-existing
