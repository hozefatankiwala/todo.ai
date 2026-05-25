import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUIStore } from '@/lib/store'
import TrustBanner from './TrustBanner'

beforeEach(() => {
  useUIStore.setState({ trustBannerMessage: null })
})

describe('TrustBanner', () => {
  it('renders message when trustBannerMessage is set in store', () => {
    useUIStore.setState({ trustBannerMessage: 'Saved · No reminders set' })
    render(<TrustBanner />)
    expect(screen.getByText('Saved · No reminders set')).toBeInTheDocument()
  })

  it('renders no visible content when trustBannerMessage is null', () => {
    render(<TrustBanner />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(document.querySelector('[aria-live="polite"]')).toBeInTheDocument()
    expect(document.querySelector('[aria-live="polite"]')!.children).toHaveLength(0)
  })

  it('has aria-live="polite" attribute', () => {
    useUIStore.setState({ trustBannerMessage: 'Saved · Reminders: Wed 9am' })
    render(<TrustBanner />)
    expect(document.querySelector('[aria-live="polite"]')).toBeTruthy()
  })

  it('clears banner after 3 seconds + fade duration', () => {
    vi.useFakeTimers()
    useUIStore.setState({ trustBannerMessage: 'test message' })
    render(<TrustBanner />)
    expect(screen.getByText('test message')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(3000 + 300))
    expect(screen.queryByText('test message')).not.toBeInTheDocument()
    vi.useRealTimers()
  })

  it('resets the 3-second timer when message changes', () => {
    vi.useFakeTimers()
    useUIStore.setState({ trustBannerMessage: 'first message' })
    const { rerender } = render(<TrustBanner />)

    act(() => vi.advanceTimersByTime(2000))
    expect(screen.getByText('first message')).toBeInTheDocument()

    act(() => {
      useUIStore.setState({ trustBannerMessage: 'second message' })
    })
    rerender(<TrustBanner />)
    expect(screen.getByText('second message')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(2999))
    expect(screen.getByText('second message')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(1 + 300))
    expect(screen.queryByText('second message')).not.toBeInTheDocument()

    vi.useRealTimers()
  })
})
