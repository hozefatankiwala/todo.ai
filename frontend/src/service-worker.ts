/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>
}

// Workbox precache manifest — injected by vite-plugin-pwa at build time
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('push', (event: PushEvent) => {
  let data: { title?: string; body?: string; task_id?: string } = {}
  try {
    data = event.data?.json() ?? {}
  } catch {
    data = {}
  }
  const title = data.title ?? 'Reminder'
  const body = data.body ?? ''
  const taskId = data.task_id

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      data: { task_id: taskId },
    })
  )
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  // Deep-link navigation handled in Story 2.7
})
