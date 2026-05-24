# Story 1.5: Task Detail & Edit

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to tap a task to see its full details and edit any field,
So that I can review and correct tasks after they are created.

## Acceptance Criteria

1. **Given** tasks exist in the list
   **When** I tap a TaskCard
   **Then** the app navigates to `/tasks/:taskId` (slide-left push transition) showing: name (`text-xl font-semibold`), deadline in local time inside `<time datetime="...">` (UTC value in attribute), and description if set

2. **Given** the task detail view is open
   **When** I tap Edit
   **Then** all fields become editable using the same ConfirmationSheet field layout (NameField card, DeadlineChip, description textarea)

3. **Given** I have made edits and tap Save
   **When** the API call completes
   **Then** `PATCH /api/v1/tasks/{id}` is called; the detail view reflects updated data; TanStack Query caches `["tasks"]` and `["tasks", taskId]` are both invalidated

4. **Given** the task detail view is open
   **When** I tap the back arrow or swipe right
   **Then** the app returns to the task list with a slide-right transition

5. **Given** any interactive element on the detail or edit view
   **When** it receives keyboard focus
   **Then** a `focus-visible:ring-2 ring-violet-500 ring-offset-2 ring-offset-zinc-900` ring is visible

## Tasks / Subtasks

- [ ] Task 1: Add `useTaskQuery` and `useUpdateTask` hooks to `useTasks.ts` (AC: 1, 3)
  - [ ] Open `frontend/src/features/tasks/useTasks.ts` — ADD two hooks alongside existing `useTasksQuery()` and `useCreateTask()` (which will be added by Story 1.4); do NOT remove or alter existing hooks
  - [ ] Add `useTaskQuery(taskId: number)`: fetches `GET /api/v1/tasks/{id}` — cache key `["tasks", taskId]`; returns the single `Task` object
  - [ ] Add `useUpdateTask()`: `useMutation` that calls `PATCH /api/v1/tasks/{id}` with partial fields; on success invalidates both `["tasks"]` AND `["tasks", taskId]`
  - [ ] Payload type for update: `{ id: number; name?: string; deadline_at?: string; description?: string | null }` — `id` is used in the URL, not the body
  - [ ] Import `queryClient` from `@/lib/queryClient` (singleton — do NOT use `useQueryClient()` hook)

- [ ] Task 2: Wire TaskCard to navigate to detail view (AC: 1)
  - [ ] Update `frontend/src/features/tasks/TaskCard.tsx` — wrap the entire `<li>` content or the card itself with a `<Link>` to `/tasks/${task.id}` using React Router v7
  - [ ] Import `Link` from `react-router` (not `react-router-dom`)
  - [ ] The `<li role="listitem">` wrapper stays; the clickable area should be the whole card body (not just the task name)
  - [ ] Preserve all existing classes, overdue border logic, and the hidden completion button — do NOT break AC from Story 1.3
  - [ ] The completion circle `<button>` must NOT be inside the `<Link>` — it is a separate action. Use `stopPropagation` or structure the Link around the non-interactive content only and leave the button outside the Link.

- [ ] Task 3: Implement `TaskDetail` page — read-only view (AC: 1, 4, 5)
  - [ ] Fully replace the stub content of `frontend/src/features/tasks/TaskDetail.tsx`
  - [ ] Read `taskId` from URL params: `const { taskId } = useParams()` — import `useParams` from `react-router`
  - [ ] `taskId` from `useParams()` is a `string | undefined` — parse it to `number`: `const id = Number(taskId)`. If `isNaN(id)`, render error state.
  - [ ] Call `useTaskQuery(id)` to load the task
  - [ ] **Loading state:** 3 skeleton rows: `<div className="animate-pulse bg-zinc-800 rounded-2xl h-8 mb-3" />`
  - [ ] **Error/not-found state:** `<p className="text-red-400 text-sm">Task not found.</p>` with a back button
  - [ ] **Read-only layout (top to bottom):**
    1. Header: `<div className="flex items-center gap-3 mb-6">` with back arrow button (`←` or chevron icon from `lucide-react`) + `<h1 className="text-xl font-semibold text-zinc-50">{task.name}</h1>`
    2. Deadline block: `<time dateTime={task.deadline_at} className="text-sm text-zinc-400">{formatDeadline(task.deadline_at)}</time>` — note `dateTime` attribute holds the UTC ISO value, display text is local-formatted
    3. Description block (only if `task.description`): `<p className="text-sm text-zinc-400 mt-4">{task.description}</p>`
    4. Edit button: `<Button className="w-full mt-6 bg-violet-500 text-white">Edit</Button>` — opens the edit sheet (Task 4)
  - [ ] Page layout: `<div className="min-h-screen bg-zinc-900">` → `<div className="max-w-lg mx-auto px-4 pt-6 pb-24">`
  - [ ] Back navigation: clicking the back arrow calls `navigate(-1)` from `useNavigate` — import from `react-router`
  - [ ] Focus ring: all interactive elements must have `focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900`

