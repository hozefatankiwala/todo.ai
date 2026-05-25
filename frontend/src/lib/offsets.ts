export const REMINDER_OFFSETS = [15, 30, 60, 1440, 2880] as const
export type ReminderOffset = (typeof REMINDER_OFFSETS)[number]

export const OFFSET_LABELS: Record<ReminderOffset, string> = {
  15: '15m',
  30: '30m',
  60: '1h',
  1440: '1d',
  2880: '2d',
}

export function formatBannerMessage(offsets: number[], deadlineUtcIso: string): string {
  if (offsets.length === 0) return 'Saved · No reminders set'
  const times = offsets
    .map((offset) => {
      const reminderTime = new Date(new Date(deadlineUtcIso).getTime() - offset * 60_000)
      return reminderTime.toLocaleString(undefined, {
        weekday: 'short',
        hour: 'numeric',
        hour12: true,
        minute: reminderTime.getMinutes() !== 0 ? '2-digit' : undefined,
      })
    })
    .join(', ')
  return `Saved · Reminders: ${times}`
}
