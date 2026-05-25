import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import { Share, PlusSquare } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'

interface PWAInstallPromptProps {
  open: boolean
  onDismiss: () => void
}

export default function PWAInstallPrompt({ open, onDismiss }: PWAInstallPromptProps) {
  return (
    <Sheet open={open} onOpenChange={onDismiss}>
      <SheetContent side="bottom" className="bg-zinc-700 rounded-t-2xl px-4 pt-4 pb-8 border-0">
        <VisuallyHidden.Root>
          <SheetTitle>Install app</SheetTitle>
        </VisuallyHidden.Root>
        <div className="w-12 h-1 bg-zinc-500 rounded-full mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-zinc-50 mb-2">
          Enable reminders — install the app to your home screen
        </h2>
        <p className="text-zinc-400 text-sm mb-6">
          Install this app to your home screen so reminders can reach you even when Safari is closed.
        </p>
        <div className="flex items-center gap-3 bg-zinc-800 rounded-2xl px-4 py-3 mb-3">
          <Share className="h-5 w-5 text-zinc-300 shrink-0" />
          <p className="text-sm text-zinc-200">Tap the Share button in Safari's toolbar</p>
        </div>
        <div className="flex items-center gap-3 bg-zinc-800 rounded-2xl px-4 py-3">
          <PlusSquare className="h-5 w-5 text-zinc-300 shrink-0" />
          <p className="text-sm text-zinc-200">Tap "Add to Home Screen"</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-zinc-400 text-sm text-center w-full mt-4"
        >
          I'll do it later
        </button>
      </SheetContent>
    </Sheet>
  )
}
