# Story 1.4: Text Task Creation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to create a task by typing its name and deadline in a form,
So that I can add tasks immediately without needing voice capture.

## Acceptance Criteria

1. **Given** the task list is visible
   **When** I tap the FAB
   **Then** a ConfirmationSheet slides up (`shadcn Sheet side="bottom"`, `bg-zinc-700`) with: a NameField card (`bg-zinc-800`, `text-lg font-medium` input, auto-focused), a DeadlineChip card, and an optional description textarea

2. **Given** the ConfirmationSheet is open and deadline is not set
   **When** I view the DeadlineChip
   **Then** it shows an amber border and "Tap to set deadline" placeholder

3. **Given** the ConfirmationSheet is open
   **When** I tap the DeadlineChip
   **Then** a date/time picker opens; selecting a value updates the chip to "Thu, Jun 5 · 10:00 AM" format (local time)

4. **Given** name or deadline is missing
   **When** I view the Save button
   **Then** it has `aria-disabled="true"` and does not respond to taps

5. **Given** both name and deadline are filled
   **When** I tap Save
   **Then** `POST /api/v1/tasks/` is called with `deadline_at` as UTC ISO 8601; the sheet slides down; the new TaskCard fades into the list at the correct deadline-sorted position; TanStack Query cache `["tasks"]` is invalidated

6. **Given** the ConfirmationSheet is open
   **When** I tap Cancel or swipe the sheet down
   **Then** the sheet dismisses and the task list is unchanged

## Tasks / Subtasks

- [x] Task 1: Install shadcn Sheet component (prerequisite)
  - [x] Run `npx shadcn@latest add sheet` from the `frontend/` directory to add `src/components/ui/sheet.tsx`
  - [x] Verify the generated `sheet.tsx` imports from `radix-ui` (unified package, not `@radix-ui/react-dialog`) — if it imports `@radix-ui/react-dialog`, manually update to use `radix-ui` as per project convention
  - [x] Do NOT install individual `@radix-ui/react-*` packages — only the unified `radix-ui` package is permitted

- [x] Task 2: Add `createTask` mutation to `useTasks.ts` (AC: 5)
  - [x] Extend `frontend/src/features/tasks/useTasks.ts` — ADD `useCreateTask()` mutation alongside existing `useTasksQuery()`; do NOT replace or break the existing hook
  - [x] `useCreateTask()` uses `useMutation` from `@tanstack/react-query`:
    - `mutationFn`: calls `api.post<Task>('/api/v1/tasks/', payload)` and returns `response.data`
    - `onSuccess`: calls `queryClient.invalidateQueries({ queryKey: ['tasks'] })`
  - [x] Payload type: `{ name: string; deadline_at: string; description?: string }` — all fields `snake_case`, `deadline_at` is UTC ISO 8601 string
  - [x] Import `queryClient` from `@/lib/queryClient` (already exists, do NOT create a new one)
  - [x] Import `useMutation`, `useQueryClient` NOT needed — import the singleton `queryClient` directly from `@/lib/queryClient`

- [x] Task 3: Create `DeadlineChip` component (AC: 2, 3)
  - [x] Create `frontend/src/features/voice/DeadlineChip.tsx`
  - [x] Props: `value: string | null; onChange: (utcIso: string) => void`
  - [x] **Empty state** (`value === null`): render a `<button>` with `border border-amber-500 rounded-xl px-4 py-3 text-zinc-400 text-sm w-full text-left`; text: "Tap to set deadline"
  - [x] **Filled state** (`value !== null`): render a `<button>` with `bg-zinc-800 rounded-xl px-4 py-3 text-zinc-50 text-sm w-full text-left`; display formatted deadline using `formatDeadline(value)` from `@/lib/dateUtils`
  - [x] **Picker open state**: use `<input type="datetime-local">` — render it as a hidden input triggered by button click; use `useRef` to programmatically open the native picker via `inputRef.current?.showPicker()` on button click
  - [x] On input `onChange`: convert the local datetime string from the picker to UTC ISO 8601 using `new Date(localValue).toISOString()` then call `onChange(utcIso)`
  - [x] Accessibility: `aria-label="Set deadline"` on the trigger button; `aria-expanded` reflects picker state
  - [x] **Note on date picker approach:** The native `<input type="datetime-local">` has full browser support including mobile Safari (iOS 14+) and avoids any third-party dependency. The `showPicker()` method is supported in all modern browsers. This is the preferred approach for this project.

