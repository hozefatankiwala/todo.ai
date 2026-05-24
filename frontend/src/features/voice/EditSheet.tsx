import { useState } from 'react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useUpdateTask } from '@/features/tasks/useTasks'
import DeadlineChip from './DeadlineChip'
import type { Task } from '@/features/tasks/types'

interface EditSheetProps {
  open: boolean
  onClose: () => void
  task: Task
}

interface EditFormProps {
  task: Task
  onClose: () => void
}

function EditForm({ task, onClose }: EditFormProps) {
  const [name, setName] = useState(task.name)
  const [deadlineUtcIso, setDeadlineUtcIso] = useState(task.deadline_at)
  const [description, setDescription] = useState(task.description ?? '')
  const updateTask = useUpdateTask()

  const canSave = name.trim().length > 0 && deadlineUtcIso.length > 0

  const handleSave = async () => {
    if (!canSave) return
    const trimmedName = name.trim()
    const trimmedDesc = description.trim() || null
    const payload: Parameters<typeof updateTask.mutateAsync>[0] = { id: task.id }
    if (trimmedName !== task.name) payload.name = trimmedName
    if (deadlineUtcIso !== task.deadline_at) payload.deadline_at = deadlineUtcIso
    if (trimmedDesc !== (task.description ?? null)) payload.description = trimmedDesc
    try {
      await updateTask.mutateAsync(payload)
      onClose()
    } catch {
      // updateTask.isError is true; error message rendered below
    }
  }

  return (
    <>
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
          className="bg-transparent text-lg font-medium text-zinc-50 placeholder:text-zinc-500 w-full outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-700 rounded"
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
        className="bg-zinc-800 rounded-2xl px-4 py-3 text-sm text-zinc-50 placeholder:text-zinc-500 w-full outline-none resize-none h-20 mt-3 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-700 rounded-2xl"
      />

      {updateTask.isError && (
        <p className="text-red-400 text-sm mt-2">Failed to save. Please try again.</p>
      )}

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={!canSave || updateTask.isPending}
        aria-disabled={!canSave || updateTask.isPending}
        className="bg-violet-500 text-white rounded-2xl py-3 font-medium mt-4 w-full disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
      >
        {updateTask.isPending ? 'Saving…' : 'Save'}
      </button>

      {/* Cancel */}
      <button
        type="button"
        onClick={onClose}
        className="text-zinc-400 text-sm text-center w-full mt-3 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
      >
        Cancel
      </button>
    </>
  )
}

export default function EditSheet({ open, onClose, task }: EditSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="bg-zinc-700 rounded-t-2xl px-4 pt-4 pb-8 border-0">
        {/* key=open+task.id resets form state each time the sheet opens or a different task is loaded */}
        <EditForm key={`${open}-${task.id}`} task={task} onClose={onClose} />
      </SheetContent>
    </Sheet>
  )
}