- [ ] Task 4: Implement edit mode via `EditSheet` (reusing ConfirmationSheet layout) (AC: 2, 3, 5)
  - [ ] Create `frontend/src/features/voice/EditSheet.tsx` — this is a separate component from `ConfirmationSheet` to keep concerns clean, but follows the IDENTICAL layout and visual design
  - [ ] Props: `open: boolean; onClose: () => void; task: Task` — pre-populated with existing task data
  - [ ] Use `Sheet` + `SheetContent` from `@/components/ui/sheet` (installed in Story 1.4)
  - [ ] **Internal state:** pre-populate from `task` prop when `open` changes to true:
    - `name: string` — init from `task.name`
    - `deadlineUtcIso: string` — init from `task.deadline_at`
    - `description: string` — init from `task.description ?? ''`
  - [ ] **Layout:** Identical to `ConfirmationSheet` (drag handle, NameField card, DeadlineChip card, description textarea, Save button, Cancel link) — reuse the same Tailwind classes
  - [ ] **No OffsetSelector in edit sheet** — reminder offset editing is Story 2.x scope; do not include it here
  - [ ] **Save handler:** call `updateTask.mutateAsync({ id: task.id, name, deadline_at: deadlineUtcIso, description: description.trim() || null })` then call `onClose()`
  - [ ] Save button disabled until `name.trim().length > 0 && deadlineUtcIso` (same guard as ConfirmationSheet)
  - [ ] Import `DeadlineChip` from `@/features/voice/DeadlineChip` — reuse it directly; do NOT recreate
  - [ ] `useUpdateTask()` from `./useTasks` — import it in EditSheet

- [ ] Task 5: Wire Edit button in `TaskDetail` to open `EditSheet` (AC: 2, 3)
  - [ ] In `TaskDetail.tsx`, add local state: `const [editOpen, setEditOpen] = useState(false)`
  - [ ] Render `<EditSheet open={editOpen} onClose={() => setEditOpen(false)} task={task} />` below the page layout
  - [ ] Edit button `onClick`: `setEditOpen(true)`
  - [ ] After `EditSheet` closes (onClose), the `useTaskQuery(id)` cache will already be invalidated by `useUpdateTask` — no manual refetch needed

- [ ] Task 6: Add page transition CSS (AC: 1, 4)
  - [ ] Add slide transition classes in `src/index.css` using CSS `@keyframes` or Tailwind `motion-safe:` variant
  - [ ] **Simple approach (preferred):** Use CSS View Transitions API if supported, or apply `transition-all duration-300` on route wrapper — React Router v7 supports View Transitions via `<RouterProvider future={{ v7_startTransition: true }}>`
  - [ ] **Minimum viable:** Ensure no jarring flash on navigation — even just `bg-zinc-900` on the page root prevents white flashes. If full slide animation is complex, defer the animation polish and ship functional navigation. The AC says "slide-left push transition" but functional navigation without the animation satisfies the MVP.
  - [ ] Do NOT install Framer Motion or any animation library — use CSS only

- [ ] Task 7: Verify and test (AC: 1–5)
  - [ ] Start backend: `cd backend && uv run uvicorn app.main:app --reload`
  - [ ] Start frontend: `cd frontend && npm run dev`
  - [ ] Create a task (Story 1.4 flow) → tap its TaskCard → verify navigation to `/tasks/{id}`
  - [ ] Verify task name, deadline (local time), and description render correctly on detail view
  - [ ] Tap Edit → sheet opens pre-populated → change name → tap Save → sheet closes → detail view shows updated name
  - [ ] Verify both `["tasks"]` and `["tasks", id]` caches are invalidated (task list reflects edit too)
  - [ ] Tap back arrow → returns to task list
  - [ ] TypeScript: `cd frontend && npx tsc --noEmit` — zero errors
  - [ ] Lint: `cd frontend && npm run lint` — passes clean

## Dev Notes

### Critical: Story 1.4 Dependency

**This story depends on Story 1.4 being implemented first.** The following must exist before starting:
- `src/components/ui/sheet.tsx` — shadcn Sheet component (installed in Story 1.4 Task 1)
- `src/features/voice/ConfirmationSheet.tsx` — for layout reference
- `src/features/voice/DeadlineChip.tsx` — reused directly in `EditSheet`
- `useCreateTask()` in `useTasks.ts` — Story 1.4 adds this; Story 1.5 adds more hooks to the same file

