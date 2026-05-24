import { useState, useRef } from 'react'
import { Link } from 'react-router'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDeadline, isOverdue } from '@/lib/dateUtils'
import { useCompleteTask } from './useTasks'
import type { Task } from './types'

interface TaskCardProps {
  task: Task
}

export default function TaskCard({ task }: TaskCardProps) {
  const overdue = isOverdue(task.deadline_at)
  const completeTask = useCompleteTask()
  const [swipeDx, setSwipeDx] = useState(0)
  const [completing, setCompleting] = useState(false)
  const touchStartX = useRef(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx < -80) {
      e.preventDefault()
      setSwipeDx(-80)
    } else {
      setSwipeDx(0)
    }
  }

  const handleComplete = async () => {
    setCompleting(true)
    setSwipeDx(0)
    try {
      await completeTask.mutateAsync({ id: task.id })
    } catch {
      setCompleting(false)
    }
  }

  return (
    <li
      role="listitem"
      className={cn(
        'animate-in fade-in duration-200 relative',
        completing && 'transition-all duration-300 scale-95 opacity-0',
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe layout: outer clips the reveal; inner row positions card + action side by side */}
      <div className="overflow-hidden">
        <div
          className="flex"
          style={{ transform: `translateX(${swipeDx}px)`, transition: swipeDx === 0 ? 'transform 0.2s' : 'none' }}
        >
          {/* Card takes full width of the viewport slot */}
          <div className="w-full shrink-0">
            <Link
              to={`/tasks/${task.id}`}
              className={cn(
                'block bg-zinc-800 rounded-2xl px-4 py-3',
                overdue && 'border-l-4 border-amber-500',
              )}
            >
              <p className="text-base font-medium text-zinc-50">{task.name}</p>
              <p className="text-sm text-zinc-400">{formatDeadline(task.deadline_at)}</p>
            </Link>
          </div>
          {/* Action sits to the right of the card — revealed only when card slides left */}
          <div className="shrink-0 flex items-center pl-3" style={{ width: 80 }}>
            <button
              type="button"
              aria-label={`Mark complete: ${task.name}`}
              onClick={handleComplete}
              disabled={completeTask.isPending || completing}
              tabIndex={swipeDx === 0 ? -1 : 0}
              className="bg-green-500 text-white rounded-2xl px-3 py-3 font-medium flex items-center gap-1 text-sm disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              Done
            </button>
          </div>
        </div>
      </div>
    </li>
  )
}