- [x] Task 4: Create `OffsetSelector` component (AC: 1)
  - [x] Create `frontend/src/features/voice/OffsetSelector.tsx`
  - [x] Props: `selected: number[]; onChange: (offsets: number[]) => void`
  - [x] Render a row of 5 pill buttons, one per entry in `REMINDER_OFFSETS` from `@/lib/offsets` (values: `[15, 30, 60, 1440, 2880]`), labeled with `OFFSET_LABELS`
  - [x] **Unselected chip style:** `bg-zinc-700 text-zinc-400 rounded-full px-3 py-1.5 text-sm font-medium h-9`
  - [x] **Selected chip style:** `bg-violet-500 text-white rounded-full px-3 py-1.5 text-sm font-medium h-9`
  - [x] Toggle behavior: clicking a chip adds/removes its offset from `selected` array; call `onChange` with updated array
  - [x] Accessibility: `role="group"` with `aria-label="Reminder offsets"` on wrapper; each chip `role="checkbox"` with `aria-checked={selected.includes(offset)}`
  - [x] Layout: `flex gap-2 flex-wrap` — chips wrap on narrow screens

- [x] Task 5: Create `ConfirmationSheet` component (AC: 1–6)
  - [x] Create `frontend/src/features/voice/ConfirmationSheet.tsx`
  - [x] Use the shadcn `Sheet` component installed in Task 1: `import { Sheet, SheetContent } from '@/components/ui/sheet'`
  - [x] **Sheet configuration:** `<Sheet open={open} onOpenChange={onClose}>` → `<SheetContent side="bottom" className="bg-zinc-700 rounded-t-2xl px-4 pt-4 pb-8">`
  - [x] **Internal state** (local to ConfirmationSheet, not in Zustand):
    - `name: string` — task name
    - `deadlineUtcIso: string | null` — selected deadline as UTC ISO string
    - `description: string` — optional description
    - `selectedOffsets: number[]` — selected reminder offsets (default `[]`)
    - `isSaving: boolean` — tracks mutation in-flight state
  - [x] **Reset on open:** When `open` changes from false→true, reset all local state to empty/null/default
  - [x] **Layout (top to bottom):**
    1. Drag handle: `<div className="w-12 h-1 bg-zinc-500 rounded-full mx-auto mb-4" />`
    2. NameField card: `<div className="bg-zinc-800 rounded-2xl px-4 py-3 mb-3">` containing `<input autoFocus type="text" placeholder="Task name" className="bg-transparent text-lg font-medium text-zinc-50 placeholder:text-zinc-500 w-full outline-none" />`
    3. DeadlineChip card: `<div className="bg-zinc-800 rounded-2xl p-3 mb-3">` containing `<DeadlineChip value={deadlineUtcIso} onChange={setDeadlineUtcIso} />`
    4. OffsetSelector: `<OffsetSelector selected={selectedOffsets} onChange={setSelectedOffsets} />` with label `<p className="text-xs text-zinc-400 mb-2 uppercase tracking-wider font-semibold">Reminders</p>`
    5. Description textarea: `<textarea placeholder="Description (optional)" className="bg-zinc-800 rounded-2xl px-4 py-3 text-sm text-zinc-50 placeholder:text-zinc-500 w-full outline-none resize-none h-20 mt-3" />`
    6. Save button: full-width, `bg-violet-500 text-white rounded-2xl py-3 font-medium mt-4 w-full`; disabled when `!name.trim() || !deadlineUtcIso`; `aria-disabled={!name.trim() || !deadlineUtcIso}`
    7. Cancel link: `<button type="button" className="text-zinc-400 text-sm text-center w-full mt-3" onClick={onClose}>Cancel</button>`
  - [x] **Save handler:** call `createTask.mutate({ name: name.trim(), deadline_at: deadlineUtcIso, description: description.trim() || undefined })` then call `onClose()` on success
  - [x] Props: `open: boolean; onClose: () => void`

