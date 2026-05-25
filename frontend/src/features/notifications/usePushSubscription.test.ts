import { renderHook, act } from '@testing-library/react'
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest'

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

describe('isIos and isStandalone detection helpers', () => {
  const iphoneUA =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'

  function stubMatchMedia(standalone: boolean) {
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockReturnValue({ matches: standalone }),
      writable: true,
      configurable: true,
    })
  }

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('isIos() returns true when UA contains iPhone and not standalone', async () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: iphoneUA,
      writable: true,
      configurable: true,
    })
    stubMatchMedia(false)
    const { isIos } = await import('./usePushSubscription')
    expect(isIos()).toBe(true)
  })

  it('isIos() returns false when standalone via matchMedia', async () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: iphoneUA,
      writable: true,
      configurable: true,
    })
    stubMatchMedia(true)
    const { isIos } = await import('./usePushSubscription')
    expect(isIos()).toBe(false)
  })

  it('isIos() returns false on non-iOS UA', async () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120',
      writable: true,
      configurable: true,
    })
    stubMatchMedia(false)
    const { isIos } = await import('./usePushSubscription')
    expect(isIos()).toBe(false)
  })

  it('isStandalone() returns true when matchMedia standalone matches', async () => {
    stubMatchMedia(true)
    const { isStandalone } = await import('./usePushSubscription')
    expect(isStandalone()).toBe(true)
  })

  it('isStandalone() falls back to navigator.standalone when matchMedia is unavailable', async () => {
    Object.defineProperty(window, 'matchMedia', {
      value: undefined,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(window.navigator, 'standalone', {
      value: true,
      writable: true,
      configurable: true,
    })
    const { isStandalone } = await import('./usePushSubscription')
    expect(isStandalone()).toBe(true)
  })
})

describe('requestAndSubscribe iOS gate', () => {
  const iphoneUA =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'

  beforeEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: iphoneUA,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockReturnValue({ matches: false }),
      writable: true,
      configurable: true,
    })
    Object.defineProperty(window.navigator, 'standalone', {
      value: false,
      writable: true,
      configurable: true,
    })
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('returns ios-needs-install when iOS, not standalone, and session flag not set', async () => {
    stubPushSupported('default')
    const { usePushSubscription } = await import('./usePushSubscription')
    const { result } = renderHook(() => usePushSubscription())
    let res = ''
    await act(async () => {
      res = await result.current.requestAndSubscribe()
    })
    expect(res).toBe('ios-needs-install')
  })

  it('proceeds normally when iOS + standalone (matchMedia)', async () => {
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockReturnValue({ matches: true }),
      writable: true,
      configurable: true,
    })
    stubPushSupported('granted')
    vi.stubGlobal('Notification', { permission: 'granted', requestPermission: vi.fn() })
    const { default: api } = await import('@/lib/api')
    vi.spyOn(api, 'post').mockResolvedValue({ data: {} })
    const { usePushSubscription } = await import('./usePushSubscription')
    const { result } = renderHook(() => usePushSubscription())
    let res = ''
    await act(async () => {
      res = await result.current.requestAndSubscribe()
    })
    expect(res).toBe('granted')
  })
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
