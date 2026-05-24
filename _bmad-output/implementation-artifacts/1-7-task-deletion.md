# Story 1.7: Task Deletion

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to permanently delete a task with a confirmation step,
so that I can remove unwanted tasks without accidentally losing data.

## Acceptance Criteria

1. **Given** a task detail view is open
   **When** I tap "Delete"
   **Then** a `shadcn Dialog` opens: "Delete this task? This can't be undone." with [Cancel] (focused by default) and [Delete]

2. **Given** the delete dialog is open
   **When** I tap Cancel or press Escape
   **Then** the dialog closes and the task is unchanged

3. **Given** the delete dialog is open
   **When** I tap Delete
   **Then** `DELETE /api/v1/tasks/{id}` is called (204); dialog closes; app navigates back to task list; task is gone; TanStack Query cache `["tasks"]` is invalidated

4. **Given** the Delete button is rendered anywhere
   **When** I view it
   **Then** it uses `text-red-400` ghost style (no filled red button) and is never the default-focused element

5. **Given** a completed task is shown in the archive
   **When** I tap Delete on it
   **Then** the same confirmation dialog and deletion flow applies

6. **Given** a TaskCard is showing in the active list
   **When** I swipe right on the card
   **Then** a red delete action is revealed; confirming it triggers the same deletion dialog as tapping "Delete" on the detail view

## Tasks / Subtasks