If Story 1.4 is not yet implemented, install the Sheet component manually first (`npx shadcn@latest add sheet` from `frontend/`) and create `DeadlineChip.tsx` before starting Task 4.

### Existing Files — Current State and What Changes

| File | Current State | Story 1.5 Changes |
|---|---|---|
| `src/features/tasks/TaskDetail.tsx` | Stub: renders `"Task Detail — coming in Story 1.5"` | FULL REPLACEMENT with real implementation |
| `src/features/tasks/TaskCard.tsx` | Renders task name + deadline; hidden completion button | ADD navigation Link wrapper |
| `src/features/tasks/useTasks.ts` | Has `useTasksQuery()` + `useCreateTask()` (after 1.4) | ADD `useTaskQuery()` + `useUpdateTask()` |

**New files created in this story:**
- `src/features/voice/EditSheet.tsx`

### `useTasks.ts` — Complete Hook Additions

```typescript
// ADD to frontend/src/features/tasks/useTasks.ts
import { useQuery, useMutation } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import api from '@/lib/api'
import type { Task } from './types'

// Single task fetch — used by TaskDetail
export function useTaskQuery(taskId: number) {
  return useQuery<Task>({
    queryKey: ['tasks', taskId],
    queryFn: async () => {
      const { data } = await api.get<Task>(`/api/v1/tasks/${taskId}`)
      return data
    },
    enabled: !isNaN(taskId),   // don't fire if taskId is NaN
  })
}

interface UpdateTaskPayload {
  id: number
  name?: string
  deadline_at?: string      // UTC ISO 8601
  description?: string | null
}

export function useUpdateTask() {
  return useMutation<Task, Error, UpdateTaskPayload>({
    mutationFn: async ({ id, ...fields }) => {
      const { data } = await api.patch<Task>(`/api/v1/tasks/${id}`, fields)
      return data
    },
    onSuccess: (data) => {
      // Invalidate both list and single-task cache
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.setQueryData(['tasks', data.id], data)  // optimistic update for detail view
    },
  })
}
```

**Do NOT use `useQueryClient()` hook** — import the `queryClient` singleton from `@/lib/queryClient` directly (established pattern from Story 1.3).

### API Contract — PATCH /api/v1/tasks/{id}

```http
PATCH /api/v1/tasks/42
Content-Type: application/json

{
  "name": "Updated task name",
  "deadline_at": "2026-06-10T14:00:00.000Z",
  "description": null
}
```

Response (200 OK): full updated `Task` object.

**PATCH is partial** — only send fields that changed. The backend uses Pydantic `TaskUpdate` with all-optional fields. Sending `description: null` explicitly clears the description. Omitting a field leaves it unchanged.

**Error response** (404): `{ "detail": "Task not found", "code": "TASK_NOT_FOUND" }` — backend returns this if task was deleted between navigation and save.

### TaskCard — Navigation Link Pattern

```typescript
// frontend/src/features/tasks/TaskCard.tsx
import { Link } from 'react-router'  // NOT react-router-dom
import { cn } from '@/lib/utils'
import { formatDeadline, isOverdue } from '@/lib/dateUtils'
import type { Task } from './types'

export default function TaskCard({ task }: TaskCardProps) {
  const overdue = isOverdue(task.deadline_at)

  return (
    <li role="listitem">
      <Link
        to={`/tasks/${task.id}`}
        className={cn(
          'block bg-zinc-800 rounded-2xl px-4 py-3',
          overdue && 'border-l-4 border-amber-500',
        )}
      >
        <p className="text-base font-medium text-zinc-50">{task.name}</p>
        <p className="text-sm text-zinc-400">{formatDeadline(task.deadline_at)}</p>
      </Link>
      {/* Completion button lives OUTSIDE the Link to avoid nested interactives */}
      <button
        type="button"
        aria-label={`Mark complete: ${task.name}`}
        className="sr-only"
      />
    </li>
  )
}
```

**Why the button is outside the Link:** HTML spec prohibits interactive elements (buttons) nested inside `<a>` / `<Link>` elements. Moving it outside avoids accessibility violations and browser quirks. The button is `sr-only` (hidden) and wired in Story 1.6, so its position relative to the card doesn't matter visually.

### TaskDetail — Complete Implementation Pattern

