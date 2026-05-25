# Story 2.7: Notification Deep-Link

Status: ready-for-dev

## Story

As a user,
I want tapping a notification to open the app directly on the relevant task,
so that I can act on it immediately without searching through the task list.

## Acceptance Criteria

1. **Given** a push notification is showing on my device
   **When** I tap it
   **Then** the app opens (or focuses if already open) and navigates to `/tasks/:taskId` for the task referenced in the notification payload

2. **Given** the app is closed when the notification is tapped
   **When** the app launches
   **Then** React Router resolves `/tasks/:taskId` and renders the TaskDetail view for that task
   **And** `useDeepLink.ts` in `src/hooks/` handles the `notificationclick` event and posts a message to the app to trigger navigation

3. **Given** the app is open on the task list when the notification is tapped
   **When** the navigation fires
   **Then** the app slides to the TaskDetail view for the correct task without a full reload

4. **Given** the task referenced in the notification has been deleted
   **When** the deep-link resolves
   **Then** the API returns 404; the app shows an inline message "This task no longer exists" and returns to the task list

## Tasks / Subtasks

- [ ] Task 1: Implement `notificationclick` handler in `service-worker.ts` (AC: 1, 2, 3)
  - [ ] In `frontend/src/service-worker.ts`, replace the stub `notificationclick` handler with the full implementation (see Dev Notes)
  - [ ] The handler must: close the notification; get the `task_id` from `event.notification.data`; find or open the app window; then post a message `{ type: 'NAVIGATE_TO_TASK', taskId }` to the app window
  - [ ] Use `clients.matchAll({ type: 'window', includeUncontrolled: true })` to find open app windows
  - [ ] If an app window is found: call `windowClient.focus()` and `windowClient.postMessage(...)` — this handles AC 3 (app already open)
  - [ ] If no app window is found: call `clients.openWindow('/')` to launch the app — React Router will start at `/`; the `useDeepLink` hook will handle navigation after the SW message is received

- [ ] Task 2: Create `frontend/src/hooks/useDeepLink.ts` (AC: 2, 3)
  - [ ] Create the `src/hooks/` directory (new) and `useDeepLink.ts` file
  - [ ] Hook: `export function useDeepLink()` — takes no arguments, returns nothing
  - [ ] In a `useEffect`, register a `message` event listener on `navigator.serviceWorker` (via `navigator.serviceWorker.addEventListener('message', handler)`)
  - [ ] Handler: if `event.data?.type === 'NAVIGATE_TO_TASK'`, call `navigate(`/tasks/${event.data.taskId}`)` using React Router's `useNavigate()`
  - [ ] Clean up listener in `useEffect` return: `navigator.serviceWorker.removeEventListener('message', handler)`
  - [ ] Guard: only register if `'serviceWorker' in navigator`

- [ ] Task 3: Mount `useDeepLink` in the app (AC: 2, 3)
  - [ ] In `frontend/src/features/tasks/TaskList.tsx` (the home screen rendered at `/`), call `useDeepLink()` at the top of the component
  - [ ] This ensures deep-link navigation is always active when the app is open — not just on one route
  - [ ] Import from `@/hooks/useDeepLink`

- [ ] Task 4: Update `TaskDetail` 404 error state to show specific message for deep-link context (AC: 4)
  - [ ] In `frontend/src/features/tasks/TaskDetail.tsx`, update the `isError` error state message from `"Task not found."` to `"This task no longer exists"`
  - [ ] Also update the back button to navigate to `'/'` instead of `navigate(-1)` — when arriving via deep-link, history may be empty and `navigate(-1)` leaves the app
  - [ ] Keep the isNaN(id) guard message as `"Task not found."` — that's a malformed URL, not a deleted task

- [ ] Task 5: Frontend tests (AC: 2, 3, 4)
  - [ ] Create `frontend/src/hooks/useDeepLink.test.ts`
  - [ ] Test: `useDeepLink` registers `message` event listener on mount
  - [ ] Test: `useDeepLink` removes listener on unmount (cleanup)
  - [ ] Test: receiving `{ type: 'NAVIGATE_TO_TASK', taskId: '42' }` message triggers `navigate('/tasks/42')`
  - [ ] Test: message with unknown `type` does NOT trigger navigation
  - [ ] Mock `navigator.serviceWorker` via `vi.stubGlobal`