- [ ] Task 1: Install shadcn Dialog component (AC: 1–5)
  - [ ] Run `npx shadcn@latest add dialog` inside `frontend/` to generate `src/components/ui/dialog.tsx`
  - [ ] Verify the generated file exports: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`
  - [ ] Do NOT edit the generated file — it belongs to shadcn's ownership layer

- [ ] Task 2: Add `useDeleteTask` hook to `useTasks.ts` (AC: 3, 5, 6)
  - [ ] Open `frontend/src/features/tasks/useTasks.ts` — ADD `useDeleteTask()` alongside existing hooks; do NOT alter any existing hook
  - [ ] `useDeleteTask()`: `useMutation` calling `DELETE /api/v1/tasks/{id}`; returns `void` (204 No Content — do NOT read response body)
  - [ ] `onSuccess`: invalidate `["tasks"]` AND `["tasks", id]` AND `["tasks", "archive"]` (archive must refresh since completed tasks can also be deleted)
  - [ ] Payload type: `{ id: number }`
  - [ ] Use `queryClient` singleton from `@/lib/queryClient` — do NOT use `useQueryClient()` hook (established pattern)

- [ ] Task 3: Add "Delete" button + DeleteDialog to `TaskDetail.tsx` (AC: 1–4)
  - [ ] Open `frontend/src/features/tasks/TaskDetail.tsx` — ADD a "Delete" button below the "Mark complete" button; ADD `DeleteDialog` component inline or import it
  - [ ] Add local state: `const [deleteOpen, setDeleteOpen] = useState(false)` and `const [deleteError, setDeleteError] = useState(false)`
  - [ ] Delete trigger button style: `w-full mt-3 text-red-400 bg-transparent border-0 rounded-2xl py-3 font-medium focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900` — ghost/text style, no filled red
  - [ ] On tap: `setDeleteOpen(true)` — opens the dialog; does NOT immediately delete
  - [ ] Wire `useDeleteTask` mutation: on dialog confirm → `await deleteTask.mutateAsync({ id: task.id })` → `navigate('/')` → `setDeleteOpen(false)`
  - [ ] On mutation error: `setDeleteError(true)`; show `<p className="text-red-400 text-sm text-center mt-2">Failed to delete task. Try again.</p>`
  - [ ] Keep Edit button and "Mark complete" button above Delete; keep all existing code intact

- [ ] Task 4: Implement DeleteDialog component (AC: 1–4)
  - [ ] Create `frontend/src/features/tasks/DeleteDialog.tsx` — NEW file in the `tasks/` feature folder
  - [ ] Props: `open: boolean; onClose: () => void; onConfirm: () => Promise<void>; isPending: boolean`
  - [ ] Use `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter` from `@/components/ui/dialog`
  - [ ] Title: `"Delete this task?"`
  - [ ] Description: `"This can't be undone."`
  - [ ] Two buttons in footer:
    - Cancel: `autoFocus` (focused by default per AC), `onClick={onClose}`, `className="..."` using neutral/ghost style; disabled when `isPending`
    - Delete: `text-red-400` ghost style (AC: 4 — never filled red), `onClick={onConfirm}`, `disabled={isPending}`
  - [ ] `onOpenChange` should call `onClose` so Escape key / outside click also closes (AC: 2)
  - [ ] Dialog is not the default-focused element overall — Cancel button gets `autoFocus`

- [ ] Task 5: Add Delete affordance to `ArchiveSheet.tsx` completed task rows (AC: 5)
  - [ ] Open `frontend/src/features/tasks/ArchiveSheet.tsx` — ADD a delete button to each archive row
  - [ ] Add local state: `const [deletingId, setDeletingId] = useState<number | null>(null)` for which task's dialog is open
  - [ ] Import `useDeleteTask` from `./useTasks` and `DeleteDialog` from `./DeleteDialog`
  - [ ] Each archive row gets a small delete button (icon only or ghost label): `aria-label="Delete: {task.name}"`, `className="text-red-400"`, `onClick={() => setDeletingId(task.id)}`
  - [ ] Render `<DeleteDialog open={deletingId === task.id} onClose={() => setDeletingId(null)} onConfirm={...} isPending={deleteTask.isPending} />` per row (or single shared dialog — simpler: one shared dialog, track which task is targeted)
  - [ ] Simpler approach: single `DeleteDialog` + `deletingId` state. `onConfirm`: call `deleteTask.mutateAsync({ id: deletingId! })` then `setDeletingId(null)`
  - [ ] After delete, archive re-renders automatically via `["tasks", "archive"]` cache invalidation

- [ ] Task 6: Add swipe-right delete to `TaskCard.tsx` (AC: 6)
  - [ ] Open `frontend/src/features/tasks/TaskCard.tsx` — ADD swipe-right gesture revealing a red delete action
  - [ ] The existing swipe implementation tracks `touchStartX.current` and `swipeDx` — extend to handle positive dx (right swipe) for delete
  - [ ] Current `handleTouchEnd`: if `dx < -80` → reveal complete (existing). ADD: if `dx > 80` → reveal delete action (new)
  - [ ] Current swipe layout renders the complete action to the RIGHT of the card. Delete action should be to the LEFT (before the card in the flex row) — revealed by translating the card RIGHT (+80px)
  - [ ] Red delete action button: `aria-label="Delete: {task.name}"`, `className="bg-red-500 text-white rounded-2xl px-3 py-3 font-medium flex items-center gap-1 text-sm disabled:opacity-50"`, `Trash2` icon from `lucide-react`
  - [ ] Tapping delete action: `setDeleteOpen(true)` — same DeleteDialog flow, NOT immediate deletion (AC: 6 says "triggers the same deletion dialog")
  - [ ] Add local state: `const [deleteOpen, setDeleteOpen] = useState(false)` and `const deleteTask = useDeleteTask()`
  - [ ] Render `<DeleteDialog open={deleteOpen} onClose={() => { setDeleteOpen(false); setSwipeDx(0) }} onConfirm={async () => { await deleteTask.mutateAsync({ id: task.id }); setDeleteOpen(false) }} isPending={deleteTask.isPending} />` at end of `<li>`
  - [ ] Reset `swipeDx` to 0 when dialog opens (so card snaps back)
  - [ ] All 6 existing tests in `TaskCard.test.tsx` MUST still pass — Link nav, amber border, aria-label on complete button, task name/deadline rendering

- [ ] Task 7: Verify and test (AC: 1–6)
  - [ ] Start frontend: `cd frontend && npm run dev`
  - [ ] Navigate to a task detail → tap Delete → verify dialog appears with "Delete this task? This can't be undone."
  - [ ] In dialog: tap Cancel → dialog closes, task unchanged
  - [ ] In dialog: press Escape → dialog closes, task unchanged
  - [ ] In dialog: tap Delete → verify `DELETE /api/v1/tasks/{id}` fires → navigate back to list → task gone
  - [ ] Open archive sheet → tap delete icon on a completed task → same dialog flow → deleted task disappears from archive
  - [ ] Swipe right on a TaskCard → red delete action revealed → tap → dialog opens → confirm → task deleted and removed from list
  - [ ] Verify Delete button is `text-red-400` ghost style (not a filled red button) everywhere
  - [ ] Verify Cancel button in dialog is focused by default (not Delete)
  - [ ] TypeScript: `cd frontend && npx tsc --noEmit` — zero errors
  - [ ] Lint: `cd frontend && npm run lint` — passes clean
  - [ ] Tests: `cd frontend && npx vitest run` — all existing tests pass

## Dev Notes

### CRITICAL: shadcn Dialog Not Yet Installed

`frontend/src/components/ui/` currently contains only `button.tsx` and `sheet.tsx`. The `Dialog` component does NOT exist. **Task 1 must be completed before any Dialog usage.**

Install via: `cd frontend && npx shadcn@latest add dialog`

This is a non-negotiable prerequisite — any import from `@/components/ui/dialog` before this install will cause a build failure.

### Files Being Modified — Current State

| File | Current State | Story 1.7 Changes |
|---|---|---|
| `src/features/tasks/useTasks.ts` | Has `useTasksQuery`, `useTaskQuery`, `useCreateTask`, `useUpdateTask`, `useCompleteTask`, `useArchiveQuery` | ADD `useDeleteTask()` |
| `src/features/tasks/TaskDetail.tsx` | Has Edit button + "Mark complete" button + back nav + error state | ADD Delete button + DeleteDialog wiring |
| `src/features/tasks/TaskCard.tsx` | Has swipe-left for complete, completion animation, Link nav | ADD swipe-right for delete, DeleteDialog |
| `src/features/tasks/ArchiveSheet.tsx` | Has archive list rows (read-only, no actions) | ADD delete button per row + DeleteDialog |
| `src/components/ui/dialog.tsx` | Does NOT exist | CREATE via `npx shadcn@latest add dialog` |

**New files to create:**
- `src/features/tasks/DeleteDialog.tsx`
- `src/components/ui/dialog.tsx` (via shadcn CLI — do NOT hand-write)

### API Contract — DELETE /api/v1/tasks/{id}

```http
DELETE /api/v1/tasks/42
```

Response: `204 No Content` (empty body — do NOT try to read `response.data`).

Applies to both active AND completed tasks. The backend does not distinguish.

### `useDeleteTask` — Implementation Pattern

```typescript
// ADD to frontend/src/features/tasks/useTasks.ts