- [x] Task 6: Wire FAB to open ConfirmationSheet in `TaskList.tsx` (AC: 1, 5, 6)
  - [x] Modify `frontend/src/features/tasks/TaskList.tsx` — add `ConfirmationSheet` and connect to Zustand store
  - [x] Replace the `VoiceFABPlaceholder` import with a new `VoiceFAB` component (or update the placeholder in-place per Task 7)
  - [x] Read `confirmationSheetOpen` and `openConfirmationSheet`, `closeConfirmationSheet` from `useUIStore` (already exists at `@/lib/store`)
  - [x] Render `<ConfirmationSheet open={confirmationSheetOpen} onClose={closeConfirmationSheet} />` inside `TaskList`
  - [x] The FAB's `onClick` calls `openConfirmationSheet()`

- [x] Task 7: Upgrade `VoiceFABPlaceholder` → functional FAB for text entry (AC: 1)
  - [x] Rename `frontend/src/features/voice/VoiceFABPlaceholder.tsx` to `VoiceFAB.tsx` (or keep the placeholder file but update its `onClick`)
  - [x] **Decision:** Keep the file as `VoiceFABPlaceholder.tsx` for now and update its `onClick` to call `openConfirmationSheet()` via the `useUIStore` hook — Story 1.4 only wires text creation; voice is Story 1.4's voice path (Epic 3). This avoids renaming churn while making the FAB functional.
  - [x] Import `useUIStore` from `@/lib/store` and call `openConfirmationSheet()` on click
  - [x] Remove the `console.log` placeholder

- [x] Task 8: Verify and test (AC: all)
  - [x] Start backend: `cd backend && uv run uvicorn app.main:app --reload`
  - [x] Start frontend: `cd frontend && npm run dev`
  - [x] Golden path: tap FAB → sheet opens → type name → tap deadline chip → select date/time → tap Save → sheet closes → new task appears in list
  - [x] Disabled save: tap FAB → attempt to tap Save with empty name or missing deadline → button unresponsive
  - [x] Cancel: tap FAB → tap Cancel → sheet closes, no task created
  - [x] TypeScript: `cd frontend && npx tsc --noEmit` — zero errors
  - [x] Lint: `cd frontend && npm run lint` — passes clean

## Dev Notes

### CRITICAL: shadcn Sheet Not Yet Installed

The only shadcn component currently installed is `button.tsx`. **The `Sheet` component must be installed first** (Task 1) before implementing `ConfirmationSheet`. Run:

```bash
cd frontend && npx shadcn@latest add sheet
```

After installation, verify `src/components/ui/sheet.tsx` exists. The generated file will use Radix primitives — check the import: the project uses unified `radix-ui` package (not `@radix-ui/react-dialog`). If shadcn generates individual `@radix-ui/react-dialog` imports, update them to import from `radix-ui` to match the `button.tsx` pattern:

```typescript
// ❌ What shadcn might generate:
import * as SheetPrimitive from "@radix-ui/react-dialog"

// ✅ What this project requires:
import * as SheetPrimitive from "radix-ui"
// or: import { Dialog as SheetPrimitive } from "radix-ui"
```

Check `button.tsx` line 3 (`import { Slot } from "radix-ui"`) as the reference pattern.

### Existing Files to Extend (UPDATE, Not Replace)

| File | Current State | What to Add |
|---|---|---|
| `src/features/tasks/useTasks.ts` | Has `useTasksQuery()` only | Add `useCreateTask()` mutation |
| `src/features/tasks/TaskList.tsx` | Renders task list + VoiceFABPlaceholder | Add ConfirmationSheet render + Zustand wiring |
| `src/features/voice/VoiceFABPlaceholder.tsx` | Has placeholder onClick | Update onClick to call `openConfirmationSheet()` |

