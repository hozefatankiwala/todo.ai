import { render, screen } from '@testing-library/react'
import TaskCard from './TaskCard'
import type { Task } from './types'

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 1,
    name: 'Buy groceries',
    deadline_at: new Date(Date.now() + 86400000).toISOString(), // tomorrow
    description: null,
    is_completed: false,
    completed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

describe('TaskCard', () => {
  it('renders task name', () => {
    render(<ul><TaskCard task={makeTask()} /></ul>)
    expect(screen.getByText('Buy groceries')).toBeInTheDocument()
  })

  it('renders formatted deadline', () => {
    const isoDate = new Date(Date.now() + 86400000).toISOString()
    const task = makeTask({ deadline_at: isoDate })
    render(<ul><TaskCard task={task} /></ul>)
    const date = new Date(isoDate)
    const datePart = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    const timePart = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    const expected = `${datePart} · ${timePart}`
    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  it('applies amber border for overdue tasks', () => {
    const task = makeTask({ deadline_at: new Date(Date.now() - 86400000).toISOString() })
    render(<ul><TaskCard task={task} /></ul>)
    const listitem = screen.getByRole('listitem')
    expect(listitem.className).toContain('border-amber-500')
  })

  it('does NOT apply amber border for non-overdue tasks', () => {
    const task = makeTask({ deadline_at: new Date(Date.now() + 86400000).toISOString() })
    render(<ul><TaskCard task={task} /></ul>)
    const listitem = screen.getByRole('listitem')
    expect(listitem.className).not.toContain('border-amber-500')
  })

  it('has accessible aria-label on the completion button', () => {
    const task = makeTask({ name: 'Test task' })
    render(<ul><TaskCard task={task} /></ul>)
    expect(screen.getByLabelText('Mark complete: Test task')).toBeInTheDocument()
  })
})
