import type { GymDay } from '@/types/gym'
import type { MealDay } from '@/types/meals'
import type { WorkoutLog, DailyActivity, GoogleCalendarEvent, Activity } from '@/types/supabase'
import { getDayName } from '@/lib/dateUtils'

interface Props {
  date: Date
  gymDay: GymDay
  mealDay: MealDay
  workoutLog: WorkoutLog | null
  activity: DailyActivity | null
  runs: Activity[]
  googleEvents: GoogleCalendarEvent[]
  isToday: boolean
  onLogWorkout: () => void
  onDeleteLog: () => void
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
  // Extract short label from name e.g. "Monday — Push" → "Push"
  const parts = day.name.split('—')
  return parts[1]?.trim() ?? day.name
}

export function CalendarDayCell({
  date, gymDay, mealDay, workoutLog, activity, runs,
  googleEvents, isToday, onLogWorkout, onDeleteLog,
}: Props) {
  const dayName = getDayName(date)
  const dayNum = date.getDate()
  const gymLabel = getGymLabel(gymDay)
  const badge = gymDay.isRest
    ? GYM_BADGE.rest
    : gymDay.type === 'cardio'
    ? GYM_BADGE.cardio
    : GYM_BADGE.strength

  const isRest = gymDay.isRest

  const visibleEvents = googleEvents.slice(0, 3)
  const extraEvents = googleEvents.length - 3

  return (
    <div style={{
      background: 'var(--card)',
      border: `1px solid ${isToday ? 'var(--accentbd)' : 'var(--edge)'}`,
      borderLeft: isToday ? '3px solid var(--accent)' : '1px solid var(--edge)',
      borderRadius: 'var(--radius)',
      padding: '12px 14px',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {/* Row 1: Day header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            fontSize: 15, fontWeight: 700,
            color: isToday ? 'var(--accent)' : 'var(--text)',
          }}>
            {dayName}
          </span>
          <span style={{ fontSize: 13, color: 'var(--text3)' }}>
            {dayNum}
          </span>
        </div>
        {isToday && (
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

      {/* Row 2: Gym split badge + workout checkbox */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 20,
          background: badge.bg, fontSize: 12, fontWeight: 500,
          color: badge.color,
        }}>
          {gymLabel}
        </div>
        {!isRest && (
          <button
            onClick={workoutLog ? onDeleteLog : onLogWorkout}
            title={workoutLog ? 'Mark as not done' : 'Log workout'}
            style={{
              width: 26, height: 26, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: workoutLog ? 'var(--greenbg)' : 'transparent',
              border: `1.5px solid ${workoutLog ? 'var(--green)' : 'var(--edge)'}`,
              cursor: 'pointer', fontSize: 13,
              color: workoutLog ? 'var(--green)' : 'var(--text3)',
              transition: 'all 0.15s',
            }}
          >
            {workoutLog ? '✓' : '+'}
          </button>
        )}
      </div>

      {/* Row 3: Meal kcal */}
      <div style={{ fontSize: 11, color: 'var(--text3)' }}>
        🍽 {mealDay.macros.kcal} kcal · {mealDay.macros.protein}g protein
      </div>

      {/* Row 4: Garmin stats */}
      {activity && (
        <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--text3)' }}>
          <span>👣 {activity.steps.toLocaleString()}</span>
          <span>🔥 {activity.active_calories} kcal</span>
          {activity.resting_heart_rate && (
            <span>❤️ {activity.resting_heart_rate} bpm</span>
          )}
        </div>
      )}

      {/* Row 5: Runs */}
      {runs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {runs.map((run) => (
            <div
              key={run.garmin_activity_id}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 8px', borderRadius: 'var(--radius-sm)',
                background: 'var(--greenbg)', border: '1px solid rgba(86,201,154,0.25)',
                fontSize: 11,
              }}
            >
              <span>🏃</span>
              {run.distance_meters && (
                <span style={{ color: 'var(--green)', fontWeight: 600 }}>
                  {formatKm(run.distance_meters)} km
                </span>
              )}
              {run.avg_pace_sec_per_km && (
                <span style={{ color: 'var(--text3)' }}>
                  · {formatPace(run.avg_pace_sec_per_km)} /km
                </span>
              )}
              {run.avg_heart_rate && (
                <span style={{ color: 'var(--text3)', marginLeft: 'auto' }}>
                  ❤️ {run.avg_heart_rate}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Row 6: Google Calendar events */}
      {visibleEvents.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {visibleEvents.map((event) => (
            <span
              key={event.id}
              style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 20,
                background: 'var(--accentbg)', color: 'var(--accent2)',
                border: '1px solid var(--accentbd)',
                maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap', display: 'inline-block',
              }}
            >
              {event.summary}
            </span>
          ))}
          {extraEvents > 0 && (
            <span style={{ fontSize: 10, color: 'var(--text3)', padding: '2px 4px' }}>
              +{extraEvents} more
            </span>
          )}
        </div>
      )}

      {/* Row 6: Log workout link */}
      {!isRest && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6 }}>
          {workoutLog ? (
            <button
              onClick={onDeleteLog}
              style={{
                fontSize: 11, color: 'var(--green)', background: 'none',
                border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              Logged ✓ — undo
            </button>
          ) : (
            <button
              onClick={onLogWorkout}
              style={{
                fontSize: 11, color: 'var(--text3)', background: 'none',
                border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              + Log workout
            </button>
          )}
        </div>
      )}
    </div>
  )
}
