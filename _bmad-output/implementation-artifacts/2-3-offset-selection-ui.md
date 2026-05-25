# Story 2.3: Offset Selection UI

Status: ready-for-dev

## Story

As a user,
I want to select one or more reminder offsets when creating or editing a task,
so that I can control exactly how far in advance I am reminded.

## Acceptance Criteria

1. **Given** the ConfirmationSheet is open (text creation or edit)
   **When** I view the offset section
   **Then** an OffsetSelector row shows 5 pill chips: 15m · 30m · 1h · 1d · 2d; none are selected by default
   **And** the chips use `role="group" aria-label="Reminder offsets"`; each chip uses `role="checkbox"` with `aria-checked`

2. **Given** the OffsetSelector is visible
   **When** I tap a chip
   **Then** it toggles to selected state (`bg-violet-500 text-white`); tapping again deselects it (`bg-zinc-700 text-zinc-400`)
   **And** multiple chips can be selected simultaneously

3. **Given** a chip is selected whose offset falls before the current time relative to the task deadline
   **When** I tap Save
   **Then** a non-blocking inline warning appears ("This reminder is in the past") but Save is not blocked

4. **Given** the task edit view is open for an existing task
   **When** the OffsetSelector renders
   **Then** chips corresponding to the task's existing offsets are pre-selected

5. **Given** the task model
   **When** offsets are stored
   **Then** they are persisted as an array of integer minutes: `[15, 30, 60, 1440, 2880]`; the `tasks` table gains an `offsets` column (JSON or comma-separated integers); an Alembic migration is created

## Tasks / Subtasks

- [ ] Task 1: Add `offsets` column to Task model and generate Alembic migration (AC: 5)
  - [ ] In `backend/app/models/task.py`, add `offsets: Mapped[str | None] = mapped_column(Text, nullable=True)` — store as JSON string (e.g. `"[15, 60]"`)
  - [ ] Generate migration: `cd backend && uv run alembic revision --autogenerate -m "add offsets to tasks"`
  - [ ] Review the migration in `alembic/versions/` — ensure it adds `offsets TEXT` to `tasks` with `nullable=True`
  - [ ] Apply migration: `cd backend && uv run alembic upgrade head`
  - [ ] Verify: `uv run python -c "import sqlite3; c=sqlite3.connect('simple-todo.db'); print(c.execute('PRAGMA table_info(tasks)').fetchall())"` — `offsets` column must appear

- [ ] Task 2: Update Pydantic schemas to include offsets field (AC: 5)
  - [ ] In `backend/app/schemas/task.py`, add `offsets: list[int] = []` to `TaskCreate`
  - [ ] In `backend/app/schemas/task.py`, add `offsets: list[int] | None = None` to `TaskUpdate`
  - [ ] In `backend/app/schemas/task.py`, add `offsets: list[int] = []` to `TaskRead` with a `@field_validator` (or `@model_validator`) that deserializes the JSON string from DB to `list[int]`
  - [ ] Add helper: a `@model_validator(mode='after')` in `TaskRead` that parses `offsets` from JSON string (`json.loads(task.offsets or "[]")`) since SQLAlchemy returns a raw string from `Text` column, not a Python list
  - [ ] Serialization note: `TaskCreate` and `TaskUpdate` receive `list[int]` from JSON body — before writing to DB, `task_service` must serialize to `json.dumps(offsets)` (see Task 3)

- [ ] Task 3: Update task_service to serialize/deserialize offsets (AC: 5)
  - [ ] In `backend/app/services/task_service.py`, in `create_task`: serialize `data.offsets` to JSON string before creating `Task` — use `json.dumps(data.offsets)` and set `task.offsets = json.dumps(data.offsets)`
  - [ ] Use `model_dump(exclude={"offsets"})` when constructing Task kwargs, then set `offsets` separately: `task = Task(**data.model_dump(exclude={"offsets"}), offsets=json.dumps(data.offsets))`
  - [ ] In `update_task`: if `offsets` is in the update payload, serialize it: `setattr(task, "offsets", json.dumps(value))` (not raw list)
  - [ ] Add `import json` to task_service

