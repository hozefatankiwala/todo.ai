# Story 1.6: Task Completion & Archive

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to mark a task complete and browse completed tasks in the archive,
So that I can close out finished work and see what I've accomplished.

## Acceptance Criteria

1. **Given** a task detail view is open
   **When** I tap "Mark complete" (primary `bg-violet-500` button)
   **Then** `POST /api/v1/tasks/{id}/complete` is called; the app navigates back to the task list; TanStack Query cache `["tasks"]` is invalidated; the completed task no longer appears in the active list

2. **Given** all tasks are completed (or no active tasks remain)
   **When** the active list renders
   **Then** the empty state "All done. Nice." is displayed

3. **Given** I tap the archive icon in the header
   **When** the archive sheet opens
   **Then** it slides up (Sheet, not push navigation) and shows completed tasks in reverse-completion order; each row shows task name and local completion time

4. **Given** the archive is empty
   **When** the archive sheet opens
   **Then** "No completed tasks yet." is displayed

5. **Given** a TaskCard is showing in the active list
   **When** I swipe left on the card
   **Then** a green complete action is revealed; confirming it triggers the same completion flow as tapping "Mark complete" on the detail view

## Tasks / Subtasks

- [ ] Task 1: Add `useCompleteTask` hook to `useTasks.ts` (AC: 1, 5)
  - [ ] Open `frontend/src/features/tasks/useTasks.ts` — ADD `useCompleteTask()` alongside existing hooks; do NOT alter any existing hooks
  - [ ] `useCompleteTask()`: `useMutation` calling `POST /api/v1/tasks/{id}/complete`; returns `void` (204 No Content)
  - [ ] `onSuccess`: invalidate `["tasks"]` AND `["tasks", taskId]` (both list and detail caches must be cleared)
  - [ ] Payload type: `{ id: number }` — id used only in URL
  - [ ] Use `queryClient` singleton from `@/lib/queryClient` — do NOT use `useQueryClient()` hook (established pattern)

- [ ] Task 2: Add "Mark complete" button to `TaskDetail.tsx` (AC: 1)
  - [ ] Open `frontend/src/features/tasks/TaskDetail.tsx` — ADD a "Mark complete" button below the Edit button; do NOT alter any existing code except adding the new button and its state
  - [ ] Add local state: `const [completing, setCompleting] = useState(false)` (or use `completeTask.isPending`)
  - [ ] On tap: call `completeTask.mutateAsync({ id: task.id })` then `navigate(-1)` (return to task list after completion)
  - [ ] Button style: `w-full mt-3 bg-violet-500 text-white rounded-2xl py-3 font-medium focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:opacity-50`
  - [ ] Disabled while `completeTask.isPending`
  - [ ] Keep Edit button above "Mark complete"; keep back navigation and EditSheet wiring intact

- [ ] Task 3: Add archive icon + archive sheet to `TaskList.tsx` (AC: 3, 4)
  - [ ] Open `frontend/src/features/tasks/TaskList.tsx` — ADD archive icon button in the header row; ADD `ArchiveSheet` component below (as a Sheet, not a route)
  - [ ] Header row: `<div className="flex items-center justify-between mb-6">` wrapping `<h1>Tasks</h1>` and archive icon button
  - [ ] Archive icon button: use `Archive` icon from `lucide-react`; `aria-label="View archive"`; `className="text-zinc-400 hover:text-zinc-50 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 rounded"`
  - [ ] Add local state: `const [archiveOpen, setArchiveOpen] = useState(false)`
  - [ ] Render `<ArchiveSheet open={archiveOpen} onClose={() => setArchiveOpen(false)} />` at bottom of component