- [ ] Task 6: Run all tests and verify (AC: 1–4)
  - [ ] `cd frontend && npm test -- --run` — all tests pass
  - [ ] `cd frontend && npm run build` — build succeeds (service worker includes updated notificationclick handler)

## Dev Notes

### Deep-Link Architecture: Service Worker → App Communication

The notification deep-link flow uses a **Service Worker → Window postMessage** channel:

```
User taps notification
  → SW notificationclick fires
  → SW: close notification, find/open app window
  → SW: postMessage({ type: 'NAVIGATE_TO_TASK', taskId }) to app window
  → App: navigator.serviceWorker 'message' event fires
  → useDeepLink hook: navigate('/tasks/:taskId')
```

Why not navigate directly from the service worker? Service workers don't have access to React Router. They can only open URLs (`clients.openWindow`) or post messages to windows. The app handles its own routing.

Why not use `clients.openWindow('/tasks/42')` directly? This works when the app is closed (React Router handles the URL). But when the app is **already open**, `clients.openWindow` opens a **new tab**, which is wrong (AC 3 requires no full reload). The hybrid approach — post message to existing window OR open new window at `/` — handles both cases correctly.

### Complete `notificationclick` Handler for `service-worker.ts`

Replace the existing stub with:

```typescript
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const taskId = event.notification.data?.task_id

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      if (windowClients.length > 0) {
        // App is already open — focus it and post navigation message
        const appWindow = windowClients[0]
        appWindow.postMessage({ type: 'NAVIGATE_TO_TASK', taskId })
        return appWindow.focus()
      } else {
        // App is closed — open it at root; useDeepLink will handle navigation
        // via the SW 'message' event after the page loads
        return clients.openWindow('/').then((newWindow) => {
          // Brief delay to let React hydrate before posting the message
          setTimeout(() => {
            newWindow?.postMessage({ type: 'NAVIGATE_TO_TASK', taskId })
          }, 500)
        })
      }
    })
  )
})
```

**Note on `clients.openWindow('/')` + delayed postMessage:** When the app was closed, opening it at `/` starts React and the SW listener registers after hydration. A small delay (500ms) gives the app time to mount `useDeepLink` before the message arrives. This is a known pattern for SW → new window communication. Alternatively, `useDeepLink` could check `sessionStorage` for a pending navigation on mount, but the delayed postMessage is simpler and sufficient for a single-user PWA.

### Complete `useDeepLink.ts` Hook

```typescript
// frontend/src/hooks/useDeepLink.ts
import { useEffect } from 'react'
import { useNavigate } from 'react-router'

export function useDeepLink() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'NAVIGATE_TO_TASK') {
        navigate(`/tasks/${event.data.taskId}`)
      }
    }

    navigator.serviceWorker.addEventListener('message', handler)
    return () => {
      navigator.serviceWorker.removeEventListener('message', handler)
    }
  }, [navigate])
}
```

`navigate` is stable from React Router's `useNavigate()` — the `useEffect` dependency array including it is correct and won't cause re-registrations.

### Mounting `useDeepLink` in `TaskList`

```tsx
// frontend/src/features/tasks/TaskList.tsx (addition at top of component)
import { useDeepLink } from '@/hooks/useDeepLink'

export default function TaskList() {
  useDeepLink()  // ADD THIS LINE — handles SW messages for notification deep-links
  // ... rest of component unchanged
}
```

`TaskList` is rendered at `/` and is the home screen. It is the right place to mount this hook because:
1. The app always starts at `/` when launched from a notification (via `clients.openWindow('/')`)
2. The hook is active whenever the user is on the home screen — the most common app state

Do NOT mount `useDeepLink` in `main.tsx` — hooks cannot be called outside React component trees.

### `TaskDetail` 404 Update

Current `TaskDetail` error state:
```tsx
// Current (line ~51-66)
if (isError || !task) {
  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <p className="text-red-400 text-sm mb-4">Task not found.</p>
        <button onClick={() => navigate(-1)}>← Back to tasks</button>
      </div>
    </div>
  )
}
```