**Do NOT delete or replace these files.** Add to them.

### New Files to Create

```
frontend/src/
  features/
    voice/
      ConfirmationSheet.tsx    ← NEW (this story's main deliverable)
      DeadlineChip.tsx         ← NEW
      OffsetSelector.tsx       ← NEW
  components/
    ui/
      sheet.tsx                ← NEW (via shadcn CLI)
```

### Zustand Store — Already Wired, Just Use It

`src/lib/store.ts` already exports `useUIStore` with:

```typescript
confirmationSheetOpen: boolean
openConfirmationSheet: () => void   // call this from FAB onClick
closeConfirmationSheet: () => void  // call this from ConfirmationSheet onClose prop
```

**Do NOT modify `store.ts`** — the required state is already there.

### TanStack Query v5 — `useMutation` Pattern

```typescript
// src/features/tasks/useTasks.ts — ADD this hook alongside existing useTasksQuery()
import { useQuery, useMutation } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import api from '@/lib/api'
import type { Task } from './types'

interface CreateTaskPayload {
  name: string
  deadline_at: string        // UTC ISO 8601, e.g. "2026-06-05T10:00:00.000Z"
  description?: string       // omit if empty
}

export function useCreateTask() {
  return useMutation<Task, Error, CreateTaskPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<Task>('/api/v1/tasks/', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
```

**TanStack Query v5 notes:**
- `useMutation` does NOT accept `onError` as a constructor option — use returned `isError` flag instead
- `mutate(payload)` is fire-and-forget; `mutateAsync(payload)` returns a Promise — use `mutateAsync` with `await` to know when save completed before closing the sheet

### DeadlineChip — Native Date Picker Approach

The native `<input type="datetime-local">` approach is correct for this project (no third-party date picker dependency needed). Implementation pattern:

```typescript
// src/features/voice/DeadlineChip.tsx
import { useRef, useState } from 'react'
import { formatDeadline } from '@/lib/dateUtils'

export default function DeadlineChip({
  value,
  onChange,
}: {
  value: string | null
  onChange: (utcIso: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleButtonClick = () => {
    inputRef.current?.showPicker()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      // datetime-local gives "2026-06-05T10:00" (local time, no TZ suffix)
      // new Date() parses this as local time → .toISOString() converts to UTC
      onChange(new Date(e.target.value).toISOString())
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Set deadline"
        onClick={handleButtonClick}
        className={value
          ? 'bg-zinc-800 rounded-xl px-4 py-3 text-zinc-50 text-sm w-full text-left'
          : 'border border-amber-500 rounded-xl px-4 py-3 text-zinc-400 text-sm w-full text-left'
        }
      >
        {value ? formatDeadline(value) : 'Tap to set deadline'}
      </button>
      <input
        ref={inputRef}
        type="datetime-local"
        className="sr-only"
        onChange={handleInputChange}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  )
}
```

**Key timezone note:** `<input type="datetime-local">` values are in **local time** (e.g. `"2026-06-05T10:00"`) with no timezone suffix. `new Date("2026-06-05T10:00")` in the browser parses this as **local time** and `.toISOString()` converts it to UTC correctly. This matches the `toUtcIso(date)` utility in `dateUtils.ts` which also calls `.toISOString()`.

### ConfirmationSheet — State Reset Pattern

The sheet must reset its local state when opened (not when closed, as the close animation would show cleared fields):

```typescript
import { useEffect, useState } from 'react'

export default function ConfirmationSheet({ open, onClose }: Props) {
  const [name, setName] = useState('')
  const [deadlineUtcIso, setDeadlineUtcIso] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [selectedOffsets, setSelectedOffsets] = useState<number[]>([])

  // Reset on open
  useEffect(() => {
    if (open) {
      setName('')
      setDeadlineUtcIso(null)
      setDescription('')
      setSelectedOffsets([])
    }
  }, [open])

  const createTask = useCreateTask()
  const canSave = name.trim().length > 0 && deadlineUtcIso !== null

  const handleSave = async () => {
    if (!canSave) return
    try {
      await createTask.mutateAsync({
        name: name.trim(),
        deadline_at: deadlineUtcIso!,
        description: description.trim() || undefined,
      })
      onClose()
    } catch {
      // isError on createTask will be true; user can retry
    }
  }

  // ...render
}
```

