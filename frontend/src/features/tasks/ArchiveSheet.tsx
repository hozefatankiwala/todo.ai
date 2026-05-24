import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useArchiveQuery } from './useTasks'
import { formatCompletedAt } from '@/lib/dateUtils'

interface ArchiveSheetProps {
  open: boolean
  onClose: () => void
}

export default function ArchiveSheet({ open, onClose }: ArchiveSheetProps) {
  const { data: tasks, isLoading } = useArchiveQuery(open)

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="bg-zinc-900 rounded-t-2xl px-4 pt-4 pb-8 max-h-[80vh] overflow-y-auto"
      >
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