Updated (AC 4):
```tsx
if (isError || !task) {
  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <p className="text-red-400 text-sm mb-4">This task no longer exists</p>
        <button
          type="button"
          onClick={() => navigate('/')}    // navigate('/') not navigate(-1) — deep-link has no history
          className="text-violet-400 text-sm focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 rounded"
        >
          ← Back to tasks
        </button>
      </div>
    </div>
  )
}
```

**Why `navigate('/')` not `navigate(-1)`:** When arriving via notification deep-link, the browser history is empty (the user just opened the app). `navigate(-1)` would navigate outside the SPA to whatever was open before (or do nothing). `navigate('/')` is always safe.

**Note:** The `isNaN(id)` guard at the top of `TaskDetail` (line ~22-37) keeps "Task not found." — that message is for malformed task IDs in the URL, not deleted tasks. Only the `isError || !task` block needs updating.

### Files Being Modified

| File | Current State | Story 2.7 Changes |
|---|---|---|
| `frontend/src/service-worker.ts` | `notificationclick` stub: just closes notification (Story 2.6) | REPLACE stub with full open/focus + postMessage implementation |
| `frontend/src/features/tasks/TaskList.tsx` | Renders task list; no deep-link awareness | ADD `useDeepLink()` call at top of component |
| `frontend/src/features/tasks/TaskDetail.tsx` | `isError` shows "Task not found." with `navigate(-1)` | UPDATE message to "This task no longer exists" + `navigate('/')` |

**New files:**
- `frontend/src/hooks/useDeepLink.ts` (NEW — also creates the `src/hooks/` directory)
- `frontend/src/hooks/useDeepLink.test.ts` (NEW)

### Dependencies on Story 2.6

Story 2.7 modifies `service-worker.ts` which is **created** in Story 2.6. If Story 2.6 is not yet done, the dev agent must create `service-worker.ts` with BOTH the `push` event handler (from Story 2.6) and the full `notificationclick` handler (from Story 2.7) in one pass.

The Story 2.6 `service-worker.ts` outline:
```typescript
/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'
declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<...> }
precacheAndRoute(self.__WB_MANIFEST)

// push handler (Story 2.6)
self.addEventListener('push', ...)

// notificationclick handler (Story 2.7 — replace stub if already exists)
self.addEventListener('notificationclick', ...)
```

### Anti-Patterns to Avoid

- ❌ Calling `clients.openWindow('/tasks/42')` for all cases — opens a new tab when app is already open (AC 3 violation)
- ❌ Mounting `useDeepLink` in `main.tsx` outside a component — hooks must be called inside React components
- ❌ Using `navigate(-1)` in `TaskDetail` 404 error state — breaks when arriving via deep-link with empty history
- ❌ Registering the `message` listener on `window` instead of `navigator.serviceWorker` — SW messages fire on `navigator.serviceWorker`, not `window`
- ❌ Not cleaning up the message listener in `useDeepLink`'s `useEffect` — causes navigation to fire multiple times if the component remounts
- ❌ Passing `taskId` as a number in the postMessage — keep it as the string from `event.notification.data.task_id` (as set in Story 2.6's payload `"task_id": str(task.id)`)

### References

- Epic requirements: [epic-2-push-notifications-reminders.md](../planning-artifacts/epics/epic-2-push-notifications-reminders.md) — Story 2.7 section
- Architecture: [core-architectural-decisions.md](../planning-artifacts/architecture/core-architectural-decisions.md) — `hooks/useDeepLink.ts`, React Router v7
- Project structure: [project-structure-boundaries.md](../planning-artifacts/architecture/project-structure-boundaries.md) — `hooks/useDeepLink.ts`, `service-worker.ts`
- Story 2.6 (push event handler, SW creation): [2-6-notification-delivery-content.md](2-6-notification-delivery-content.md)
- TaskDetail (existing 404 handling): `frontend/src/features/tasks/TaskDetail.tsx`
- Router (existing routes): `frontend/src/router.tsx`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

Ultimate context engine analysis completed — comprehensive developer guide created.

### File List

### Change Log

- 2026-05-25: Story created — notificationclick SW handler + useDeepLink hook + TaskDetail 404 update.
