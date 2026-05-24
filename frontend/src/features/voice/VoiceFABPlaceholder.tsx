import { Mic } from 'lucide-react'
import { useUIStore } from '@/lib/store'

export default function VoiceFABPlaceholder() {
  const openConfirmationSheet = useUIStore((s) => s.openConfirmationSheet)

  return (
    <button
      type="button"
      aria-label="Add task by voice"
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-violet-500 shadow-lg shadow-violet-500/40 flex items-center justify-center z-50"
      onClick={openConfirmationSheet}
    >
      <Mic className="h-6 w-6 text-white" />
    </button>
  )
}
