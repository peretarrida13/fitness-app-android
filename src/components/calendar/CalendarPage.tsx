import { useEffect } from 'react'
import { useCalendarStore } from '@/store/useCalendarStore'
import { useAuthStore } from '@/store/useAuthStore'
import {
  useWorkoutLogs, useLogWorkout, useDeleteWorkoutLog,
  useDailyActivity, useGarminSync, useActivities,
} from '@/hooks/useCalendarData'
import { useGoogleCalendarEvents } from '@/hooks/useGoogleCalendar'
import { GYM_DAYS } from '@/data/defaultGym'
import { DAYS } from '@/data/defaultMeals'
import { getWeekDays, toDateStr, getDayOfWeekIndex, isToday } from '@/lib/dateUtils'
import { CalendarHeader } from './CalendarHeader'
import { CalendarConnectBar } from './CalendarConnectBar'
import { CalendarDayCell } from './CalendarDayCell'

export function CalendarPage() {
  const {
    weekOffset, getWeekStart, prevWeek, nextWeek, resetToToday,
    googleAccessToken, garminConnected,
    setGoogleToken, setGarminConnected,
  } = useCalendarStore()
  const { user } = useAuthStore()

  const weekStart = getWeekStart()
  const weekDays = getWeekDays(weekStart)

  const { data: workoutLogs } = useWorkoutLogs(weekStart)
  const { data: activityMap } = useDailyActivity(weekStart)
  const { data: activitiesMap } = useActivities(weekStart)
  const { data: googleEvents } = useGoogleCalendarEvents(weekStart, googleAccessToken)
  const logWorkout = useLogWorkout()
  const deleteLog = useDeleteWorkoutLog()
  const garminSync = useGarminSync()

  // Detect ?garmin=connected redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('garmin') === 'connected') {
      setGarminConnected(true)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [setGarminConnected])

  return (
    <div style={{ paddingBottom: 80 }}>
      <CalendarHeader
        weekStart={weekStart}
        onPrev={prevWeek}
        onNext={nextWeek}
        onToday={resetToToday}
        weekOffset={weekOffset}
      />

      {user && (
        <CalendarConnectBar
          garminConnected={garminConnected}
          garminSyncing={garminSync.isPending}
          onSyncGarmin={() => garminSync.mutate(toDateStr(weekStart))}
          googleConnected={!!googleAccessToken}
          onGoogleToken={(token) => setGoogleToken(token)}
          onGoogleDisconnect={() => setGoogleToken(null)}
        />
      )}

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {weekDays.map((date) => {
          const dayIdx = getDayOfWeekIndex(date)
          const gymDay = GYM_DAYS[dayIdx]
          const mealDay = DAYS[dayIdx]
          const dateStr = toDateStr(date)
          const workoutLog = workoutLogs?.get(dateStr) ?? null
          const activity = activityMap?.get(dateStr) ?? null
          const runs = activitiesMap?.get(dateStr) ?? []
          const events = googleEvents?.get(dateStr) ?? []

          return (
            <CalendarDayCell
              key={dateStr}
              date={date}
              gymDay={gymDay}
              mealDay={mealDay}
              workoutLog={workoutLog}
              activity={activity}
              runs={runs}
              googleEvents={events}
              isToday={isToday(date)}
              onLogWorkout={() =>
                logWorkout.mutate({ logged_date: dateStr, gym_day_index: dayIdx })
              }
              onDeleteLog={() => deleteLog.mutate(dateStr)}
            />
          )
        })}

        {!user && (
          <div style={{
            marginTop: 8, padding: '16px', background: 'var(--card)',
            border: '1px solid var(--edge)', borderRadius: 'var(--radius)',
            textAlign: 'center', fontSize: 13, color: 'var(--text3)',
          }}>
            Sign in to log workouts, sync Garmin data, and connect Google Calendar.
          </div>
        )}
      </div>
    </div>
  )
}