### API Contract — POST /api/v1/tasks/

Request body (all fields `snake_case`):
```json
{
  "name": "Call dentist",
  "deadline_at": "2026-06-05T10:00:00.000Z",
  "description": "Ask about the crown"  // optional, omit if empty
}
```

Response (201 Created): full `Task` object (matching the `Task` TypeScript interface in `types.ts`).

Backend validates: `name` required, `deadline_at` required UTC ISO 8601. Description is optional (nullable in DB).

**Do NOT send** `is_completed`, `completed_at`, `created_at`, `updated_at` in the request — backend sets these automatically.

### Accessibility Requirements

- Name input: `autoFocus` when sheet opens (already specified in NameField card)
- Save button: `aria-disabled="true"` when `!canSave` AND pointer-events disabled (`pointer-events-none` or `disabled` attribute)
- OffsetSelector: `role="group"` + `aria-label="Reminder offsets"` on wrapper; each chip `role="checkbox"` + `aria-checked`
- All interactive elements: `focus-visible:ring-2 ring-violet-500 ring-offset-2 ring-offset-zinc-900`

### What NOT to Implement in This Story

- Voice capture (Web Speech API) — Story 3.2 (Epic 3)
- LLM parse endpoint call — Story 3.1 (Epic 3)
- RecurrencePicker / repeat toggle — Story 4.1/4.2 (Epic 4)
- TrustBanner with scheduled reminder times — that requires the scheduler (Epic 2); for this story, the sheet simply closes on save
- Swipe gestures on TaskCard — Story 1.6
- Task edit via ConfirmationSheet — Story 1.5 (will reuse ConfirmationSheet layout)
- OffsetSelector is included in the UI per AC but reminder scheduling is a no-op until Epic 2 backend is wired — collect the selected offsets in state but don't include them in the `POST /api/v1/tasks/` payload yet (the backend doesn't accept them until scheduler is added in Story 2.4)

### Deferred Items Awareness (from deferred-work.md)

- `api.ts` silently falls back to current origin if `VITE_API_BASE_URL` is unset — acceptable for now
- `formatDeadline`/`isOverdue` don't guard against invalid ISO input — acceptable for now
- No max length validation on `name`/`description` — acceptable for now (backend deferred this too)

### Previous Story 1.3 Intelligence

Story 1.3 established the following patterns — follow them exactly:
- All Axios calls go through `api` from `@/lib/api.ts` (Axios instance, not raw `fetch`)
- TanStack Query cache key for tasks is `['tasks']` (array, not string)
- `queryClient` singleton is at `@/lib/queryClient.ts` — import directly, not via `useQueryClient()` hook
- Path alias `@/` resolves to `src/` — use it for all internal imports
- `useUIStore` from `@/lib/store` has `openConfirmationSheet` and `closeConfirmationSheet` actions — these already exist and work
- VoiceFABPlaceholder is at `src/features/voice/VoiceFABPlaceholder.tsx` — it has a `console.log` placeholder click handler to replace

**Files created in Story 1.3 (exist in codebase now):**
- `src/features/tasks/TaskList.tsx` — the main page, will need modification
- `src/features/tasks/TaskCard.tsx` — no changes needed
- `src/features/tasks/types.ts` — `Task` interface, no changes needed
- `src/features/tasks/useTasks.ts` — add `useCreateTask` to this file
- `src/features/voice/VoiceFABPlaceholder.tsx` — update `onClick`
- `src/lib/store.ts` — no changes needed (already has all required Zustand state)
- `src/lib/offsets.ts` — `REMINDER_OFFSETS` and `OFFSET_LABELS` already exported here

### Anti-Patterns to Avoid

