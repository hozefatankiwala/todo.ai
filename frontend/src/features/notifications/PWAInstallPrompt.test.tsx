import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import PWAInstallPrompt from './PWAInstallPrompt'

describe('PWAInstallPrompt', () => {
  it('renders sheet with required framing copy when open=true', () => {
    render(<PWAInstallPrompt open={true} onDismiss={vi.fn()} />)
    expect(
      screen.getByText('Enable reminders — install the app to your home screen')
    ).toBeInTheDocument()
  })

  it('renders Share instruction row when open=true', () => {
    render(<PWAInstallPrompt open={true} onDismiss={vi.fn()} />)
    expect(screen.getByText("Tap the Share button in Safari's toolbar")).toBeInTheDocument()
  })

  it('renders Add to Home Screen instruction row when open=true', () => {
    render(<PWAInstallPrompt open={true} onDismiss={vi.fn()} />)
    expect(screen.getByText('Tap "Add to Home Screen"')).toBeInTheDocument()
  })

  it('calls onDismiss when "I\'ll do it later" button is clicked', () => {
    const onDismiss = vi.fn()
    render(<PWAInstallPrompt open={true} onDismiss={onDismiss} />)
    fireEvent.click(screen.getByText("I'll do it later"))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('does not render heading when open=false', () => {
    render(<PWAInstallPrompt open={false} onDismiss={vi.fn()} />)
    expect(
      screen.queryByText('Enable reminders — install the app to your home screen')
    ).not.toBeInTheDocument()
  })
})
