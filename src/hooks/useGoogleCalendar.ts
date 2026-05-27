import { useQuery } from '@tanstack/react-query'
import { getWeekDays, toDateStr } from '@/lib/dateUtils'
import type { GoogleCalendarEvent } from '@/types/supabase'

export function useGoogleCalendarEvents(weekStart: Date, accessToken: string | null) {
  const days = getWeekDays(weekStart)
  const timeMin = new Date(days[0])
  timeMin.setHours(0, 0, 0, 0)
  const timeMax = new Date(days[6])
  timeMax.setHours(23, 59, 59, 999)

  return useQuery({
    queryKey: ['google_calendar', toDateStr(weekStart)],
    enabled: !!accessToken,
    queryFn: async () => {
      const params = new URLSearchParams({
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '50',
      })
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      if (!res.ok) throw new Error('Google Calendar fetch failed')
      const json = await res.json()
      const events: GoogleCalendarEvent[] = json.items ?? []

      // Group by date string
      const byDate = new Map<string, GoogleCalendarEvent[]>()
      for (const event of events) {
        const dateStr = (event.start.dateTime ?? event.start.date ?? '').slice(0, 10)
        if (!byDate.has(dateStr)) byDate.set(dateStr, [])
        byDate.get(dateStr)!.push(event)
      }
      return byDate
    },
  })
}
