import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useCalendarStore } from '@/store/useCalendarStore'
import {
  useWorkoutLogs, useLogWorkout, useDeleteWorkoutLog,
  useDailyActivity, useActivities,
} from '@/hooks/useCalendarData'
import { useHabits, useHabitLogsForWeek } from '@/hooks/useHabitData'
import { useGoogleCalendarEvents } from '@/hooks/useGoogleCalendar'
import { GYM_DAYS } from '@/data/defaultGym'
import { getMondayOfWeek, toDateStr, getDayOfWeekIndex, getDayName, isToday } from '@/lib/dateUtils'
import type { GymDay } from '@/types/gym'

function formatPace(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60)
  const s = Math.round(secPerKm % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatKm(meters: number): string {
  return (meters / 1000).toFixed(1)
}

function getGymLabel(day: GymDay): string {
  if (day.isRest) return 'Rest'
  const parts = day.name.split('—')
  return parts[1]?.trim() ?? day.name
}

const GYM_BADGE: Record<string, { color: string; bg: string }> = {
  strength: { color: 'var(--accent)', bg: 'var(--accentbg)' },
  cardio:   { color: 'var(--green)',  bg: 'var(--greenbg)' },
  rest:     { color: 'var(--text3)',  bg: 'var(--bg3)' },
}

export function CalendarDayPage() {
  const { date: dateParam } = useParams<{ date: string }>()
  const navigate = useNavigate()
  const { googleAccessToken } = useCalendarStore()

  const date = new Date((dateParam ?? '') + 'T12:00:00')
  const dateStr = toDateStr(date)
  const dayIdx = getDayOfWeekIndex(date)
  const weekStart = getMondayOfWeek(date)
  const today = isToday(date)

  const gymDay = GYM_DAYS[dayIdx]
  const gymLabel = getGymLabel(gymDay)
  const badge = gymDay.isRest ? GYM_BADGE.rest : gymDay.type === 'cardio' ? GYM_BADGE.cardio : GYM_BADGE.strength
  const isRest = gymDay.isRest

  const { data: workoutLogs } = useWorkoutLogs(weekStart)
  const { data: activityMap } = useDailyActivity(weekStart)
  const { data: activitiesMap } = useActivities(weekStart)
  const { data: googleEvents } = useGoogleCalendarEvents(weekStart, googleAccessToken)
  const { data: habits = [] } = useHabits()
  const { data: habitLogsMap } = useHabitLogsForWeek(weekStart)
  const logWorkout = useLogWorkout()
  const deleteLog = useDeleteWorkoutLog()

  const workoutLog = workoutLogs?.get(dateStr) ?? null
  const activity = activityMap?.get(dateStr) ?? null
  const runs = activitiesMap?.get(dateStr) ?? []
  const events = googleEvents?.get(dateStr) ?? []
  const habitsDone = habitLogsMap?.get(dateStr)?.size ?? 0
  const habitsTotal = habits.length

  const dayName = getDayName(date)
  const dayNum = date.getDate()
  const month = date.toLocaleString('default', { month: 'long' })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(10,10,15,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--edge)',
        padding: 'calc(env(safe-area-inset-top, 0px) + 14px) 16px 12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--card)', border: '1px solid var(--edge)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text2)', flexShrink: 0,
            }}
          >
            <ArrowLeft size={15} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 18, fontWeight: 700,
                color: today ? 'var(--accent)' : 'var(--text)',
              }}>
                {dayName} {dayNum}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text3)' }}>{month}</span>
              {today && (
                <span style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
                  color: 'var(--accent)', background: 'var(--accentbg)',
                  border: '1px solid var(--accentbd)', borderRadius: 20,
                  padding: '2px 7px',
                }}>
                  TODAY
                </span>
              )}
            </div>
            <div style={{ marginTop: 4 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '3px 10px', borderRadius: 20,
                background: badge.bg, fontSize: 12, fontWeight: 500,
                color: badge.color,
              }}>
                {gymLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '0 16px 96px' }}>

        {/* Workout */}
        {!isRest && (
          <div style={{
            marginTop: 16,
            background: 'var(--card)', border: '1px solid var(--edge)',
            borderRadius: 'var(--radius)', padding: '12px 14px',
          }}>
            <p style={{
              fontSize: 11, fontWeight: 600, color: 'var(--text3)',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10,
            }}>
              Workout
            </p>
            {workoutLog ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'var(--greenbg)', border: '1.5px solid var(--green)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, color: 'var(--green)',
                  }}>✓</span>
                  <span style={{ fontSize: 14, color: 'var(--green)', fontWeight: 500 }}>Logged</span>
                </div>
                <button
                  onClick={() => deleteLog.mutate(dateStr)}
                  style={{
                    fontSize: 12, color: 'var(--text3)', background: 'none',
                    border: 'none', cursor: 'pointer', padding: 0,
                  }}
                >
                  Undo
                </button>
              </div>
            ) : (
              <button
                onClick={() => logWorkout.mutate({ logged_date: dateStr, gym_day_index: dayIdx })}
                style={{
                  width: '100%', padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--accentbg)', border: '1px solid var(--accentbd)',
                  color: 'var(--accent)', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                + Log workout
              </button>
            )}
          </div>
        )}

        {/* Activity */}
        {activity && (
          <div style={{
            marginTop: 12,
            background: 'var(--card)', border: '1px solid var(--edge)',
            borderRadius: 'var(--radius)', padding: '12px 14px',
          }}>
            <p style={{
              fontSize: 11, fontWeight: 600, color: 'var(--text3)',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10,
            }}>
              Activity
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>Steps</p>
                <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
                  👣 {activity.steps.toLocaleString()}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>Active cal</p>
                <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
                  🔥 {activity.active_calories}
                </p>
              </div>
              {activity.resting_heart_rate && (
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>Resting HR</p>
                  <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
                    ❤️ {activity.resting_heart_rate} bpm
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Runs */}
        {runs.length > 0 && (
          <div style={{
            marginTop: 12,
            background: 'var(--card)', border: '1px solid var(--edge)',
            borderRadius: 'var(--radius)', padding: '12px 14px',
          }}>
            <p style={{
              fontSize: 11, fontWeight: 600, color: 'var(--text3)',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10,
            }}>
              Runs
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {runs.map((run) => (
                <div
                  key={run.garmin_activity_id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                    background: 'var(--greenbg)', border: '1px solid rgba(86,201,154,0.25)',
                  }}
                >
                  <span>🏃</span>
                  {run.distance_meters && (
                    <span style={{ color: 'var(--green)', fontWeight: 600, fontSize: 14 }}>
                      {formatKm(run.distance_meters)} km
                    </span>
                  )}
                  {run.avg_pace_sec_per_km && (
                    <span style={{ color: 'var(--text3)', fontSize: 13 }}>
                      · {formatPace(run.avg_pace_sec_per_km)} /km
                    </span>
                  )}
                  {run.avg_heart_rate && (
                    <span style={{ color: 'var(--text3)', fontSize: 13, marginLeft: 'auto' }}>
                      ❤️ {run.avg_heart_rate} bpm
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Habits */}
        {habitsTotal > 0 && (
          <div style={{
            marginTop: 12,
            background: 'var(--card)', border: '1px solid var(--edge)',
            borderRadius: 'var(--radius)', padding: '12px 14px',
          }}>
            <p style={{
              fontSize: 11, fontWeight: 600, color: 'var(--text3)',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
            }}>
              Habits
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                flex: 1, height: 6, borderRadius: 3,
                background: 'var(--bg3)', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  width: `${habitsTotal > 0 ? (habitsDone / habitsTotal) * 100 : 0}%`,
                  background: habitsDone === habitsTotal ? 'var(--green)' : 'var(--accent)',
                  transition: 'width 0.3s',
                }} />
              </div>
              <span style={{
                fontSize: 13, fontWeight: 500,
                color: habitsDone === habitsTotal ? 'var(--green)' : 'var(--text2)',
              }}>
                {habitsDone}/{habitsTotal}
              </span>
            </div>
          </div>
        )}

        {/* Google Calendar events */}
        {events.length > 0 && (
          <div style={{
            marginTop: 12,
            background: 'var(--card)', border: '1px solid var(--edge)',
            borderRadius: 'var(--radius)', overflow: 'hidden',
          }}>
            <p style={{
              fontSize: 11, fontWeight: 600, color: 'var(--text3)',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              padding: '12px 14px 8px',
            }}>
              Calendar
            </p>
            {events.map((event, idx) => {
              const timeStr = event.start.dateTime
                ? new Date(event.start.dateTime).toLocaleTimeString('default', {
                    hour: '2-digit', minute: '2-digit', hour12: false,
                  })
                : 'All day'
              const isLast = idx === events.length - 1
              return (
                <div
                  key={event.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 14px',
                    borderBottom: isLast ? 'none' : '1px solid var(--edge)',
                  }}
                >
                  <span style={{ fontSize: 12, color: 'var(--text3)', flexShrink: 0, minWidth: 44 }}>
                    {timeStr}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text2)', flex: 1 }}>
                    {event.summary}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {isRest && !activity && runs.length === 0 && habitsTotal === 0 && events.length === 0 && (
          <div style={{ marginTop: 40, textAlign: 'center', color: 'var(--text3)', fontSize: 14 }}>
            Rest day 🛋️
          </div>
        )}
      </div>
    </div>
  )
}
