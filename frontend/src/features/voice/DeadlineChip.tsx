import { useRef } from 'react'
import { formatDeadline } from '@/lib/dateUtils'

interface DeadlineChipProps {
  value: string | null
  onChange: (utcIso: string) => void
}

export default function DeadlineChip({ value, onChange }: DeadlineChipProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleButtonClick = () => {
    inputRef.current?.showPicker()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value // "YYYY-MM-DDTHH:mm" — local time, no TZ suffix
    if (!raw) return
    // Split into parts to force local-time interpretation, avoiding the
    // ambiguity of new Date("YYYY-MM-DDTHH:mm") which some runtimes parse as UTC.
    const [datePart, timePart] = raw.split('T')
    const [year, month, day] = datePart.split('-').map(Number)
    const [hours, minutes] = timePart.split(':').map(Number)
    onChange(new Date(year, month - 1, day, hours, minutes).toISOString())
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Set deadline"
        onClick={handleButtonClick}
        className={
          value
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
