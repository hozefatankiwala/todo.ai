import { useTasksQuery } from './useTasks'
import TaskCard from './TaskCard'
import VoiceFABPlaceholder from '@/features/voice/VoiceFABPlaceholder'
import ConfirmationSheet from '@/features/voice/ConfirmationSheet'
import { useUIStore } from '@/lib/store'

export default function TaskList() {
  const { data: tasks, isLoading, isError } = useTasksQuery()
  const { confirmationSheetOpen, closeConfirmationSheet } = useUIStore()

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
        <h1 className="text-xl font-semibold text-zinc-50 mb-6">Tasks</h1>

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

        {!isLoading && !isError && tasks && tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-20 text-center">
            <p className="text-zinc-500 text-sm">Nothing yet. Tap the mic to add your first task.</p>
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
    </div>
  )
}