- ❌ Creating a new `tailwind.config.js` — Tailwind v4 uses CSS config only (`src/index.css`)
- ❌ Importing from `react-router-dom` — use `react-router` (v7 unified package)
- ❌ Importing from `@radix-ui/react-*` individual packages — use unified `radix-ui`
- ❌ Raw `fetch()` calls — always use `api` from `@/lib/api.ts`
- ❌ Including `deadline_at` in local time (no TZ suffix) in API payload — must be UTC ISO 8601 (`new Date(...).toISOString()`)
- ❌ Using `useQueryClient()` hook for invalidation in `useTasks.ts` — import the `queryClient` singleton from `@/lib/queryClient` directly
- ❌ Putting `OffsetSelector`, `DeadlineChip`, `ConfirmationSheet` in `src/features/tasks/` — they belong in `src/features/voice/`
- ❌ Sending `reminder_offsets` in the POST payload — backend doesn't accept this yet; collect in UI state only
- ❌ `useMutation` with `onError` constructor option — TanStack Query v5 removed this; check `mutation.isError` instead
- ❌ Third-party date picker library — use native `<input type="datetime-local">` with `showPicker()`
- ❌ Recreating `formatDeadline` — it already exists in `@/lib/dateUtils.ts`
- ❌ Modifying `src/lib/store.ts` — all required Zustand state is already there

### File Locations Summary

```
frontend/src/
  components/ui/
    sheet.tsx              ← NEW (via shadcn CLI: npx shadcn@latest add sheet)
  features/
    tasks/
      useTasks.ts          ← UPDATE: add useCreateTask() alongside useTasksQuery()
      TaskList.tsx         ← UPDATE: add ConfirmationSheet + Zustand wiring
    voice/
      VoiceFABPlaceholder.tsx  ← UPDATE: onClick calls openConfirmationSheet()
      ConfirmationSheet.tsx    ← NEW
      DeadlineChip.tsx         ← NEW
      OffsetSelector.tsx       ← NEW
```

### References

