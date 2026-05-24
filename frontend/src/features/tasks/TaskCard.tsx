import { cn } from '@/lib/utils'
import { formatDeadline, isOverdue } from '@/lib/dateUtils'
import type { Task } from './types'

interface TaskCardProps {
  task: Task
}

export default function TaskCard({ task }: TaskCardProps) {
  const overdue = isOverdue(task.deadline_at)

  return (
    <li
      role="listitem"
      className={cn(
        'bg-zinc-800 rounded-2xl px-4 py-3 animate-in fade-in duration-200',
        overdue && 'border-l-4 border-amber-500',
      )}
    >
      <p className="text-base font-medium text-zinc-50">{task.name}</p>
      <p className="text-sm text-zinc-400">{formatDeadline(task.deadline_at)}</p>
      <button
        type="button"
        aria-label={`Mark complete: ${task.name}`}
        className="sr-only"
      />
    </li>
  )
}
