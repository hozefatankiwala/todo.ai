# Story 1.3: Frontend Foundation & Task List

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to open the app and immediately see my active tasks sorted by deadline,
so that I know what's next without any loading friction.

## Acceptance Criteria

1. **Given** the frontend is open in a browser
   **When** the task list renders
   **Then** active tasks appear sorted by `deadline_at` ascending; each TaskCard shows task name (`text-base font-medium`) and deadline in local time (`text-sm`)
   **And** overdue tasks (deadline in the past) appear at the top with `border-l-4 border-amber-500` on the card

2. **Given** there are no active tasks
   **When** the task list renders
   **Then** the empty state "Nothing yet. Tap the mic to add your first task." is displayed

3. **Given** the API response is slow
   **When** the task list is loading
   **Then** 3 `animate-pulse bg-zinc-800 rounded-2xl` placeholder cards show for up to 500ms then resolve to real data

4. **Given** the design system is applied
   **When** I view any screen
   **Then** page background is `bg-zinc-900`; cards are `bg-zinc-800 rounded-2xl`; accent is `violet-500`; font stack is system sans-serif; layout is `max-w-lg mx-auto` (full-bleed on mobile)
   **And** dark mode defaults to system preference via `class`-based Tailwind dark mode

5. **Given** the frontend architecture is wired
   **When** any API call is made
   **Then** all HTTP goes through `src/lib/api.ts` (single Axios instance); TanStack Query manages cache with key `["tasks"]`; Zustand manages UI state

6. **Given** voice capture is not yet implemented
   **When** the task list is visible
   **Then** a violet circular FAB placeholder is fixed at `bottom-6 right-6` (56px `rounded-full`); visible but not yet wired to creation

## Tasks / Subtasks

- [ ] Task 1: Wire React Router v7 and replace App.tsx (AC: 4, 5)
  - [ ] Update `frontend/src/router.tsx`: define routes using React Router v7 `createBrowserRouter`; route `"/"` → `<TaskList />`, route `"/tasks/:taskId"` → placeholder `<TaskDetail />` (stub), route `"/archive"` → placeholder `<ArchiveView />` (stub)
  - [ ] Update `frontend/src/main.tsx`: import `RouterProvider` and the router from `router.tsx`; wrap the render tree: `<QueryClientProvider><RouterProvider router={router} /></QueryClientProvider>`; preserve the existing dark-mode system preference block (lines 9–11)
  - [ ] Delete or empty `frontend/src/App.tsx` content — replace with a bare export that re-exports from router, OR leave App.tsx unused and wire RouterProvider directly in main.tsx. Pick one and stay consistent. **Do not leave the Vite placeholder content in the rendered tree.**
  - [ ] Verify no TypeScript errors: `cd frontend && npx tsc --noEmit`

- [ ] Task 2: Create `Task` TypeScript type (AC: 1, 5)
  - [ ] Create `frontend/src/features/tasks/types.ts`:
    ```typescript
    export interface Task {
      id: number;
      name: string;
      deadline_at: string; // UTC ISO 8601 — never store local time
      description: string | null;
      is_completed: boolean;
      completed_at: string | null;
      created_at: string;
      updated_at: string;
    }
    ```
  - [ ] All field names match the backend `snake_case` API contract exactly — no camelCase aliases

- [ ] Task 3: Create `useTasks` TanStack Query hook (AC: 1, 3, 5)
  - [ ] Create `frontend/src/features/tasks/useTasks.ts`:
    - `useTasksQuery()`: calls `GET /api/v1/tasks/` via `src/lib/api.ts`; cache key `["tasks"]`; returns `{ data: Task[], isLoading, isError }`
    - Use the existing `api` Axios instance from `src/lib/api.ts` (already configured with `VITE_API_BASE_URL`)
  - [ ] Do NOT use raw `fetch()` — use `api` from `src/lib/api.ts` exclusively
  - [ ] Response from backend is `Task[]` (array directly, no envelope wrapper)

