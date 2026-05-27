export function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Returns 0=Monday … 6=Sunday
export function getDayOfWeekIndex(date: Date): number {
  return (date.getDay() + 6) % 7
}

export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const diff = getDayOfWeekIndex(d)
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatWeekRange(weekStart: Date): string {
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 6)
  const startStr = `${weekStart.getDate()} ${MONTHS[weekStart.getMonth()]}`
  const endStr = `${end.getDate()} ${MONTHS[end.getMonth()]} ${end.getFullYear()}`
  return `${startStr} – ${endStr}`
}

export function isToday(date: Date): boolean {
  const today = new Date()
  return toDateStr(date) === toDateStr(today)
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function getDayName(date: Date): string {
  return DAY_NAMES[getDayOfWeekIndex(date)]
}