export function useDeleteTask() {
  return useMutation<void, Error, { id: number }>({
    mutationFn: async ({ id }) => {
      await api.delete(`/api/v1/tasks/${id}`)
      // 204 No Content — no return value
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['tasks', 'archive'] })
    },
  })
}
```

### TaskDetail.tsx — Current Button Order + Delete Addition

Current button order (bottom of the detail view):
1. Edit (`bg-violet-500`)
2. Mark complete (`bg-violet-500`)

New order after this story:
1. Edit (`bg-violet-500`)
2. Mark complete (`bg-violet-500`)
3. **Delete** (`text-red-400` ghost — see AC: 4)

Delete button must NOT be filled red. AC: 4 is explicit: `text-red-400` ghost style.

```tsx
{/* Delete button */}
<button
  type="button"
  onClick={() => setDeleteOpen(true)}
  className="w-full mt-3 text-red-400 rounded-2xl py-3 font-medium focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
>
  Delete
</button>

<DeleteDialog
  open={deleteOpen}
  onClose={() => { setDeleteOpen(false); setDeleteError(false) }}
  onConfirm={async () => {
    setDeleteError(false)
    try {
      await deleteTask.mutateAsync({ id: task.id })
      navigate('/')
    } catch {
      setDeleteError(true)
    }
  }}
  isPending={deleteTask.isPending}
/>
{deleteError && (
  <p className="text-red-400 text-sm text-center mt-2">Failed to delete task. Try again.</p>
)}
```

Import: `useDeleteTask` from `./useTasks`, `DeleteDialog` from `./DeleteDialog`.

### DeleteDialog — Implementation Pattern

```tsx
// frontend/src/features/tasks/DeleteDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface DeleteDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  isPending: boolean
}