- [ ] Task 4: Frontend — update Task type to include offsets (AC: 1, 2, 4, 5)
  - [ ] In `frontend/src/features/tasks/types.ts`, add `offsets: number[]` to the `Task` interface

- [ ] Task 5: Frontend — wire OffsetSelector into CreateTaskPayload and useTasks (AC: 1, 2, 5)
  - [ ] In `frontend/src/features/tasks/useTasks.ts`, add `offsets?: number[]` to `CreateTaskPayload` interface
  - [ ] In `frontend/src/features/tasks/useTasks.ts`, add `offsets?: number[]` to `UpdateTaskPayload` interface

- [ ] Task 6: Frontend — wire ConfirmationSheet to pass offsets to createTask (AC: 1, 2, 3, 5)
  - [ ] In `frontend/src/features/voice/ConfirmationSheet.tsx`, the `selectedOffsets` state already exists — wire it into the `createTask.mutateAsync` call: add `offsets: selectedOffsets` to the payload
  - [ ] Add past-deadline warning logic in `handleSave`: before calling `createTask.mutateAsync`, check if any selected offset would fire in the past: `selectedOffsets.some(offset => deadlineUtcIso && new Date(deadlineUtcIso).getTime() - offset * 60_000 < Date.now())`
  - [ ] If warning condition is true, set a local state `hasPastWarning = true` and render inline warning text: `"This reminder is in the past"` in amber/warning color below the OffsetSelector — Save is NOT blocked

- [ ] Task 7: Frontend — wire EditSheet to pre-populate and pass offsets to updateTask (AC: 2, 3, 4, 5)
  - [ ] In `frontend/src/features/voice/EditSheet.tsx`, add `selectedOffsets` state initialized from `task.offsets ?? []`
  - [ ] Import and render `OffsetSelector` in `EditForm` (same as ConfirmationSheet — after DeadlineChip, before Description)
  - [ ] Wire `selectedOffsets` into `updateTask.mutateAsync` payload: add `offsets: selectedOffsets` to `payload`
  - [ ] Add same past-deadline warning logic as ConfirmationSheet (AC: 3)

- [ ] Task 8: Backend tests for offsets (AC: 5)
  - [ ] In `backend/tests/test_tasks.py`, add test: `POST /api/v1/tasks/` with `{"offsets": [15, 60]}` → response includes `"offsets": [15, 60]`
  - [ ] Add test: `POST /api/v1/tasks/` with no offsets field → response includes `"offsets": []`
  - [ ] Add test: `PATCH /api/v1/tasks/{id}` with `{"offsets": [1440]}` → response includes `"offsets": [1440]`
  - [ ] Add test: `GET /api/v1/tasks/{id}` for task created with offsets → returns correct offsets array

- [ ] Task 9: Frontend tests for OffsetSelector integration (AC: 1, 2, 4)
  - [ ] In `frontend/src/features/tasks/TaskCard.test.tsx` (or a new `OffsetSelector.test.tsx` co-located with OffsetSelector): test that OffsetSelector renders 5 chips with correct labels
  - [ ] Test: clicking a chip toggles selection; `aria-checked` reflects state
  - [ ] Test: pre-selected offsets render chips in selected state

- [ ] Task 10: Run all tests and verify (AC: 1–5)
  - [ ] `cd backend && uv run pytest tests/ -v` — all tests pass (existing + new)
  - [ ] `cd backend && uv run ruff check app/` — lint clean
  - [ ] `cd frontend && npm test -- --run` — all frontend tests pass

## Dev Notes

### Critical Context: What Already Exists

**OffsetSelector component is ALREADY BUILT** at `frontend/src/features/voice/OffsetSelector.tsx`:
- Already renders 5 chips using `REMINDER_OFFSETS` from `src/lib/offsets.ts` (`[15, 30, 60, 1440, 2880]`)
- Already has `role="group" aria-label="Reminder offsets"` and `role="checkbox"` with `aria-checked` on each chip
- Already has correct toggle logic and selected/deselected visual states (`bg-violet-500` / `bg-zinc-700`)
- Takes `{ selected: number[], onChange: (offsets: number[]) => void }` props

