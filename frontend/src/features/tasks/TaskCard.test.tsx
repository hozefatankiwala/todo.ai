import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
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

function renderCard(task: Task) {
  return render(
    <MemoryRouter>
      <ul><TaskCard task={task} /></ul>
    </MemoryRouter>,
  )
}

describe('TaskCard', () => {
  it('renders task name', () => {
    renderCard(makeTask())
    expect(screen.getByText('Buy groceries')).toBeInTheDocument()
  })

  it('renders formatted deadline', () => {
    const isoDate = new Date(Date.now() + 86400000).toISOString()
    const task = makeTask({ deadline_at: isoDate })
    renderCard(task)
    const date = new Date(isoDate)
    const datePart = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    const timePart = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    const expected = `${datePart} · ${timePart}`
    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  it('applies amber border for overdue tasks', () => {
    const task = makeTask({ deadline_at: new Date(Date.now() - 86400000).toISOString() })
    renderCard(task)
    const link = screen.getByRole('link')
    expect(link.className).toContain('border-amber-500')
  })

  it('does NOT apply amber border for non-overdue tasks', () => {
    const task = makeTask({ deadline_at: new Date(Date.now() + 86400000).toISOString() })
    renderCard(task)
    const link = screen.getByRole('link')
    expect(link.className).not.toContain('border-amber-500')
  })

  it('has accessible aria-label on the completion button', () => {
    const task = makeTask({ name: 'Test task' })
    renderCard(task)
    expect(screen.getByLabelText('Mark complete: Test task')).toBeInTheDocument()
  })

  it('navigates to task detail URL', () => {
    const task = makeTask({ id: 42 })
    renderCard(task)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/tasks/42')
  })
})