```typescript
// frontend/src/features/tasks/TaskDetail.tsx
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { useTaskQuery } from './useTasks'
import { formatDeadline } from '@/lib/dateUtils'
import EditSheet from '@/features/voice/EditSheet'

export default function TaskDetail() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const id = Number(taskId)
  const [editOpen, setEditOpen] = useState(false)

  const { data: task, isLoading, isError } = useTaskQuery(id)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-900">
        <div className="max-w-lg mx-auto px-4 pt-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-pulse bg-zinc-800 rounded-2xl h-8 mb-3" />
          ))}
        </div>
      </div>
    )
  }

  if (isError || !task) {
    return (
      <div className="min-h-screen bg-zinc-900">
        <div className="max-w-lg mx-auto px-4 pt-6">
          <p className="text-red-400 text-sm mb-4">Task not found.</p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-violet-400 text-sm focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
          >
            ← Back to tasks
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
        {/* Header with back arrow */}
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Back to task list"
            className="text-zinc-400 hover:text-zinc-50 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 rounded"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold text-zinc-50">{task.name}</h1>
        </div>

        {/* Deadline */}
        <time
          dateTime={task.deadline_at}
          className="text-sm text-zinc-400 block"
        >
          {formatDeadline(task.deadline_at)}
        </time>

        {/* Description (conditional) */}
        {task.description && (
          <p className="text-sm text-zinc-400 mt-4 leading-normal">{task.description}</p>
        )}

        {/* Edit button */}
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="w-full mt-6 bg-violet-500 text-white rounded-2xl py-3 font-medium focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
        >
          Edit
        </button>
      </div>

      <EditSheet open={editOpen} onClose={() => setEditOpen(false)} task={task} />
    </div>
  )
}
```

### EditSheet — Complete Implementation Pattern

```typescript
// frontend/src/features/voice/EditSheet.tsx
import { useEffect, useState } from 'react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useUpdateTask } from '@/features/tasks/useTasks'
import DeadlineChip from './DeadlineChip'
import type { Task } from '@/features/tasks/types'

interface EditSheetProps {
  open: boolean
  onClose: () => void
  task: Task
}

export default function EditSheet({ open, onClose, task }: EditSheetProps) {
  const [name, setName] = useState(task.name)
  const [deadlineUtcIso, setDeadlineUtcIso] = useState(task.deadline_at)
  const [description, setDescription] = useState(task.description ?? '')
  const updateTask = useUpdateTask()

  // Re-populate when sheet opens (handles re-open after multiple edits)
  useEffect(() => {
    if (open) {
      setName(task.name)
      setDeadlineUtcIso(task.deadline_at)
      setDescription(task.description ?? '')
    }
  }, [open, task])

  const canSave = name.trim().length > 0 && deadlineUtcIso.length > 0

  const handleSave = async () => {
    if (!canSave) return
    try {
      await updateTask.mutateAsync({
        id: task.id,
        name: name.trim(),
        deadline_at: deadlineUtcIso,
        description: description.trim() || null,
      })
      onClose()
    } catch {
      // updateTask.isError will be true; user can retry
    }
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="bg-zinc-700 rounded-t-2xl px-4 pt-4 pb-8">
        {/* Drag handle */}
        <div className="w-12 h-1 bg-zinc-500 rounded-full mx-auto mb-4" />

        {/* Name field */}
        <div className="bg-zinc-800 rounded-2xl px-4 py-3 mb-3">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Task name"
            className="bg-transparent text-lg font-medium text-zinc-50 placeholder:text-zinc-500 w-full outline-none focus-visible:ring-0"
          />
        </div>

        {/* Deadline chip */}
        <div className="bg-zinc-800 rounded-2xl p-3 mb-3">
          <DeadlineChip value={deadlineUtcIso} onChange={setDeadlineUtcIso} />
        </div>

        {/* Description */}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="bg-zinc-800 rounded-2xl px-4 py-3 text-sm text-zinc-50 placeholder:text-zinc-500 w-full outline-none resize-none h-20 mt-3"
        />

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave || updateTask.isPending}
          aria-disabled={!canSave || updateTask.isPending}
          className="bg-violet-500 text-white rounded-2xl py-3 font-medium mt-4 w-full disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-700"
        >
          {updateTask.isPending ? 'Saving…' : 'Save'}
        </button>

        {/* Cancel */}
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-400 text-sm text-center w-full mt-3 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-700"
        >
          Cancel
        </button>
      </SheetContent>
    </Sheet>
  )
}
```

### DeadlineChip Reuse in EditSheet

`DeadlineChip`'s prop type is `value: string | null; onChange: (utcIso: string) => void`.