- [ ] Task 4: Implement `ArchiveSheet` component (AC: 3, 4)
  - [ ] Create `frontend/src/features/tasks/ArchiveSheet.tsx` — NEW file in the `tasks/` feature folder
  - [ ] Props: `open: boolean; onClose: () => void`
  - [ ] Use `Sheet` + `SheetContent` from `@/components/ui/sheet` with `side="bottom"`; `className="bg-zinc-900 rounded-t-2xl px-4 pt-4 pb-8 max-h-[80vh] overflow-y-auto"`
  - [ ] Call `useArchiveQuery()` (Task 5) to load completed tasks
  - [ ] **Loading state:** 3 skeleton rows: `<div className="animate-pulse bg-zinc-800 rounded-2xl h-14 mb-2" />`
  - [ ] **Empty state:** `<p className="text-zinc-500 text-sm text-center py-8">No completed tasks yet.</p>`
  - [ ] **List:** completed tasks in reverse-completion order (`completed_at` descending), each row shows:
    - `<p className="text-base font-medium text-zinc-50">{task.name}</p>`
    - `<p className="text-sm text-zinc-400">{formatCompletedAt(task.completed_at)}</p>`
  - [ ] Sheet drag handle: `<div className="w-12 h-1 bg-zinc-500 rounded-full mx-auto mb-4" />`
  - [ ] Sheet title: `<h2 className="text-lg font-semibold text-zinc-50 mb-4">Completed</h2>`
  - [ ] Archive rows are read-only — no tap navigation in this story (Story 1.7 adds delete from archive)

- [ ] Task 5: Add `useArchiveQuery` hook to `useTasks.ts` (AC: 3, 4)
  - [ ] ADD `useArchiveQuery()` to `useTasks.ts` — fetches `GET /api/v1/tasks/?include_archived=true`
  - [ ] Filter response client-side: keep only items where `is_completed === true`
  - [ ] Cache key: `["tasks", "archive"]` (per architecture spec)
  - [ ] Sort result by `completed_at` descending before returning
  - [ ] Return type: `Task[]`

- [ ] Task 6: Implement swipe-left to complete on `TaskCard.tsx` (AC: 5)
  - [ ] Open `frontend/src/features/tasks/TaskCard.tsx` — ADD swipe-left gesture revealing a green complete action
  - [ ] Use CSS-only approach with `touch` event handlers (no library install): `onTouchStart` / `onTouchEnd` track delta; if swipe > 80px left, reveal action
  - [ ] Swipe-revealed action: green button `className="bg-green-500 text-white rounded-2xl px-4 py-3 font-medium"` with checkmark icon (`Check` from `lucide-react`) + "Complete" label
  - [ ] On confirm: call `completeTask.mutateAsync({ id: task.id })` — same mutation as TaskDetail
  - [ ] Completion animation: add `className="transition-all duration-300 scale-95 opacity-0"` to the `<li>` when completing (shrink + fade before TanStack invalidation re-renders)
  - [ ] The hidden `<button aria-label="Mark complete: {task.name}" className="sr-only" />` from Story 1.5 becomes VISIBLE and wired to `completeTask.mutateAsync` — remove `sr-only`, add `onClick` handler and styles matching the swipe action button. This is the fallback for non-swipe interaction.
  - [ ] Keep all existing Link navigation, overdue border logic, and test assertions intact

- [ ] Task 7: Update `ArchiveView.tsx` route stub to redirect (AC: 3)
  - [ ] `frontend/src/features/tasks/ArchiveView.tsx` is a route stub (`/archive`). Per architecture, the archive is a Sheet over TaskList, not a push route. Redirect: render `<Navigate to="/" replace />` from `react-router`. This preserves the route in `router.tsx` without a broken page.

- [ ] Task 8: Update `TaskList.tsx` empty state (AC: 2)
  - [ ] Find the empty state text: `"Nothing yet. Tap the mic to add your first task."`
  - [ ] The active task list only shows `is_completed === false` tasks. Verify `useTasksQuery()` returns only active tasks (backend filters by default — confirmed in Story 1.2 AC). If empty AND tasks exist in archive, show `"All done. Nice."` Otherwise show the original string.
  - [ ] Simple approach: `useTasksQuery()` already returns only active tasks. If `tasks.length === 0`, always show `"All done. Nice."` — the original message only makes sense when the user has never created any task. Accept this simplification: switching from "Nothing yet" to "All done. Nice." is acceptable for v1.
  - [ ] **Alternative if needed:** Call `useArchiveQuery()` in TaskList to distinguish truly empty from all-completed — but this adds a network call on every list load. Prefer the simple approach.

