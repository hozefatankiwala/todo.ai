import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OffsetSelector from './OffsetSelector'

describe('OffsetSelector', () => {
  it('renders 5 chips with correct labels', () => {
    render(<OffsetSelector selected={[]} onChange={() => {}} />)
    expect(screen.getByText('15m')).toBeInTheDocument()
    expect(screen.getByText('30m')).toBeInTheDocument()
    expect(screen.getByText('1h')).toBeInTheDocument()
    expect(screen.getByText('1d')).toBeInTheDocument()
    expect(screen.getByText('2d')).toBeInTheDocument()
  })

  it('renders group with correct aria-label', () => {
    render(<OffsetSelector selected={[]} onChange={() => {}} />)
    expect(screen.getByRole('group', { name: 'Reminder offsets' })).toBeInTheDocument()
  })

  it('chips have role=checkbox with aria-checked=false when not selected', () => {
    render(<OffsetSelector selected={[]} onChange={() => {}} />)
    const chips = screen.getAllByRole('checkbox')
    expect(chips).toHaveLength(5)
    chips.forEach((chip) => expect(chip).toHaveAttribute('aria-checked', 'false'))
  })

  it('toggles chip to selected on click and updates aria-checked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<OffsetSelector selected={[]} onChange={onChange} />)
    const chip15m = screen.getByText('15m')
    await user.click(chip15m)
    expect(onChange).toHaveBeenCalledWith([15])
  })

  it('deselects chip when clicked while selected', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<OffsetSelector selected={[15, 60]} onChange={onChange} />)
    const chip15m = screen.getByText('15m')
    await user.click(chip15m)
    expect(onChange).toHaveBeenCalledWith([60])
  })

  it('pre-selected offsets render chips with aria-checked=true', () => {
    render(<OffsetSelector selected={[30, 1440]} onChange={() => {}} />)
    const chip30m = screen.getByText('30m').closest('button')!
    const chip1d = screen.getByText('1d').closest('button')!
    const chip15m = screen.getByText('15m').closest('button')!
    expect(chip30m).toHaveAttribute('aria-checked', 'true')
    expect(chip1d).toHaveAttribute('aria-checked', 'true')
    expect(chip15m).toHaveAttribute('aria-checked', 'false')
  })

  it('allows multiple chips to be selected simultaneously', () => {
    render(<OffsetSelector selected={[15, 30, 60]} onChange={() => {}} />)
    const checked = screen.getAllByRole('checkbox').filter(
      (el) => el.getAttribute('aria-checked') === 'true'
    )
    expect(checked).toHaveLength(3)
  })
})
