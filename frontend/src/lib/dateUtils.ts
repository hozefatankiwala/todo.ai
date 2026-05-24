export function formatDeadline(utcIso: string): string {
  const date = new Date(utcIso)
  const datePart = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  const timePart = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return `${datePart} · ${timePart}`
}

export function toUtcIso(date: Date): string {
  return date.toISOString()
}

export function isOverdue(utcIso: string): boolean {
  return new Date(utcIso) < new Date()
}

export function formatCompletedAt(completedAt: string | null): string {
  if (!completedAt) return 'Completed'
  const date = new Date(completedAt)
  const datePart = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  const timePart = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return `Completed ${datePart} · ${timePart}`
}
