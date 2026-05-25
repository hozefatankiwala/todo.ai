import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface DeleteDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  isPending: boolean
}

export default function DeleteDialog({ open, onClose, onConfirm, isPending }: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-800 border-zinc-700 text-zinc-50">
        <DialogHeader>
          <DialogTitle>Delete this task?</DialogTitle>
          <DialogDescription className="text-zinc-400">
            This can't be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 flex-row-reverse">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="text-red-400 rounded-2xl px-4 py-2 font-medium focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:opacity-50"
          >
            {isPending ? 'Deleting…' : 'Delete'}
          </button>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            disabled={isPending}
            className="bg-zinc-700 text-zinc-50 rounded-2xl px-4 py-2 font-medium focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:opacity-50"
          >
            Cancel
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