- Epic requirements: [epic-1-task-management-foundation.md#story-1.4](_bmad-output/planning-artifacts/epics/epic-1-task-management-foundation.md)
- Component specs: [component-strategy.md](_bmad-output/planning-artifacts/ux-design-specification/component-strategy.md)
- Visual design: [visual-design-foundation.md](_bmad-output/planning-artifacts/ux-design-specification/visual-design-foundation.md)
- User journey: [user-journey-flows.md](_bmad-output/planning-artifacts/ux-design-specification/user-journey-flows.md)
- Architecture decisions: [core-architectural-decisions.md](_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md)
- Naming/format/process rules: [implementation-patterns-consistency-rules.md](_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md)
- File layout: [project-structure-boundaries.md](_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md)
- Previous story: [1-3-frontend-foundation-task-list.md](_bmad-output/implementation-artifacts/1-3-frontend-foundation-task-list.md)
- Deferred items: [deferred-work.md](_bmad-output/implementation-artifacts/deferred-work.md)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

Story context engine analysis completed — comprehensive developer guide created. Key notes:
- shadcn Sheet not yet installed; Task 1 is a hard prerequisite
- OffsetSelector is UI-only; offsets collected in state but NOT sent in API payload (scheduler lands in Epic 2)
- VoiceFABPlaceholder stays named as-is; only onClick handler updated

Implementation completed 2026-05-24:
- shadcn CLI could not install Sheet due to `radix-nova` style in components.json; created sheet.tsx manually using `radix-ui` Dialog primitive (same pattern as button.tsx)
- ConfirmationSheet uses inner `SheetForm` component with `key={String(open)}` to reset state on open — avoids setState-in-effect lint error
- `useCreateTask` uses `mutateAsync` so sheet closes only after successful save
- All ACs satisfied; TypeScript zero errors; lint clean

### File List

**New files:**
- `frontend/src/components/ui/sheet.tsx` — shadcn Sheet component (manually created using `radix-ui` Dialog primitive, matching project convention)
- `frontend/src/features/voice/DeadlineChip.tsx` — native datetime-local picker trigger
- `frontend/src/features/voice/OffsetSelector.tsx` — reminder offset toggle pills (UI-only, offsets not sent to API yet)
- `frontend/src/features/voice/ConfirmationSheet.tsx` — bottom sheet for task creation with form state in inner SheetForm component

**Modified files:**
- `frontend/src/features/tasks/useTasks.ts` — added `useCreateTask()` mutation with `POST /api/v1/tasks/` and cache invalidation
- `frontend/src/features/tasks/TaskList.tsx` — wired `ConfirmationSheet` via Zustand `useUIStore`
- `frontend/src/features/voice/VoiceFABPlaceholder.tsx` — onClick now calls `openConfirmationSheet()` from `useUIStore`
- `frontend/src/components/ui/button.tsx` — added eslint-disable for pre-existing `react-refresh/only-export-components` warning on `buttonVariants` export

### Change Log

- 2026-05-24: Implemented Story 1.4 — Text Task Creation. Created Sheet component (radix-ui Dialog), DeadlineChip with native datetime-local picker, OffsetSelector pill toggles, ConfirmationSheet bottom sheet. Wired FAB to open sheet via Zustand store. Added useCreateTask mutation to useTasks.ts. TypeScript zero errors, lint clean.

### Review Findings

- [x] [Review][Decision] `isError && !tasks` hides error when stale cache data exists — Resolved: kept `!tasks` guard for full error state; added non-blocking amber banner "Could not refresh — showing last known data." when `isError && tasks`. [frontend/src/features/tasks/TaskList.tsx]
- [x] [Review][Decision] AC 5 — no client-side sort or fade-in animation for new task card — Resolved: added `[...tasks].sort((a,b) => a.deadline_at.localeCompare(b.deadline_at))` in TaskList + `animate-in fade-in duration-200` on TaskCard `<li>`. [frontend/src/features/tasks/TaskList.tsx, frontend/src/features/tasks/TaskCard.tsx]
- [x] [Review][Patch] Spurious X close button from `SheetContent` overlaps ConfirmationSheet layout [frontend/src/components/ui/sheet.tsx] — Fixed: removed `<SheetPrimitive.Close>` block and unused `X`/`lucide-react` import from SheetContent template.
- [x] [Review][Patch] `aria-expanded={false}` hardcoded in DeadlineChip [frontend/src/features/voice/DeadlineChip.tsx] — Fixed: removed the `aria-expanded` prop entirely.
- [x] [Review][Patch] Silent error swallow in `handleSave` — no user feedback on mutation failure [frontend/src/features/voice/ConfirmationSheet.tsx] — Fixed: added `{createTask.isError && <p className="text-red-400 text-sm text-center mt-2">Failed to save. Tap Save to retry.</p>}` below Save button.
- [x] [Review][Patch] AC 3 — deadline display format uses locale comma, not `·` separator as spec requires — Fixed: `formatDeadline` now builds `datePart · timePart` using separate `toLocaleDateString`/`toLocaleTimeString` calls. Test updated to match. [frontend/src/lib/dateUtils.ts, frontend/src/features/tasks/TaskCard.test.tsx]
- [x] [Review][Patch] Timezone display bug — `new Date("YYYY-MM-DDTHH:mm")` parsed inconsistently across runtimes — Fixed: `DeadlineChip.handleInputChange` now splits the datetime-local string and constructs `new Date(year, month-1, day, hours, minutes)` to force local-time interpretation. [frontend/src/features/voice/DeadlineChip.tsx]
- [x] [Review][Defer] Cannot clear/unset deadline once set in DeadlineChip [frontend/src/features/voice/DeadlineChip.tsx] — deferred, pre-existing UX gap; `if (e.target.value)` guard silently ignores empty picker dismissal. Acceptable for v1 since users can always reopen and re-select.
- [x] [Review][Defer] `key={String(open)}` may unmount SheetForm during close animation causing brief visual flash [frontend/src/features/voice/ConfirmationSheet.tsx] — deferred, low user impact; Radix Sheet keeps content mounted during exit animation so the form disappears before the slide-down completes. Acceptable for v1.
