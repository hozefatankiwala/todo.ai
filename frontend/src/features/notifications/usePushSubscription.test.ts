import { renderHook, act } from '@testing-library/react'
import { vi, beforeEach, afterEach, it, expect } from 'vitest'

const mockSubscribe = vi.fn()
const mockPushManager = { subscribe: mockSubscribe }
const mockRegistration = { pushManager: mockPushManager, active: {} }

function makeSwMock() {
  return {
    ready: Promise.resolve(mockRegistration),
    controller: {},
    getRegistration: vi.fn().mockResolvedValue(mockRegistration),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }
}

function stubPushSupported(permission: NotificationPermission) {
  vi.stubGlobal('Notification', {
    permission,
    requestPermission: vi.fn().mockResolvedValue(permission),
  })
  // Add PushManager to window so checkPushSupported() returns true
  vi.stubGlobal('PushManager', {})
  Object.defineProperty(navigator, 'serviceWorker', {
    value: makeSwMock(),
    writable: true,
    configurable: true,
  })
}

beforeEach(() => {
  mockSubscribe.mockResolvedValue({
    toJSON: () => ({
      endpoint: 'https://fcm.example.com/send/abc',
      keys: { p256dh: 'p256dh_key', auth: 'auth_key' },
    }),
  })
  stubPushSupported('default')
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('returns unsupported when Notification is not available', async () => {
  vi.stubGlobal('Notification', undefined)

  const { usePushSubscription } = await import('./usePushSubscription')
  const { result } = renderHook(() => usePushSubscription())
  let res: string = ''
  await act(async () => {
    res = await result.current.requestAndSubscribe()
  })
  expect(res).toBe('unsupported')
})

it('returns denied without calling requestPermission when permission is already denied', async () => {
  const mockRequestPermission = vi.fn()
  vi.stubGlobal('Notification', { permission: 'denied', requestPermission: mockRequestPermission })

  const { usePushSubscription } = await import('./usePushSubscription')
  const { result } = renderHook(() => usePushSubscription())
  let res: string = ''
  await act(async () => {
    res = await result.current.requestAndSubscribe()
  })
  expect(res).toBe('denied')
  expect(mockRequestPermission).not.toHaveBeenCalled()
})

it('calls Notification.requestPermission when permission is default', async () => {
  const mockRequestPermission = vi.fn().mockResolvedValue('granted')
  vi.stubGlobal('Notification', { permission: 'default', requestPermission: mockRequestPermission })

  const { usePushSubscription } = await import('./usePushSubscription')
  const { result } = renderHook(() => usePushSubscription())
  await act(async () => {
    await result.current.requestAndSubscribe()
  })
  expect(mockRequestPermission).toHaveBeenCalledOnce()
})

it('sets permissionState to denied when permission is already denied', async () => {
  vi.stubGlobal('Notification', { permission: 'denied', requestPermission: vi.fn() })

  const { usePushSubscription } = await import('./usePushSubscription')
  const { result } = renderHook(() => usePushSubscription())
  expect(result.current.permissionState).toBe('denied')
})

it('sets permissionState to unsupported when Notification is not available', async () => {
  vi.stubGlobal('Notification', undefined)

  const { usePushSubscription } = await import('./usePushSubscription')
  const { result } = renderHook(() => usePushSubscription())
  expect(result.current.permissionState).toBe('unsupported')
})

it('calls pushManager.subscribe on mount when permission is already granted', async () => {
  vi.stubGlobal('Notification', { permission: 'granted', requestPermission: vi.fn() })
  vi.stubGlobal('PushManager', {})
  Object.defineProperty(navigator, 'serviceWorker', {
    value: makeSwMock(),
    writable: true,
    configurable: true,
  })

  const { default: api } = await import('@/lib/api')
  const postSpy = vi.spyOn(api, 'post').mockResolvedValue({ data: {} })

  const { usePushSubscription } = await import('./usePushSubscription')
  await act(async () => {
    renderHook(() => usePushSubscription())
    await new Promise((resolve) => setTimeout(resolve, 50))
  })

  expect(mockSubscribe).toHaveBeenCalled()
  postSpy.mockRestore()
})
