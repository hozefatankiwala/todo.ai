import { useState, useEffect } from 'react'
import api from '@/lib/api'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function checkPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.Notification !== 'undefined' &&
    typeof navigator.serviceWorker !== 'undefined' &&
    typeof window.PushManager !== 'undefined'
  )
}

async function _registerPushSubscription(): Promise<void> {
  if (!checkPushSupported()) return
  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
  if (!vapidPublicKey) {
    console.warn('VITE_VAPID_PUBLIC_KEY not set — skipping push subscription')
    return
  }
  try {
    const registration = await navigator.serviceWorker.getRegistration('/')
    if (!registration?.active) return
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    })
    const json = subscription.toJSON() as {
      endpoint: string
      keys?: { p256dh: string; auth: string }
    }
    if (!json.keys?.p256dh || !json.keys?.auth) {
      console.warn('Push subscription missing keys — skipping registration')
      return
    }
    await api.post('/api/v1/push/subscribe', {
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    })
  } catch (err) {
    console.error('Push subscription registration failed:', err)
    // Do not re-throw — subscription failure must not block task saves
  }
}

export function usePushSubscription() {
  const supported = checkPushSupported()
  const [permissionState, setPermissionState] = useState<
    NotificationPermission | 'unsupported'
  >(supported ? Notification.permission : 'unsupported')

  useEffect(() => {
    // Silently re-register on mount if already granted (AC 4)
    if (checkPushSupported() && Notification.permission === 'granted') {
      _registerPushSubscription()
    }
  }, [])

  const requestAndSubscribe = async (): Promise<'granted' | 'denied' | 'unsupported'> => {
    if (!checkPushSupported()) return 'unsupported'

    if (Notification.permission === 'granted') {
      await _registerPushSubscription()
      return 'granted'
    }

    if (Notification.permission === 'denied') {
      setPermissionState('denied')
      return 'denied'
    }

    const result = await Notification.requestPermission()
    setPermissionState(result)
    if (result === 'granted') {
      await _registerPushSubscription()
    }
    return result as 'granted' | 'denied'
  }

  return { permissionState, requestAndSubscribe }
}
