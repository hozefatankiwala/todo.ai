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

  if (isNaN(id)) {
    return (
      <div className="min-h-screen bg-zinc-900">
        <div className="max-w-lg mx-auto px-4 pt-6">
          <p className="text-red-400 text-sm mb-4">Task not found.</p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-violet-400 text-sm focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 rounded"
          >
            ← Back to tasks
          </button>
        </div>
      </div>
    )
  }

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
            className="text-violet-400 text-sm focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 rounded"
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
          <h1 className="text-xl font-semibold text-zinc-50">{task!.name}</h1>
        </div>

        {/* Deadline */}
        <time
          dateTime={task!.deadline_at}
          className="text-sm text-zinc-400 block"
        >
          {formatDeadline(task!.deadline_at)}
        </time>

        {/* Description (conditional) */}
        {task!.description && (
          <p className="text-sm text-zinc-400 mt-4 leading-normal">{task!.description}</p>
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

      <EditSheet open={editOpen} onClose={() => setEditOpen(false)} task={task!} />
    </div>
  )
}
