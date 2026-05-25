import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useArchiveQuery, useDeleteTask } from './useTasks'
import { formatCompletedAt } from '@/lib/dateUtils'
import DeleteDialog from './DeleteDialog'

interface ArchiveSheetProps {
  open: boolean
  onClose: () => void
}

export default function ArchiveSheet({ open, onClose }: ArchiveSheetProps) {
  const { data: tasks, isLoading } = useArchiveQuery(open)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const deleteTask = useDeleteTask()

  const handleClose = () => {
    setDeletingId(null)
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
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
          </ul>
        )}

        <DeleteDialog
          open={deletingId !== null}
          onClose={() => setDeletingId(null)}
          onConfirm={async () => {
            if (deletingId === null) return
            try {
              await deleteTask.mutateAsync({ id: deletingId })
              setDeletingId(null)
            } catch {
              setDeletingId(null)
            }
          }}
          isPending={deleteTask.isPending}
        />
      </SheetContent>
    </Sheet>
  )
}