In `EditSheet`, `deadlineUtcIso` is `string` (not `null`) because the task always has a deadline. Pass it directly — TypeScript will accept `string` where `string | null` is expected. If the user doesn't change the deadline, the existing UTC ISO string is passed through unchanged.

### Page Transition — Minimum Viable Approach

The AC requires a "slide-left push transition." The simplest approach that avoids adding dependencies:

1. **Add `viewTransitions` to React Router:** In `frontend/src/router.tsx`, update:
   ```typescript
   export const router = createBrowserRouter([...], { future: {} })
   ```
   React Router v7 has built-in View Transitions support — use `<Link viewTransition>` on the TaskCard Link. This uses the browser's View Transitions API where supported (Chrome/Edge, progressively enhanced).

2. **CSS for slide:** In `src/index.css`:
   ```css
   @keyframes slide-in-from-right {
     from { transform: translateX(100%); }
     to { transform: translateX(0); }
   }
   ::view-transition-new(root) {
     animation: slide-in-from-right 300ms ease-out;
   }
   ```

3. **If View Transitions aren't working:** Skip the animation entirely — the AC is functional navigation. Delivery > animation polish.

### What NOT to Implement in This Story

- Completion action ("Mark complete" button) — Story 1.6
- Delete action — Story 1.7
- Swipe gestures on TaskCard — Story 1.6
- Archive view — Story 1.6
- Recurring task fields on TaskDetail — Story 4.x
- OffsetSelector in EditSheet — Story 2.x (reminder management)
- TrustBanner after edit save — Story 2.8 (requires scheduler)
- The `<Link viewTransition>` prop — optional enhancement; functional navigation is sufficient

### Anti-Patterns to Avoid

- ❌ Importing from `react-router-dom` — use `react-router` (v7 unified package)
- ❌ Using `useQueryClient()` hook for cache invalidation — import the `queryClient` singleton from `@/lib/queryClient` directly
- ❌ Nesting `<button>` inside `<Link>` on TaskCard — HTML spec violation; move button outside the Link
- ❌ Storing `taskId` as string — `useParams()` returns `string | undefined`; parse to `number` with `Number(taskId)` and guard `isNaN(id)`
- ❌ Sending all task fields in PATCH body — only send changed fields (PATCH is partial)
- ❌ Recreating `DeadlineChip` in `EditSheet` — import it from `@/features/voice/DeadlineChip`
- ❌ Putting `EditSheet` in `src/features/tasks/` — it belongs in `src/features/voice/` (ConfirmationSheet pattern)
- ❌ Using `navigate('/tasks')` for back — use `navigate(-1)` to preserve browser history stack
- ❌ Adding Framer Motion or any animation library — CSS only for transitions
- ❌ Calling `task.deadline_at` local time in the `dateTime` attribute — the `dateTime` attribute always holds the UTC ISO value; only the display text is local

### File Locations Summary

```
frontend/src/
  features/
    tasks/
      TaskDetail.tsx     ← FULL REPLACEMENT (was stub)
      TaskCard.tsx       ← UPDATE: add Link navigation
      useTasks.ts        ← UPDATE: add useTaskQuery() + useUpdateTask()
    voice/
      EditSheet.tsx      ← NEW
```

### References

- Epic requirements: [epic-1-task-management-foundation.md#story-1.5](_bmad-output/planning-artifacts/epics/epic-1-task-management-foundation.md)
- Component specs: [component-strategy.md](_bmad-output/planning-artifacts/ux-design-specification/component-strategy.md)
- User journey: [user-journey-flows.md](_bmad-output/planning-artifacts/ux-design-specification/user-journey-flows.md)
- Visual design: [visual-design-foundation.md](_bmad-output/planning-artifacts/ux-design-specification/visual-design-foundation.md)
- Architecture decisions: [core-architectural-decisions.md](_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md)
- Naming/format rules: [implementation-patterns-consistency-rules.md](_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md)
- File layout: [project-structure-boundaries.md](_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md)
- Previous story: [1-4-text-task-creation.md](_bmad-output/implementation-artifacts/1-4-text-task-creation.md)
- Deferred items: [deferred-work.md](_bmad-output/implementation-artifacts/deferred-work.md)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

Story context engine analysis completed — comprehensive developer guide created. Key notes:
- Hard dependency on Story 1.4 (Sheet component + DeadlineChip must exist)
- TaskCard Link/button nesting is a real HTML spec issue — button must live outside the Link
- EditSheet reuses DeadlineChip directly from voice/ feature folder
- PATCH is partial — do not send all fields, only changed ones
- Both `["tasks"]` and `["tasks", taskId]` must be invalidated on update

### File List
