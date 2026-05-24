import { create } from 'zustand'

interface UIStore {
  confirmationSheetOpen: boolean
  activeTaskId: number | null
  trustBannerMessage: string | null
  openConfirmationSheet: () => void
  closeConfirmationSheet: () => void
  setActiveTask: (id: number | null) => void
  showTrustBanner: (message: string) => void
  clearTrustBanner: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  confirmationSheetOpen: false,
  activeTaskId: null,
  trustBannerMessage: null,
  openConfirmationSheet: () => set({ confirmationSheetOpen: true }),
  closeConfirmationSheet: () => set({ confirmationSheetOpen: false }),
  setActiveTask: (id) => set({ activeTaskId: id }),
  showTrustBanner: (message) => set({ trustBannerMessage: message }),
  clearTrustBanner: () => set({ trustBannerMessage: null }),
}))
