import { useState } from 'react'
import { Archive } from 'lucide-react'
import { useTasksQuery } from './useTasks'
import TaskCard from './TaskCard'
import ArchiveSheet from './ArchiveSheet'
import VoiceFABPlaceholder from '@/features/voice/VoiceFABPlaceholder'
import ConfirmationSheet from '@/features/voice/ConfirmationSheet'
import { useUIStore } from '@/lib/store'

export default function TaskList() {
  const { data: tasks, isLoading, isError } = useTasksQuery()
  const { confirmationSheetOpen, closeConfirmationSheet } = useUIStore()
  const [archiveOpen, setArchiveOpen] = useState(false)

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
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

        {isLoading && (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse bg-zinc-800 rounded-2xl h-16" />
            ))}
          </div>
        )}

        {isError && !tasks && (
          <p className="text-red-400 text-sm">Failed to load tasks.</p>
        )}

        {isError && tasks && (
          <p className="text-amber-400 text-xs mb-3">Could not refresh — showing last known data.</p>
        )}

        {!isLoading && tasks && tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-20 text-center">
            <p className="text-zinc-500 text-sm">All done. Nice.</p>
          </div>
        )}

        {!isLoading && tasks && tasks.length > 0 && (
          <ul role="list" className="space-y-2">
            {[...tasks]
              .sort((a, b) => a.deadline_at.localeCompare(b.deadline_at))
              .map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
          </ul>
        )}
      </div>

      <VoiceFABPlaceholder />
      <ConfirmationSheet open={confirmationSheetOpen} onClose={closeConfirmationSheet} />
      <ArchiveSheet open={archiveOpen} onClose={() => setArchiveOpen(false)} />
    </div>
  )
}
