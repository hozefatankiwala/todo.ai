import { useState } from 'react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import { useCreateTask } from '@/features/tasks/useTasks'
import { usePushSubscription, isIos, setIosInstallDismissed } from '@/features/notifications/usePushSubscription'
import { useUIStore } from '@/lib/store'
import { formatBannerMessage } from '@/lib/offsets'
import PWAInstallPrompt from '@/features/notifications/PWAInstallPrompt'
import DeadlineChip from './DeadlineChip'
import OffsetSelector from './OffsetSelector'

interface ConfirmationSheetProps {
  open: boolean
  onClose: () => void
}

interface SheetFormProps {
  onClose: () => void
}

function SheetForm({ onClose }: SheetFormProps) {
  const [name, setName] = useState('')
  const [deadlineUtcIso, setDeadlineUtcIso] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [selectedOffsets, setSelectedOffsets] = useState<number[]>([])
  const [hasPastWarning, setHasPastWarning] = useState(false)
  const [notifBlocked, setNotifBlocked] = useState(false)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [installDismissed, setInstallDismissed] = useState(false)

  const createTask = useCreateTask()
  const { requestAndSubscribe } = usePushSubscription()
  const { showTrustBanner } = useUIStore()
  const canSave = name.trim().length > 0 && deadlineUtcIso !== null
  const installWarning = "Reminders won't fire until the app is installed"

  const handleSave = async () => {
    if (!canSave) return
    setNotifBlocked(false)
    setHasPastWarning(false)
    let installWarningNeeded = false

    const hasPast = selectedOffsets.some(
      (offset) => deadlineUtcIso && new Date(deadlineUtcIso).getTime() - offset * 60_000 < Date.now()
    )
    setHasPastWarning(hasPast)

    if (selectedOffsets.length > 0) {
      const permResult = await requestAndSubscribe()
      if (permResult === 'ios-needs-install') {
        setShowInstallPrompt(true)
        return
      }
      if (permResult === 'denied') {
        setNotifBlocked(true)
        // DO NOT return — task still saves (AC 3)
      }
      if (permResult === 'unsupported' && isIos()) {
        installWarningNeeded = true
        setInstallDismissed(true)
      }
    }

    try {
      await createTask.mutateAsync({
        name: name.trim(),
        deadline_at: deadlineUtcIso!,
        description: description.trim() || undefined,
        offsets: selectedOffsets,
      })
      showTrustBanner(
        installWarningNeeded ? `Saved · ${installWarning}` : formatBannerMessage(selectedOffsets, deadlineUtcIso!)
      )
      onClose()
    } catch {
      // createTask.isError will be true; error message renders below Save button
    }
  }

  const handleInstallDismiss = async () => {
    setIosInstallDismissed()
    setInstallDismissed(true)
    setShowInstallPrompt(false)
    try {
      await createTask.mutateAsync({
        name: name.trim(),
        deadline_at: deadlineUtcIso!,
        description: description.trim() || undefined,
        offsets: selectedOffsets,
      })
      showTrustBanner(`Saved · ${installWarning}`)
      onClose()
    } catch { }
  }

  return (
    <>
      <VisuallyHidden.Root>
        <SheetTitle>New task</SheetTitle>
      </VisuallyHidden.Root>
      {/* Drag handle */}
      <div className="w-12 h-1 bg-zinc-500 rounded-full mx-auto mb-4" />

      {/* Name field */}
      <div className="bg-zinc-800 rounded-2xl px-4 py-3 mb-3">
        <input
          autoFocus
          type="text"
          placeholder="Task name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-transparent text-lg font-medium text-zinc-50 placeholder:text-zinc-500 w-full outline-none"
        />
      </div>

      {/* Deadline chip */}
      <div className="bg-zinc-800 rounded-2xl p-3 mb-3">
        <DeadlineChip value={deadlineUtcIso} onChange={setDeadlineUtcIso} />
      </div>

      {/* Reminders */}
      <p className="text-xs text-zinc-400 mb-2 uppercase tracking-wider font-semibold">
        Reminders
      </p>
      <OffsetSelector selected={selectedOffsets} onChange={setSelectedOffsets} />
      {hasPastWarning && (
        <p className="text-amber-400 text-sm mt-2">This reminder is in the past</p>
      )}
      {(notifBlocked || installDismissed) && (
        <p className="text-amber-400 text-sm mt-2">
          {installDismissed
            ? installWarning
            : "Reminders won't fire — notifications are blocked"}
        </p>
      )}
      <PWAInstallPrompt open={showInstallPrompt} onDismiss={handleInstallDismiss} />

      {/* Description */}
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="bg-zinc-800 rounded-2xl px-4 py-3 text-sm text-zinc-50 placeholder:text-zinc-500 w-full outline-none resize-none h-20 mt-3"
      />

      {/* Save */}
      <button
        type="button"
        onClick={handleSave}
        disabled={!canSave}
        aria-disabled={!canSave}
        className="bg-violet-500 text-white rounded-2xl py-3 font-medium mt-4 w-full disabled:opacity-50 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
      >
        {createTask.isPending ? 'Saving…' : 'Save'}
      </button>

      {createTask.isError && (
        <p className="text-red-400 text-sm text-center mt-2">Failed to save. Tap Save to retry.</p>
      )}

      {/* Cancel */}
      <button
        type="button"
        className="text-zinc-400 text-sm text-center w-full mt-3"
        onClick={onClose}
      >
        Cancel
      </button>
    </>
  )
}

export default function ConfirmationSheet({ open, onClose }: ConfirmationSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="bg-zinc-700 rounded-t-2xl px-4 pt-4 pb-8 border-0"
      >
        {/* key=open resets form state each time the sheet opens */}
        <SheetForm key={String(open)} onClose={onClose} />
      </SheetContent>
    </Sheet>
  )
}