- [ ] Task 4: Create `TaskCard` component (AC: 1, 4)
  - [ ] Create `frontend/src/features/tasks/TaskCard.tsx`:
    - Props: `task: Task`
    - Layout: `bg-zinc-800 rounded-2xl px-4 py-3` card
    - Task name: `text-base font-medium text-zinc-50`
    - Deadline: `text-sm text-zinc-400` — format using existing `formatDeadline(task.deadline_at)` from `src/lib/dateUtils.ts`
    - Overdue: when `isOverdue(task.deadline_at)` (from `src/lib/dateUtils.ts`) is true, add `border-l-4 border-amber-500` to the card
    - Accessibility: `role="listitem"`; the completion circle (if placeholder) should have `aria-label="Mark complete: {task.name}"`
    - No swipe gestures yet — those come in Story 1.6
  - [ ] Create co-located test: `frontend/src/features/tasks/TaskCard.test.tsx` — at minimum: renders task name, renders deadline, overdue card gets amber border, non-overdue card does not

- [ ] Task 5: Create `TaskList` page component (AC: 1, 2, 3, 4, 6)
  - [ ] Create `frontend/src/features/tasks/TaskList.tsx`:
    - Calls `useTasksQuery()`
    - **Loading state:** render 3 skeleton cards: `<div className="animate-pulse bg-zinc-800 rounded-2xl h-16" />` in a `space-y-2` container
    - **Empty state:** `<p>Nothing yet. Tap the mic to add your first task.</p>` — `text-zinc-500` centered
    - **Data state:** `<ul role="list" className="space-y-2">` containing a `<TaskCard />` per task; tasks arrive pre-sorted by `deadline_at` ascending from the API (no client-side sort needed); overdue tasks display with amber border naturally since the card handles it
    - Page layout: `<div className="min-h-screen bg-zinc-900">` → `<div className="max-w-lg mx-auto px-4 pt-6 pb-24">` (pb-24 ensures FAB doesn't cover last task on mobile)
    - Header: `<h1 className="text-xl font-semibold text-zinc-50 mb-6">Tasks</h1>`
    - Include `<VoiceFABPlaceholder />` (Task 6) positioned fixed
  - [ ] Error state: `<p className="text-red-400 text-sm">Failed to load tasks.</p>` — show when `isError` is true

- [ ] Task 6: Create `VoiceFABPlaceholder` (AC: 6)
  - [ ] Create `frontend/src/features/voice/VoiceFABPlaceholder.tsx`:
    - A `<button>` with classes: `fixed bottom-6 right-6 h-14 w-14 rounded-full bg-violet-500 shadow-lg shadow-violet-500/40 flex items-center justify-center z-50`
    - Contains a mic icon from `lucide-react`: `<Mic className="h-6 w-6 text-white" />`
    - `aria-label="Add task by voice"` — disabled/non-functional for now (`onClick` logs "VoiceFAB placeholder — wired in Story 1.4")
    - `type="button"` to prevent accidental form submission
  - [ ] This component lives in `src/features/voice/` not `tasks/` — following the architecture's feature folder split

- [ ] Task 7: Create stub pages for future routes (AC: 4, 5)
  - [ ] Create `frontend/src/features/tasks/TaskDetail.tsx`: minimal stub — `<div className="min-h-screen bg-zinc-900 text-zinc-50 p-4">Task Detail — coming in Story 1.5</div>`
  - [ ] Create `frontend/src/features/tasks/ArchiveView.tsx`: minimal stub — `<div className="min-h-screen bg-zinc-900 text-zinc-50 p-4">Archive — coming in Story 1.6</div>`
  - [ ] Stubs must be valid React components that compile without TypeScript errors

- [ ] Task 8: Verify Tailwind v4 design tokens are correct (AC: 4)
  - [ ] Tailwind v4 is already set up in this project with `@tailwindcss/vite` plugin — **do NOT add a `tailwind.config.js`** (banned in this project; Tailwind v4 uses CSS-based config via `src/index.css`)
  - [ ] The `src/index.css` already defines `bg-zinc-900`, `bg-zinc-800`, etc. via `@theme inline` and CSS variables — use these token names directly in className strings
  - [ ] Confirm `violet-500` is available as `bg-violet-500` and `text-violet-500` in Tailwind v4 (it is — violet is a built-in Tailwind color)
  - [ ] `bg-amber-500` for overdue border, `text-zinc-400` for secondary text, `text-zinc-50` for primary text — all built-in Tailwind colors, no custom config needed

- [ ] Task 9: Run dev server and verify visually (AC: 1–6)
  - [ ] Start backend: `cd backend && uv run uvicorn app.main:app --reload`
  - [ ] Start frontend: `cd frontend && npm run dev`
  - [ ] Verify task list loads and displays tasks from API
  - [ ] Verify empty state text appears with no tasks
  - [ ] Verify loading skeleton flashes on slow API
  - [ ] Verify violet FAB placeholder is visible bottom-right
  - [ ] Verify TypeScript: `cd frontend && npx tsc --noEmit` — zero errors

- [ ] Task 10: Run frontend lint (AC: all)
  - [ ] `cd frontend && npm run lint` — passes clean

## Dev Notes

### Critical: Tailwind v4 vs v3 Differences

**This project uses Tailwind CSS v4** (v4.3.0 per `package.json`). Tailwind v4 has breaking changes from v3:

- **No `tailwind.config.js`** — configuration is CSS-based in `src/index.css` via `@theme inline` and `@custom-variant`. **Never create a `tailwind.config.js`** — it's explicitly banned in this project.
- **Color tokens:** All zinc, violet, amber, red, green colors are built-in Tailwind v4 colors — use class names directly: `bg-zinc-900`, `bg-violet-500`, `border-amber-500`.
- **Dark mode:** Already configured in `src/index.css` as `@custom-variant dark (&:is(.dark *))`. The `dark:` prefix in classes works. Dark mode class is set on `<html>` in `main.tsx` — do not change this mechanism.
- **`tw-animate-css` is installed** — `animate-pulse` works via this package. Use `animate-pulse` for skeleton loading states.
- **Radix UI import pattern:** The project uses `radix-ui` (unified package), not `@radix-ui/react-*` individual packages. See `button.tsx`: `import { Slot } from "radix-ui"`.

### React Router v7 Patterns

The project uses `react-router` v7.15.1 (not `react-router-dom` — the v7 package merges both). Import from `react-router`:

```typescript
import {
  createBrowserRouter,
  RouterProvider,
  Link,
  useParams,
} from "react-router";
```

**Do not import from `react-router-dom`** — that package is v6 and not installed.

Route definition pattern:

```typescript
// src/router.tsx
import { createBrowserRouter } from 'react-router'
import TaskList from './features/tasks/TaskList'
import TaskDetail from './features/tasks/TaskDetail'
import ArchiveView from './features/tasks/ArchiveView'

export const router = createBrowserRouter([
  { path: '/', element: <TaskList /> },
  { path: '/tasks/:taskId', element: <TaskDetail /> },
  { path: '/archive', element: <ArchiveView /> },
])
```

`main.tsx` update:

```typescript
import { RouterProvider } from 'react-router'
import { router } from './router'
// ...
<QueryClientProvider client={queryClient}>
  <RouterProvider router={router} />
</QueryClientProvider>
```

### TanStack Query v5 Patterns

The project uses TanStack Query v5 (`@tanstack/react-query` 5.100.14). Key v5 changes from v4:

- `useQuery` no longer accepts `onError` callback — use the returned `isError` flag instead
- `isLoading` is true only on the very first load (no cached data); `isFetching` includes background refetches
- Query key must be an array: `['tasks']`

```typescript
// src/features/tasks/useTasks.ts
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Task } from "./types";

export function useTasksQuery() {
  return useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data } = await api.get<Task[]>("/api/v1/tasks/");
      return data;
    },
  });
}
```

### Path Aliases

The project has `@/` path alias configured (see `button.tsx` imports `@/lib/utils`). Use `@/` for imports from `src/`:

- `import api from '@/lib/api'`
- `import { formatDeadline, isOverdue } from '@/lib/dateUtils'`
- `import { OFFSET_LABELS } from '@/lib/offsets'`

### Existing Utilities to Reuse (Do NOT Recreate)

| Utility                             | File                           | Use                                                           |
| ----------------------------------- | ------------------------------ | ------------------------------------------------------------- |
| `formatDeadline(utcIso)`            | `src/lib/dateUtils.ts`         | Format deadline for display as "Mon, Jan 1, 12:00 PM"         |
| `isOverdue(utcIso)`                 | `src/lib/dateUtils.ts`         | Boolean check if deadline is in the past                      |
| `toUtcIso(date)`                    | `src/lib/dateUtils.ts`         | Convert Date to UTC ISO string                                |
| `api` (Axios instance)              | `src/lib/api.ts`               | All HTTP calls — never use raw `fetch()`                      |
| `queryClient`                       | `src/lib/queryClient.ts`       | Already configured with 30s staleTime, 1 retry                |
| `useUIStore` (Zustand)              | `src/lib/store.ts`             | `confirmationSheetOpen`, `activeTaskId`, `trustBannerMessage` |
| `REMINDER_OFFSETS`, `OFFSET_LABELS` | `src/lib/offsets.ts`           | Offset constants (not needed in this story)                   |
| `cn()`                              | `src/lib/utils.ts`             | Combines clsx + tailwind-merge for conditional classes        |
| `Button`                            | `src/components/ui/button.tsx` | Use for any button element — do NOT rebuild                   |

### File Locations (Architecture-Mandated)

```
frontend/src/
  features/
    tasks/
      TaskList.tsx       ← NEW (this story)
      TaskCard.tsx       ← NEW (this story)
      TaskCard.test.tsx  ← NEW (this story)
      TaskDetail.tsx     ← NEW stub (this story)
      ArchiveView.tsx    ← NEW stub (this story)
      useTasks.ts        ← NEW (this story)
      types.ts           ← NEW (this story)
    voice/
      VoiceFABPlaceholder.tsx  ← NEW (this story)
  router.tsx             ← UPDATE (currently empty export)
  main.tsx               ← UPDATE (add RouterProvider)
  App.tsx                ← UPDATE or remove Vite placeholder content
```

**Do NOT put files outside these paths.** Feature folders are `camelCase`, component files are `PascalCase.tsx`, hooks are `camelCase.ts`.

### Lucide React Icons

Lucide React is installed (`lucide-react` in package.json). Import icons like:

```typescript
import { Mic } from "lucide-react";
// Usage: <Mic className="h-6 w-6 text-white" />
```

### Design Spec: TaskCard

From UX component strategy:

- Wrapper: `bg-zinc-800 rounded-2xl px-4 py-3`
- Task name: `text-base font-medium` (16px / 500)
- Deadline metadata: `text-sm text-zinc-400` (13px)
- Overdue: add `border-l-4 border-amber-500` to card wrapper
- New-item ring highlight (`ring-1 ring-violet-500/40`) and swipe gestures come in Story 1.6 — do not implement now

### Design Spec: VoiceFAB Placeholder

From UX component strategy:

- Size: `h-14 w-14` (56px)
- Shape: `rounded-full`
- Position: `fixed bottom-6 right-6 z-50`
- Color: `bg-violet-500`
- Shadow: `shadow-lg shadow-violet-500/40`
- Icon: Mic from lucide-react, `h-6 w-6 text-white`
- This is a placeholder — the full animated VoiceFAB with listening/processing states ships in Story 1.4

### Design Spec: Page Layout

From architecture and UX visual design:

- Page: `min-h-screen bg-zinc-900`
- Content container: `max-w-lg mx-auto px-4` — this gives `max-w-lg` centering on desktop while full-bleed on mobile
- Bottom padding: `pb-24` to prevent last task being obscured by the fixed FAB
- Font: Geist Variable is loaded via `@fontsource-variable/geist` in `index.css` — already applied via `font-sans` body class

### Loading Skeleton Spec

3 placeholder cards in the loading state:

```tsx
{
  [0, 1, 2].map((i) => (
    <div key={i} className="animate-pulse bg-zinc-800 rounded-2xl h-16" />
  ));
}
```

Wrap in `<div className="space-y-2">`.

### Empty State Spec

```tsx
<div className="flex flex-col items-center justify-center pt-20 text-center">
  <p className="text-zinc-500 text-sm">
    Nothing yet. Tap the mic to add your first task.
  </p>
</div>
```

### API Contract Reminder

Backend `GET /api/v1/tasks/` returns `Task[]` (plain array, not wrapped in object). Tasks are already sorted `deadline_at` ascending by the backend service (`list_tasks` in `task_service.py`). No client-side sorting needed.

All fields are `snake_case` — the TypeScript `Task` type must use `snake_case` field names exactly matching the backend.

### What NOT to Implement in This Story

- Voice capture (Story 1.4)
- ConfirmationSheet or offset selection (Story 1.4)
- Task detail navigation — stub only (Story 1.5)
- Task edit (Story 1.5)
- Task completion or archive (Story 1.6)
- Task deletion (Story 1.7)
- Swipe gestures on TaskCard (Story 1.6)
- RecurrenceBadge (future)
- Push notification logic (Epic 2)
- PWA service worker (Story 5.1)

### Deferred Work to Be Aware Of (from deferred-work.md)

- `api.ts` silently falls back to current origin if `VITE_API_BASE_URL` is unset — acceptable for now, fix in production setup
- `formatDeadline` / `isOverdue` don't guard against invalid ISO input — acceptable for now, guard in later story if needed
- `main.tsx` non-null assertion on `#root` — acceptable, will not change

### Testing Notes

- Co-locate tests: `TaskCard.test.tsx` lives next to `TaskCard.tsx` in `src/features/tasks/`
- Testing framework: **vitest** (already installed). Import from `vitest`, not `jest`
- React Testing Library: check if installed; if not, TaskCard visual testing can be deferred to a manual smoke test. Architecture says co-located tests are the pattern but does not specify a specific testing library for this story
- Minimum test coverage: renders task name, renders formatted deadline, overdue flag applies amber border

### Previous Story 1.2 Intelligence

Story 1.2 implemented all 6 backend endpoints including:

- `GET /api/v1/tasks/` — returns `Task[]` sorted by `deadline_at` asc, filtered to active tasks by default
- All responses use `snake_case` JSON fields
- Error envelope: `{"detail": "...", "code": "..."}` for 404s
- Backend is fully operational — the API exists and passes 12 integration tests

The backend `Task` schema (from `backend/app/schemas/task.py`):

```python
class TaskRead(TaskBase):
    id: int
    is_completed: bool
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
```

TypeScript `Task` interface must match `TaskRead` field names exactly.

### Naming & Convention Checklist

- Component files: `PascalCase.tsx`
- Hook files: `useSomething.ts`
- Type files: `types.ts`
- All API fields: `snake_case` (no aliasing to camelCase)
- No `tailwind.config.js` — banned
- No raw `fetch()` — use `api` from `src/lib/api.ts`
- No `@radix-ui/react-*` individual imports — use unified `radix-ui` package

### Files This Story Modifies (UPDATE) vs. Creates (NEW)

**UPDATE (existing files — preserve current behavior):**

- `frontend/src/router.tsx` — current: empty export. Add: route definitions. Preserve: nothing (file is a stub).
- `frontend/src/main.tsx` — current: renders `<App />` with QueryClientProvider and dark mode block. Add: `RouterProvider` wrapping. Preserve: QueryClientProvider wrapper, dark mode system preference block (lines 9–11), StrictMode.
- `frontend/src/App.tsx` — current: Vite placeholder content. Action: replace entire content or stop rendering it (use RouterProvider directly in main.tsx instead). The Vite placeholder must NOT be shown to the user.

**NEW (create from scratch):**

- `frontend/src/features/tasks/types.ts`
- `frontend/src/features/tasks/useTasks.ts`
- `frontend/src/features/tasks/TaskCard.tsx`
- `frontend/src/features/tasks/TaskCard.test.tsx`
- `frontend/src/features/tasks/TaskList.tsx`
- `frontend/src/features/tasks/TaskDetail.tsx` (stub)
- `frontend/src/features/tasks/ArchiveView.tsx` (stub)
- `frontend/src/features/voice/VoiceFABPlaceholder.tsx`

The `src/features/tasks/` and `src/features/voice/` directories already exist (created in Story 1.1 scaffolding). No need to create them.

### Anti-Patterns to Avoid

- ❌ Creating `tailwind.config.js` — Tailwind v4 uses CSS config only
- ❌ Importing from `react-router-dom` — use `react-router` (v7 unified package)
- ❌ Using `@radix-ui/react-*` individual packages — import from `radix-ui`
- ❌ Raw `fetch()` calls — always use `api` from `src/lib/api.ts`
- ❌ camelCase field names in the `Task` interface (`deadlineAt` etc.) — must be `deadline_at`
- ❌ Client-side sorting of tasks — backend already returns them sorted
- ❌ Putting `VoiceFABPlaceholder` in `src/features/tasks/` — it belongs in `src/features/voice/`
- ❌ Implementing ConfirmationSheet, voice, or swipe gestures — those are Story 1.4/1.6
- ❌ Adding `@tanstack/react-query` devtools in production — not required
- ❌ Recreating `formatDeadline` or `isOverdue` — they already exist in `src/lib/dateUtils.ts`
- ❌ `useQuery` with `onError` callback — v5 removed this; use `isError` flag
- ❌ shadcn/ui `Sheet` or `Dialog` in this story — not needed until Story 1.4

### References

- Epic requirements: [epic-1-task-management-foundation.md#story-1.3](../_bmad-output/planning-artifacts/epics/epic-1-task-management-foundation.md)
- Component specs: [component-strategy.md](../_bmad-output/planning-artifacts/ux-design-specification/component-strategy.md)
- Visual design: [visual-design-foundation.md](../_bmad-output/planning-artifacts/ux-design-specification/visual-design-foundation.md)
- Architecture decisions: [core-architectural-decisions.md](../_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md)
- Naming/format/process rules: [implementation-patterns-consistency-rules.md](../_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md)
- File layout: [project-structure-boundaries.md](../_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md)
- Previous story: [1-2-task-data-model-crud-api.md](./1-2-task-data-model-crud-api.md)
- Deferred items: [deferred-work.md](./deferred-work.md)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

### File List

### Review Findings

- [x] [Review][Decision] Completion circle is `sr-only` (invisible) — deferred to Story 1.6 per owner decision; screen-reader-only is acceptable for this story [frontend/src/features/tasks/TaskCard.tsx]
- [x] [Review][Decision] AC3 skeleton 500ms cap — treated as performance expectation only, not enforced constraint; skeletons show until data arrives [frontend/src/features/tasks/TaskList.tsx]
- [x] [Review][Patch] `activeTaskId` typed `string | null` in store but `Task.id` is `number` — fixed to `number | null` [frontend/src/lib/store.ts]
- [x] [Review][Patch] `console.log` in production VoiceFAB onClick — replaced with no-op `() => {}` [frontend/src/features/voice/VoiceFABPlaceholder.tsx]
- [x] [Review][Patch] Error + stale data shown simultaneously — guarded with `isError && !tasks` [frontend/src/features/tasks/TaskList.tsx]
- [x] [Review][Patch] Deadline test matches by className, fragile — updated to assert exact formatted text content [frontend/src/features/tasks/TaskCard.test.tsx]
- [x] [Review][Defer] `isOverdue`/`formatDeadline` don't guard invalid ISO input — `new Date('invalid')` renders "Invalid Date" silently; deferred per spec [frontend/src/lib/dateUtils.ts] — deferred, pre-existing
- [x] [Review][Defer] `VITE_API_BASE_URL` unset falls back to origin silently — deferred per spec notes [frontend/src/lib/api.ts] — deferred, pre-existing
- [x] [Review][Defer] Dark mode only applied once on mount, not reactive to system preference changes — v1 known limitation [frontend/src/main.tsx] — deferred, pre-existing
- [x] [Review][Defer] No error boundary around RouterProvider — blank white screen on component crash; deferred, Epic 1 scope [frontend/src/main.tsx] — deferred, pre-existing
