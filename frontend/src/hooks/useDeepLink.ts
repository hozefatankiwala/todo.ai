import { useEffect } from 'react'
import { useNavigate } from 'react-router'

export function useDeepLink() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'NAVIGATE_TO_TASK' && event.data.taskId) {
        navigate(`/tasks/${event.data.taskId}`)
      }
    }

    navigator.serviceWorker.addEventListener('message', handler)
    return () => {
      navigator.serviceWorker.removeEventListener('message', handler)
    }
  }, [navigate])
}