**OffsetSelector is ALREADY IN ConfirmationSheet** (`frontend/src/features/voice/ConfirmationSheet.tsx`):
- `selectedOffsets` state already exists (`useState<number[]>([])`)
- `OffsetSelector` is already rendered — visually complete
- **Gap**: `selectedOffsets` is NOT passed to `createTask.mutateAsync` — the payload only sends `name`, `deadline_at`, `description`
- **Gap**: No past-deadline warning is implemented

**OffsetSelector is NOT in EditSheet** (`frontend/src/features/voice/EditSheet.tsx`):
- Currently has: name field, DeadlineChip, description textarea, Save/Cancel buttons
- Must add: `selectedOffsets` state (initialized from `task.offsets`), OffsetSelector render, pass offsets to update payload

**offsets.ts lib** at `frontend/src/lib/offsets.ts` is complete and correct.

### Backend: Offsets Storage Strategy

Store offsets as a JSON string in a `TEXT` column. This avoids a separate join table and is appropriate for this single-user app. The integer array `[15, 60, 1440]` serializes to `"[15, 60, 1440]"` via `json.dumps()` and deserializes via `json.loads()`.

**Why not a separate table?** Story 2.4 (scheduling on mutations) calls `scheduler_service.schedule_reminders(task)` which iterates `task.offsets`. Keeping offsets on the task model means no extra DB query in the scheduler path.

**SQLAlchemy limitation:** `Text` column returns a raw string — SQLAlchemy will NOT auto-deserialize `"[15, 60]"` to `[15, 60]`. The `TaskRead` Pydantic model must handle this in a validator.

### TaskRead Validator Pattern

```python
# backend/app/schemas/task.py
import json

class TaskRead(BaseModel):
    ...
    offsets: list[int] = []

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode='after')
    def attach_utc(self) -> 'TaskRead':
        # existing UTC logic...
        return self

    @field_validator('offsets', mode='before')
    @classmethod
    def parse_offsets(cls, v) -> list[int]:
        if v is None:
            return []
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, ValueError):
                return []
        return []
```

Note: `field_validator` with `mode='before'` runs before Pydantic's own type coercion, so it receives the raw DB string. Import `field_validator` from `pydantic`.

### task_service.py: create_task Pattern

```python
# backend/app/services/task_service.py
import json

async def create_task(db: AsyncSession, data: TaskCreate) -> Task:
    task = Task(
        **data.model_dump(exclude={"offsets"}),
        offsets=json.dumps(data.offsets),
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task
```

### task_service.py: update_task Pattern

```python
async def update_task(db: AsyncSession, task_id: int, data: TaskUpdate) -> Task | None:
    task = await get_task(db, task_id)
    if task is None:
        return None
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        if field == "offsets":
            task.offsets = json.dumps(value)  # serialize list → JSON string
        elif field in _TASK_UPDATE_FIELDS:
            setattr(task, field, value)
    task.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(task)
    return task
```

Update `_TASK_UPDATE_FIELDS` to include `"offsets"` OR handle it specially as shown above. The special-case approach is safer.

### EditSheet: Adding OffsetSelector

```tsx
// frontend/src/features/voice/EditSheet.tsx
import OffsetSelector from './OffsetSelector'

function EditForm({ task, onClose }: EditFormProps) {
  const [selectedOffsets, setSelectedOffsets] = useState<number[]>(task.offsets ?? [])
  // ... existing state ...

  const handleSave = async () => {
    // ... existing logic ...
    // Add offsets to payload only if changed
    const currentOffsets = task.offsets ?? []
    if (JSON.stringify(selectedOffsets.sort()) !== JSON.stringify([...currentOffsets].sort())) {
      payload.offsets = selectedOffsets
    }
    // ... rest of save ...
  }

  return (
    <>
      {/* after DeadlineChip, before Description textarea */}
      <p className="text-xs text-zinc-400 mb-2 mt-3 uppercase tracking-wider font-semibold">
        Reminders
      </p>
      <OffsetSelector selected={selectedOffsets} onChange={setSelectedOffsets} />
      {/* ... Description ... */}
    </>
  )
}
```

### Past-Deadline Warning Logic

