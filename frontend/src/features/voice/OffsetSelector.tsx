import { REMINDER_OFFSETS, OFFSET_LABELS, type ReminderOffset } from '@/lib/offsets'

interface OffsetSelectorProps {
  selected: number[]
  onChange: (offsets: number[]) => void
}

export default function OffsetSelector({ selected, onChange }: OffsetSelectorProps) {
  const toggle = (offset: number) => {
    if (selected.includes(offset)) {
      onChange(selected.filter((o) => o !== offset))
    } else {
      onChange([...selected, offset])
    }
  }

  return (
    <div role="group" aria-label="Reminder offsets" className="flex gap-2 flex-wrap">
      {REMINDER_OFFSETS.map((offset) => {
        const isSelected = selected.includes(offset)
        return (
          <button
            key={offset}
            type="button"
            role="checkbox"
            aria-checked={isSelected}
            onClick={() => toggle(offset)}
            className={
              isSelected
                ? 'bg-violet-500 text-white rounded-full px-3 py-1.5 text-sm font-medium h-9'
                : 'bg-zinc-700 text-zinc-400 rounded-full px-3 py-1.5 text-sm font-medium h-9'
            }
          >
            {OFFSET_LABELS[offset as ReminderOffset]}
          </button>
        )
      })}
    </div>
  )
}