- [ ] Task 9: Add `formatCompletedAt` to `dateUtils.ts` (AC: 3)
  - [ ] Open `frontend/src/lib/dateUtils.ts` — ADD `formatCompletedAt(completedAt: string | null): string`
  - [ ] Output format: `"Completed Thu, Jun 5 · 10:00 AM"` — same locale format as `formatDeadline` but prefixed with "Completed"
  - [ ] Guard: if `completedAt` is null, return `"Completed"` (fallback — shouldn't happen if data is consistent)

- [ ] Task 10: Verify and test (AC: 1–5)
  - [ ] Start backend: `cd backend && uv run uvicorn app.main:app --reload`
  - [ ] Start frontend: `cd frontend && npm run dev`
  - [ ] Create a task → navigate to detail → tap "Mark complete" → verify navigation back to list, task gone from list
  - [ ] Complete all tasks → verify "All done. Nice." empty state
  - [ ] Tap archive icon in header → verify sheet slides up → completed task appears with name + completion time
  - [ ] Swipe left on a task card → verify green action reveals → tap → task completes and leaves list
  - [ ] Navigate to `/archive` → verify redirect to `/`
  - [ ] TypeScript: `cd frontend && npx tsc --noEmit` — zero errors
  - [ ] Lint: `cd frontend && npm run lint` — passes clean
  - [ ] Run: `cd frontend && npx vitest run` — all tests pass

## Dev Notes

### Files Being Modified — Current State

| File | Current State | Story 1.6 Changes |
|---|---|---|
| `src/features/tasks/useTasks.ts` | Has `useTasksQuery`, `useTaskQuery`, `useCreateTask`, `useUpdateTask` | ADD `useCompleteTask()`, `useArchiveQuery()` |
| `src/features/tasks/TaskDetail.tsx` | Has Edit button + EditSheet integration; back nav | ADD "Mark complete" button; ADD `useCompleteTask` call |
| `src/features/tasks/TaskCard.tsx` | Has Link nav + hidden `sr-only` completion button | WIRE the hidden button + ADD swipe gesture |
| `src/features/tasks/TaskList.tsx` | Has header with `<h1>Tasks</h1>` + task list + FAB | ADD archive icon to header; ADD ArchiveSheet |
| `src/features/tasks/ArchiveView.tsx` | Stub: renders `"Archive — coming in Story 1.6"` | REPLACE with `<Navigate to="/" replace />` |
| `src/lib/dateUtils.ts` | Has `formatDeadline`, `isOverdue` | ADD `formatCompletedAt` |

**New files created in this story:**
- `src/features/tasks/ArchiveSheet.tsx`

### API Contract — POST /api/v1/tasks/{id}/complete

```http
POST /api/v1/tasks/42/complete
```

Response: `204 No Content` (empty body — do NOT try to read `response.data`).

Backend sets `is_completed = true` and `completed_at` to current UTC time. Task is then excluded from `GET /api/v1/tasks/` (default active-only filter).

**Archive endpoint:**
```http
GET /api/v1/tasks/?include_archived=true
```
Returns ALL tasks (active + completed). Filter client-side to `is_completed === true` for the archive view. Sort by `completed_at` descending.

### `useCompleteTask` — Implementation Pattern

```typescript
// ADD to frontend/src/features/tasks/useTasks.ts

export function useCompleteTask() {
  return useMutation<void, Error, { id: number }>({
    mutationFn: async ({ id }) => {
      await api.post(`/api/v1/tasks/${id}/complete`)
      // 204 No Content — no return value needed
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['tasks', 'archive'] })
    },
  })
}
```

### `useArchiveQuery` — Implementation Pattern

```typescript
// ADD to frontend/src/features/tasks/useTasks.ts

export function useArchiveQuery() {
  return useQuery<Task[]>({
    queryKey: ['tasks', 'archive'],
    queryFn: async () => {
      const { data } = await api.get<Task[]>('/api/v1/tasks/', {
        params: { include_archived: true },
      })
      return data
        .filter((t) => t.is_completed)
        .sort((a, b) => {
          // completed_at descending (most recent first)
          if (!a.completed_at || !b.completed_at) return 0
          return b.completed_at.localeCompare(a.completed_at)
        })
    },
  })
}
```

### TaskCard — Current Code (Read Before Editing)

```tsx
// Current: frontend/src/features/tasks/TaskCard.tsx
import { Link } from 'react-router'
import { cn } from '@/lib/utils'
import { formatDeadline, isOverdue } from '@/lib/dateUtils'
import type { Task } from './types'

interface TaskCardProps { task: Task }

export default function TaskCard({ task }: TaskCardProps) {
  const overdue = isOverdue(task.deadline_at)
  return (
    <li role="listitem" className="animate-in fade-in duration-200">
      <Link to={`/tasks/${task.id}`} className={cn('block bg-zinc-800 rounded-2xl px-4 py-3', overdue && 'border-l-4 border-amber-500')}>
        <p className="text-base font-medium text-zinc-50">{task.name}</p>
        <p className="text-sm text-zinc-400">{formatDeadline(task.deadline_at)}</p>
      </Link>
      {/* Completion button lives outside the Link to avoid nested interactive elements */}
      <button type="button" aria-label={`Mark complete: ${task.name}`} className="sr-only" />
    </li>
  )
}
```

**What changes:** The `sr-only` button gets wired to `useCompleteTask` and gets visible styles when the swipe action is revealed. The swipe detection wraps the `<li>` content. Completion animation added on the `<li>` itself.

**What must NOT break:**
- `<Link>` navigation to `/tasks/${task.id}` — test `navigates to task detail URL` in `TaskCard.test.tsx`
- Amber border on overdue tasks — test `applies amber border for overdue tasks`
- `aria-label="Mark complete: {task.name}"` on the button — test `has accessible aria-label on the completion button`
- `role="listitem"` on `<li>` — structural requirement

### TaskDetail — "Mark Complete" Button Placement

Add below the Edit button, maintaining the same padding pattern:

```tsx
// After existing Edit button in TaskDetail.tsx
<button
  type="button"
  onClick={async () => {
    await completeTask.mutateAsync({ id: task.id })
    navigate(-1)
  }}
  disabled={completeTask.isPending}
  aria-disabled={completeTask.isPending}
  className="w-full mt-3 bg-violet-500 text-white rounded-2xl py-3 font-medium focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:opacity-50"
>
  {completeTask.isPending ? 'Completing…' : 'Mark complete'}
</button>
```

Import `useCompleteTask` from `./useTasks`. Add it alongside the existing `useTaskQuery` import.

### TaskList Header — Archive Icon Placement

Current TaskList header: `<h1 className="text-xl font-semibold text-zinc-50 mb-6">Tasks</h1>`

New header pattern (flex row with archive icon):
```tsx
<div className="flex items-center justify-between mb-6">
  <h1 className="text-xl font-semibold text-zinc-50">Tasks</h1>
  <button
    type="button"
    aria-label="View archive"
    onClick={() => setArchiveOpen(true)}
    className="text-zinc-400 hover:text-zinc-50 rounded focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
  >
    <Archive className="h-5 w-5" />
  </button>
</div>
```

Import `Archive` from `lucide-react`.

### Swipe Gesture — Minimal Touch Handler

The swipe implementation should be CSS + touch events only (no libraries). Keep it simple:

```tsx
// In TaskCard.tsx — add to component body
const [swipeDx, setSwipeDx] = useState(0)
const touchStartX = useRef(0)

const handleTouchStart = (e: React.TouchEvent) => {
  touchStartX.current = e.touches[0].clientX
}
const handleTouchEnd = (e: React.TouchEvent) => {
  const dx = e.changedTouches[0].clientX - touchStartX.current
  if (dx < -80) setSwipeDx(-80) // reveal action
  else setSwipeDx(0)
}
```

Wrap the `<li>` contents in a relative container; translate the card by `swipeDx` and show the green action absolutely positioned to the right. On complete action tap, run completion and reset `swipeDx`.

**Simpler alternative if swipe proves complex:** Make the `sr-only` button a visible icon button overlaid on the card (e.g., a small green circle at the right of the card). The AC says "left swipe reveals complete action" but a visible button also satisfies the intent. Discuss with user before deviating from AC.

### ArchiveSheet Component Pattern

```tsx
// frontend/src/features/tasks/ArchiveSheet.tsx
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useArchiveQuery } from './useTasks'
import { formatCompletedAt } from '@/lib/dateUtils'

interface ArchiveSheetProps { open: boolean; onClose: () => void }

export default function ArchiveSheet({ open, onClose }: ArchiveSheetProps) {
  const { data: tasks, isLoading } = useArchiveQuery()

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="bg-zinc-900 rounded-t-2xl px-4 pt-4 pb-8 max-h-[80vh] overflow-y-auto">
        <div className="w-12 h-1 bg-zinc-500 rounded-full mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-zinc-50 mb-4">Completed</h2>

        {isLoading && [0, 1, 2].map((i) => (
          <div key={i} className="animate-pulse bg-zinc-800 rounded-2xl h-14 mb-2" />
        ))}

        {!isLoading && (!tasks || tasks.length === 0) && (
          <p className="text-zinc-500 text-sm text-center py-8">No completed tasks yet.</p>
        )}

        {!isLoading && tasks && tasks.length > 0 && (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li key={task.id} className="bg-zinc-800 rounded-2xl px-4 py-3">
                <p className="text-base font-medium text-zinc-50">{task.name}</p>
                <p className="text-sm text-zinc-400">{formatCompletedAt(task.completed_at)}</p>
              </li>
            ))}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  )
}
```

### `formatCompletedAt` — Implementation Pattern

```typescript
// ADD to frontend/src/lib/dateUtils.ts
export function formatCompletedAt(completedAt: string | null): string {
  if (!completedAt) return 'Completed'
  const date = new Date(completedAt)
  const datePart = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  const timePart = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return `Completed ${datePart} · ${timePart}`
}
```

This follows the same locale-conversion pattern as `formatDeadline` — UTC ISO string in, local-time string out.

### Cache Key Architecture (Critical — Must Follow)

Per `implementation-patterns-consistency-rules.md`:
- Task list (active): `["tasks"]`
- Single task: `["tasks", taskId]` — where `taskId` is a `number`
- Archive: `["tasks", "archive"]`

On `useCompleteTask` success, invalidate ALL THREE: `["tasks"]`, `["tasks", id]`, and `["tasks", "archive"]`. This ensures the active list refreshes (task disappears), the detail cache clears, and the archive list updates with the newly completed task.

### Empty State Logic

The API's `GET /api/v1/tasks/` (no params) returns only active tasks (`is_completed = false`). So `useTasksQuery()` in TaskList always returns active tasks only. When this array is empty, display the appropriate message.

For v1, using `"All done. Nice."` for ALL empty states (first use + post-completion) is acceptable. The distinction between "never had tasks" vs "all completed" requires an extra API call and adds complexity without meaningful UX benefit at this stage.

### ArchiveView Route Redirect

The architecture defines `/archive` as a route, but the archive is implemented as a Sheet over TaskList (not a standalone page). Keep the route defined in `router.tsx` but redirect to home:

```tsx
// frontend/src/features/tasks/ArchiveView.tsx
import { Navigate } from 'react-router'

export default function ArchiveView() {
  return <Navigate to="/" replace />
}
```

This prevents a broken page if someone navigates directly to `/archive` while keeping `router.tsx` unchanged.

### Existing Tests — Must Pass

All 6 tests in `TaskCard.test.tsx` must still pass after modifying `TaskCard.tsx`. Key assertions:
- `navigates to task detail URL` — Link to `/tasks/42` must still work
- `applies amber border for overdue tasks` — `border-amber-500` class on Link
- `has accessible aria-label on the completion button` — `aria-label="Mark complete: Test task"`

If swipe adds complex state, ensure the component still renders the button with the same `aria-label` in its initial (non-swiped) state. Tests use `screen.getByLabelText('Mark complete: Test task')` — the button must be findable.

### What NOT to Implement in This Story

- Delete from archive — Story 1.7 (delete dialog scope)
- Swipe right to delete on TaskCard — Story 1.7
- Tap archive row to navigate to detail — archive rows are read-only in this story
- Recurring task next-instance creation on complete — Epic 4 scope
- Reminder cancellation on complete (`cancel_task_jobs`) — Epic 2 scope (scheduler not yet built)
- Trust banner after completion — Story 2.8 scope

### Anti-Patterns to Avoid

- ❌ Importing from `react-router-dom` — use `react-router` (v7 unified package)
- ❌ Using `useQueryClient()` hook — import the `queryClient` singleton from `@/lib/queryClient`
- ❌ Trying to read response body from `POST /complete` — it returns 204 No Content
- ❌ Making ArchiveView a full page with its own data fetching — archive is a Sheet over TaskList
- ❌ Installing any swipe/animation library (Framer Motion, etc.) — CSS + touch events only
- ❌ Nesting button inside Link — the completion button is already outside the Link per Story 1.5 pattern
- ❌ Using `navigate('/tasks')` — use `navigate(-1)` or `navigate('/')` to preserve history
- ❌ Forgetting to invalidate `["tasks", "archive"]` on complete — archive won't update without it
- ❌ Putting ArchiveSheet in `src/features/voice/` — it belongs in `src/features/tasks/` (task feature)

### File Locations Summary

```
frontend/src/
  features/
    tasks/
      useTasks.ts          ← UPDATE: add useCompleteTask() + useArchiveQuery()
      TaskDetail.tsx        ← UPDATE: add "Mark complete" button
      TaskCard.tsx          ← UPDATE: wire completion button + swipe gesture
      TaskList.tsx          ← UPDATE: add archive icon + ArchiveSheet
      ArchiveView.tsx       ← REPLACE stub with Navigate redirect
      ArchiveSheet.tsx      ← NEW
  lib/
    dateUtils.ts            ← UPDATE: add formatCompletedAt()
```

### References

- Epic requirements: [epic-1-task-management-foundation.md#story-1.6](_bmad-output/planning-artifacts/epics/epic-1-task-management-foundation.md)
- Component specs (TaskCard swipe, ArchiveSheet): [component-strategy.md](_bmad-output/planning-artifacts/ux-design-specification/component-strategy.md)
- Cache key architecture: [implementation-patterns-consistency-rules.md#communication-patterns](_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md)
- Project structure: [project-structure-boundaries.md](_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md)
- Previous story: [1-5-task-detail-edit.md](_bmad-output/implementation-artifacts/1-5-task-detail-edit.md)
- Deferred items: [deferred-work.md](_bmad-output/implementation-artifacts/deferred-work.md)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

Story context engine analysis completed — comprehensive developer guide created. Key notes:
- `POST /complete` returns 204 No Content — do not read response body
- Archive is a Sheet over TaskList, not a push-navigation route; ArchiveView.tsx gets a Navigate redirect
- Three cache keys must be invalidated on completion: `["tasks"]`, `["tasks", id]`, `["tasks", "archive"]`
- The hidden `sr-only` completion button from Story 1.5 gets wired in this story
- All 6 existing TaskCard tests must still pass after swipe changes

### File List
