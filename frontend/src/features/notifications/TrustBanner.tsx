import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { useUIStore } from '@/lib/store'

export default function TrustBanner() {
  const { trustBannerMessage, clearTrustBanner } = useUIStore()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (trustBannerMessage) {
      setVisible(true)
      timerRef.current = setTimeout(() => {
        setVisible(false)
        setTimeout(() => clearTrustBanner(), 300)
      }, 3000)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [trustBannerMessage, clearTrustBanner])

  return (
    <div aria-live="polite">
      {trustBannerMessage && (
        <div
          className={`flex items-center gap-2 bg-green-950 border border-green-900 rounded-xl px-4 py-3 mb-4 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
        >
          <Check className="h-4 w-4 text-green-400 shrink-0" />
          <p className="text-sm text-green-300">{trustBannerMessage}</p>
        </div>
      )}
    </div>
  )
}
