import { useEffect } from 'react'
import { useCalendarStore } from '@/store/useCalendarStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useNavigate } from 'react-router-dom'
import {
  useWorkoutLogs, useLogWorkout, useDeleteWorkoutLog,
  useDailyActivity, useActivities,
} from '@/hooks/useCalendarData'
import { useHabits, useHabitLogsForWeek } from '@/hooks/useHabitData'
import { useGoogleCalendarEvents, GoogleAuthExpiredError } from '@/hooks/useGoogleCalendar'
import { GYM_DAYS } from '@/data/defaultGym'
import { DAYS } from '@/data/defaultMeals'
import { getWeekDays, toDateStr, getDayOfWeekIndex, isToday } from '@/lib/dateUtils'
import { CalendarHeader } from './CalendarHeader'
import { CalendarConnectBar } from './CalendarConnectBar'
import { CalendarDayCell } from './CalendarDayCell'

export function CalendarPage() {
  const {
    weekOffset, getWeekStart, prevWeek, nextWeek, resetToToday,
    googleAccessToken,
    setGoogleToken,
  } = useCalendarStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const weekStart = getWeekStart()
  const weekDays = getWeekDays(weekStart)

  const { data: workoutLogs } = useWorkoutLogs(weekStart)
  const { data: activityMap } = useDailyActivity(weekStart)
  const { data: activitiesMap } = useActivities(weekStart)
  const { data: googleEvents, error: calendarError } = useGoogleCalendarEvents(weekStart, googleAccessToken)

  useEffect(() => {
    if (calendarError instanceof GoogleAuthExpiredError) setGoogleToken(null)
  }, [calendarError, setGoogleToken])
  const { data: habits = [] } = useHabits()
  const { data: habitLogsMap } = useHabitLogsForWeek(weekStart)
  const logWorkout = useLogWorkout()
  const deleteLog = useDeleteWorkoutLog()

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
          googleConnected={!!googleAccessToken}
          onGoogleToken={(token) => setGoogleToken(token)}
          onGoogleDisconnect={() => setGoogleToken(null)}
        />
      )}

      {calendarError instanceof GoogleAuthExpiredError && (
        <div style={{ padding: '8px 16px', fontSize: 12, color: 'var(--red)' }}>
          Google Calendar session expired — please reconnect.
        </div>
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

          const habitsDone = habitLogsMap?.get(dateStr)?.size ?? 0
          const habitsTotal = habits.length

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
              habitsDone={habitsDone}
              habitsTotal={habitsTotal}
              onLogWorkout={() =>
                logWorkout.mutate({ logged_date: dateStr, gym_day_index: dayIdx })
              }
              onDeleteLog={() => deleteLog.mutate(dateStr)}
              onOpenDetail={() => navigate(`/calendar/${dateStr}`)}
            />
          )
        })}

        {!user && (
          <div style={{
            marginTop: 8, padding: '16px', background: 'var(--card)',
            border: '1px solid var(--edge)', borderRadius: 'var(--radius)',
            textAlign: 'center', fontSize: 13, color: 'var(--text3)',
          }}>
            Sign in to log workouts and connect Google Calendar.
          </div>
        )}
      </div>
    </div>
  )
}
