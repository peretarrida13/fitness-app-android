import { X } from 'lucide-react'
import { getDayName, isToday } from '@/lib/dateUtils'
import type { GymDay } from '@/types/gym'
import type { WorkoutLog, DailyActivity, GoogleCalendarEvent, Activity } from '@/types/supabase'

interface Props {
  date: Date
  gymDay: GymDay
  workoutLog: WorkoutLog | null
  activity: DailyActivity | null
  runs: Activity[]
  googleEvents: GoogleCalendarEvent[]
  habitsDone: number
  habitsTotal: number
  onLogWorkout: () => void
  onDeleteLog: () => void
  onClose: () => void
}

function formatPace(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60)
  const s = Math.round(secPerKm % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatKm(meters: number): string {
  return (meters / 1000).toFixed(1)
}

const GYM_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  strength: { label: 'Strength', color: 'var(--accent)', bg: 'var(--accentbg)' },
  cardio:   { label: 'Cardio',   color: 'var(--green)',  bg: 'var(--greenbg)' },
  rest:     { label: 'Rest',     color: 'var(--text3)',  bg: 'var(--bg3)' },
}

function getGymLabel(day: GymDay): string {
  if (day.isRest) return 'Rest'
  const parts = day.name.split('—')
  return parts[1]?.trim() ?? day.name
}

export function CalendarDayModal({
  date, gymDay, workoutLog, activity, runs,
  googleEvents, habitsDone, habitsTotal,
  onLogWorkout, onDeleteLog, onClose,
}: Props) {
  const dayName = getDayName(date)
  const dayNum = date.getDate()
  const month = date.toLocaleString('default', { month: 'long' })
  const today = isToday(date)
  const gymLabel = getGymLabel(gymDay)
  const badge = gymDay.isRest
    ? GYM_BADGE.rest
    : gymDay.type === 'cardio'
    ? GYM_BADGE.cardio
    : GYM_BADGE.strength
  const isRest = gymDay.isRest

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(0,0,0,0.6)',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'var(--bg)',
        borderTop: '1px solid var(--edge)',
        borderRadius: '16px 16px 0 0',
        maxHeight: '85vh',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--edge)' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px 12px',
          borderBottom: '1px solid var(--edge)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
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
              <div style={{ marginTop: 5 }}>
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
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--card)', border: '1px solid var(--edge)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text2)',
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 16px 32px' }}>

          {/* Workout section */}
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
                    onClick={onDeleteLog}
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
                  onClick={onLogWorkout}
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

          {/* Activity section */}
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

          {/* Runs section */}
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

          {/* Habits section */}
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
                    width: `${(habitsDone / habitsTotal) * 100}%`,
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
          {googleEvents.length > 0 && (
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
              {googleEvents.map((event, idx) => {
                const timeStr = event.start.dateTime
                  ? new Date(event.start.dateTime).toLocaleTimeString('default', {
                      hour: '2-digit', minute: '2-digit', hour12: false,
                    })
                  : 'All day'
                const isLast = idx === googleEvents.length - 1
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
        </div>
      </div>
    </>
  )
}
