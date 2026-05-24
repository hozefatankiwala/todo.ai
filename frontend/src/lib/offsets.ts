export const REMINDER_OFFSETS = [15, 30, 60, 1440, 2880] as const
export type ReminderOffset = (typeof REMINDER_OFFSETS)[number]

export const OFFSET_LABELS: Record<ReminderOffset, string> = {
  15: '15m',
  30: '30m',
  60: '1h',
  1440: '1d',
  2880: '2d',
}
