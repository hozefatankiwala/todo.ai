import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDeepLink } from './useDeepLink'

const mockNavigate = vi.fn()
vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}))

describe('useDeepLink', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  function makeSwMock() {
    const addEventListenerSpy = vi.fn()
    const removeEventListenerSpy = vi.fn()
    vi.stubGlobal('navigator', {
      serviceWorker: {
        addEventListener: addEventListenerSpy,
        removeEventListener: removeEventListenerSpy,
      },
    })
    return { addEventListenerSpy, removeEventListenerSpy }
  }

  it('registers message event listener on mount', () => {
    const { addEventListenerSpy } = makeSwMock()
    const { unmount } = renderHook(() => useDeepLink())
    expect(addEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function))
    unmount()
    vi.unstubAllGlobals()
  })

  it('removes listener on unmount (cleanup)', () => {
    const { addEventListenerSpy, removeEventListenerSpy } = makeSwMock()
    const { unmount } = renderHook(() => useDeepLink())
    const handler = addEventListenerSpy.mock.calls[0][1]
    unmount()
    expect(removeEventListenerSpy).toHaveBeenCalledWith('message', handler)
    vi.unstubAllGlobals()
  })

  it('navigates to task when NAVIGATE_TO_TASK message received', () => {
    const { addEventListenerSpy } = makeSwMock()
    const { unmount } = renderHook(() => useDeepLink())
    const handler = addEventListenerSpy.mock.calls[0][1]
    handler({ data: { type: 'NAVIGATE_TO_TASK', taskId: '42' } })
    expect(mockNavigate).toHaveBeenCalledWith('/tasks/42')
    unmount()
    vi.unstubAllGlobals()
  })

  it('does not navigate for unknown message types', () => {
    const { addEventListenerSpy } = makeSwMock()
    const { unmount } = renderHook(() => useDeepLink())
    const handler = addEventListenerSpy.mock.calls[0][1]
    handler({ data: { type: 'SOME_OTHER_TYPE', taskId: '42' } })
    expect(mockNavigate).not.toHaveBeenCalled()
    unmount()
    vi.unstubAllGlobals()
  })
})