export default function DeleteDialog({ open, onClose, onConfirm, isPending }: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-800 border-zinc-700 text-zinc-50">
        <DialogHeader>
          <DialogTitle>Delete this task?</DialogTitle>
          <DialogDescription className="text-zinc-400">
            This can't be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 flex-row-reverse">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="text-red-400 rounded-2xl px-4 py-2 font-medium focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:opacity-50"
          >
            {isPending ? 'Deleting…' : 'Delete'}
          </button>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            disabled={isPending}
            className="bg-zinc-700 text-zinc-50 rounded-2xl px-4 py-2 font-medium focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:opacity-50"
          >
            Cancel
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

**AC: 4 compliance:** Delete button uses `text-red-400` (ghost — no background fill). Cancel has `bg-zinc-700`. Cancel has `autoFocus` (AC: 1 — Cancel focused by default).

### TaskCard.tsx — Swipe-Right Delete Extension

Current swipe state: `swipeDx` is negative (card slides left to reveal complete action). For delete, `swipeDx` becomes positive (card slides right to reveal delete action on the left).

The flex row layout is: `[delete action] [card] [complete action]`. Currently only `[card] [complete action]` is implemented. The delete action slot needs to be added to the LEFT of the card.

```tsx
// Extended flex row structure
<div className="flex" style={{ transform: `translateX(${swipeDx}px)`, transition: ... }}>
  {/* Delete action — left side, revealed by positive swipeDx */}
  <div className="shrink-0 flex items-center pr-3 justify-end" style={{ width: 80 }}>
    <button
      type="button"
      aria-label={`Delete: ${task.name}`}
      onClick={() => { setDeleteOpen(true); setSwipeDx(0) }}
      disabled={deleteTask.isPending}
      tabIndex={swipeDx > 0 ? 0 : -1}
      className="bg-red-500 text-white rounded-2xl px-3 py-3 font-medium flex items-center gap-1 text-sm disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
      Del
    </button>
  </div>

  {/* Card — full width slot */}
  <div className="w-full shrink-0">
    <Link to={`/tasks/${task.id}`} ...>...</Link>
  </div>

  {/* Complete action — right side, revealed by negative swipeDx */}
  <div className="shrink-0 flex items-center pl-3" style={{ width: 80 }}>
    <button aria-label={`Mark complete: ${task.name}`} ...>
      <Check ... /> Done
    </button>
  </div>
</div>
```

**Initial translate offset:** With the delete action div (80px) prepended, the flex row starts 80px to the left. The card must start visually at the viewport left edge. Achieve this by setting the initial `translateX` to `-80px` (to offset the left slot) and then computing swipe as:
- Rest state: `translateX(-80px)` — card aligned to viewport left, both action slots hidden
- Swipe left (complete): `translateX(-80 + swipeDx)` where `swipeDx = -80` → `translateX(-160px)` — complete revealed
- Swipe right (delete): `translateX(-80 + swipeDx)` where `swipeDx = +80` → `translateX(0px)` — delete revealed

Adjust `handleTouchEnd`: `if dx < -80 → setSwipeDx(-80)`; `if dx > 80 → setSwipeDx(80)`; else `setSwipeDx(0)`.

Update style: `transform: translateX(${-80 + swipeDx}px)`.

### ArchiveSheet.tsx — Delete Row Pattern

Archive rows are currently read-only. This story adds a delete icon to each row:

```tsx
{tasks.map((task) => (
  <li key={task.id} className="bg-zinc-800 rounded-2xl px-4 py-3 flex items-center justify-between">
    <div>
      <p className="text-base font-medium text-zinc-50">{task.name}</p>
      <p className="text-sm text-zinc-400">{formatCompletedAt(task.completed_at)}</p>
    </div>
    <button
      type="button"
      aria-label={`Delete: ${task.name}`}
      onClick={() => setDeletingId(task.id)}
      className="text-red-400 ml-3 shrink-0 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 rounded"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  </li>
))}
```

Use a single shared `DeleteDialog` outside the map, keyed to `deletingId`:

```tsx
<DeleteDialog
  open={deletingId !== null}
  onClose={() => setDeletingId(null)}
  onConfirm={async () => {
    if (deletingId === null) return
    await deleteTask.mutateAsync({ id: deletingId })
    setDeletingId(null)
  }}
  isPending={deleteTask.isPending}
/>
```

### Cache Key Architecture (Must Follow)

Per `implementation-patterns-consistency-rules.md`:
- On `useDeleteTask` success, invalidate ALL THREE: `["tasks"]`, `["tasks", id]`, `["tasks", "archive"]`
- This ensures the task list refreshes, the detail cache clears, and the archive list updates

### Existing Tests — Must All Pass

All 6 tests in `TaskCard.test.tsx` must still pass after adding swipe-right:
- `navigates to task detail URL` — Link to `/tasks/42` must still work
- `applies amber border for overdue tasks` — `border-amber-500` class on Link
- `has accessible aria-label on the completion button` — `aria-label="Mark complete: Test task"`
- `renders task name`, `renders formatted deadline`, `does NOT apply amber border for non-overdue tasks`

The `aria-label="Mark complete: {task.name}"` test finds the button via `screen.getByLabelText('Mark complete: Test task')`. With the swipe layout change (adding a delete action div), the button must remain findable by that label. The `tabIndex` of the complete button will be `-1` in resting state but the button still exists in the DOM — `getByLabelText` will find it regardless of `tabIndex`.

Additionally, the new Delete button in TaskCard has `aria-label="Delete: {task.name}"` — this won't conflict with any existing test assertions.

### Swipe Layout — Initial Offset Critical Detail

When adding the delete action slot to the left, the total flex row becomes wider. The `overflow-hidden` wrapper clips everything outside the card's bounds. The initial `translateX` must be `-80px` (negative width of the delete slot) so the card starts flush left and neither action is visible until swiped.

Failure to set the initial offset means the delete action will be partially visible on page load — a regression.

### Anti-Patterns to Avoid

- ❌ Hand-writing `dialog.tsx` — always install via `npx shadcn@latest add dialog`
- ❌ Making the Delete button a filled red button — it must be `text-red-400` ghost style (AC: 4)
- ❌ Deleting immediately on Delete button tap — always show confirmation dialog first
- ❌ Making Delete the `autoFocus` element in the dialog — Cancel must be focused by default (AC: 1)
- ❌ Importing from `react-router-dom` — use `react-router` (v7 unified package)
- ❌ Using `useQueryClient()` hook — import the `queryClient` singleton from `@/lib/queryClient`
- ❌ Trying to read response body from `DELETE` — it returns 204 No Content
- ❌ Forgetting to invalidate `["tasks", "archive"]` on delete — archive won't update without it
- ❌ Forgetting to reset `swipeDx` to 0 after swipe-right opens the dialog — card will remain offset when dialog closes
- ❌ Hardcoding `translateX(0px)` as the rest state after adding the left delete slot — must be `translateX(-80px)` to account for the new left slot

### File Locations Summary

```
frontend/src/
  features/
    tasks/
      useTasks.ts          ← UPDATE: add useDeleteTask()
      TaskDetail.tsx        ← UPDATE: add Delete button + DeleteDialog wiring
      TaskCard.tsx          ← UPDATE: add swipe-right delete + DeleteDialog
      ArchiveSheet.tsx      ← UPDATE: add delete button per row + DeleteDialog
      DeleteDialog.tsx      ← NEW
  components/
    ui/
      dialog.tsx            ← NEW (via shadcn CLI: npx shadcn@latest add dialog)
```

### References

- Epic requirements: [epic-1-task-management-foundation.md#story-1.7](_bmad-output/planning-artifacts/epics/epic-1-task-management-foundation.md)
- Component strategy (Dialog, swipe right): [component-strategy.md](_bmad-output/planning-artifacts/ux-design-specification/component-strategy.md)
- Cache key architecture: [implementation-patterns-consistency-rules.md#communication-patterns](_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md)
- Project structure: [project-structure-boundaries.md](_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md)
- Previous story: [1-6-task-completion-archive.md](_bmad-output/implementation-artifacts/1-6-task-completion-archive.md)
- Deferred items: [deferred-work.md](_bmad-output/implementation-artifacts/deferred-work.md)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

Story context engine analysis completed — comprehensive developer guide created.

### File List