```tsx
// In both ConfirmationSheet and EditSheet
const [hasPastWarning, setHasPastWarning] = useState(false)

const handleSave = async () => {
  if (!canSave) return

  // Check for past reminders
  const now = Date.now()
  const hasPast = selectedOffsets.some(
    (offset) => deadlineUtcIso && new Date(deadlineUtcIso).getTime() - offset * 60_000 < now
  )
  setHasPastWarning(hasPast)  // show warning but do NOT block save

  try {
    await createTask.mutateAsync({ name, deadline_at: deadlineUtcIso!, description, offsets: selectedOffsets })
    onClose()
  } catch { /* error rendered below */ }
}

// In JSX, after OffsetSelector:
{hasPastWarning && (
  <p className="text-amber-400 text-sm mt-2">This reminder is in the past</p>
)}
```

### Files Being Modified

| File | Current State | Story 2.3 Changes |
|---|---|---|
| `backend/app/models/task.py` | No `offsets` column | ADD `offsets: Mapped[str \| None]` Text column |
| `backend/app/schemas/task.py` | No offsets field | ADD `offsets` to TaskCreate, TaskUpdate, TaskRead + field_validator |
| `backend/app/services/task_service.py` | Creates Task from `data.model_dump()` | UPDATE to serialize offsets via json.dumps |
| `frontend/src/features/tasks/types.ts` | No `offsets` field | ADD `offsets: number[]` |
| `frontend/src/features/tasks/useTasks.ts` | No offsets in payloads | ADD `offsets?: number[]` to CreateTaskPayload and UpdateTaskPayload |
| `frontend/src/features/voice/ConfirmationSheet.tsx` | `selectedOffsets` state exists but not passed to API | WIRE offsets to mutateAsync + add past-warning |
| `frontend/src/features/voice/EditSheet.tsx` | No OffsetSelector | ADD OffsetSelector, state, wire to update payload + past-warning |
| `backend/tests/test_tasks.py` | Existing task tests (no offsets) | ADD offsets test cases |

**New files:**
- `backend/alembic/versions/<hash>_add_offsets_to_tasks.py` (auto-generated)
- `frontend/src/features/voice/OffsetSelector.test.tsx` (new — co-located with OffsetSelector.tsx)

### Existing Tests: Backward Compatibility

The existing `test_create_task_returns_all_fields` test does NOT include `offsets` in its assertion. After this story, the response will include `"offsets": []`. The test will still pass since it asserts specific fields, not the absence of others. **No existing test changes needed** — only additions.

### Anti-Patterns to Avoid

- ❌ Storing offsets as a separate table — overengineered for this single-user app; JSON string in Text column is correct
- ❌ Using `json.loads()` in the SQLAlchemy model layer — deserialization belongs in Pydantic schema (`field_validator`)
- ❌ Passing `offsets` as a raw Python list to `Task(**data.model_dump())` — SQLAlchemy will reject a list for a `Text` column; serialize first
- ❌ Blocking Save when a past-reminder warning is shown — AC explicitly says Save is not blocked
- ❌ Initializing `selectedOffsets` in EditSheet from `task.offsets` without null guard — use `task.offsets ?? []`
- ❌ Re-implementing OffsetSelector — it already exists at `src/features/voice/OffsetSelector.tsx` and is complete
- ❌ Adding offsets to `_TASK_UPDATE_FIELDS` frozenset without special-casing serialization — it will try to `setattr(task, "offsets", [15, 60])` which fails for a Text column

### References

- Epic requirements: [epic-2-push-notifications-reminders.md](../planning-artifacts/epics/epic-2-push-notifications-reminders.md) — Story 2.3 section
- Architecture: [core-architectural-decisions.md](../planning-artifacts/architecture/core-architectural-decisions.md)
- Project structure: [project-structure-boundaries.md](../planning-artifacts/architecture/project-structure-boundaries.md)
- Implementation patterns: [implementation-patterns-consistency-rules.md](../planning-artifacts/architecture/implementation-patterns-consistency-rules.md)
- Previous story (2-2): [2-2-push-subscription-vapid-backend.md](2-2-push-subscription-vapid-backend.md)
- Existing OffsetSelector: `frontend/src/features/voice/OffsetSelector.tsx`
- Offset constants: `frontend/src/lib/offsets.ts`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

Ultimate context engine analysis completed — comprehensive developer guide created.

### File List

### Change Log

- 2026-05-25: Story created — offset selection UI wiring + backend offsets column.
