import { useUIStore } from '@/store/useUIStore'
import { GYM_DAYS } from '@/data/defaultGym'
import { ExerciseCard } from './ExerciseCard'
import { useAuthStore } from '@/store/useAuthStore'
import { useLogWorkout, useDeleteWorkoutLog, useWorkoutLogs } from '@/hooks/useCalendarData'
import { toDateStr, getDayOfWeekIndex, getMondayOfWeek } from '@/lib/dateUtils'
import { MuscleMap } from './MuscleMap'

const DAY_LABELS = [
  'Mon · Push', 'Tue · Legs', 'Wed · Pull',
  'Thu · Cardio', 'Fri · Push', 'Sat · Legs', 'Sun · Rest',
]

export function GymPage() {
  const { activeGymDay, setActiveGymDay } = useUIStore()
  const day = GYM_DAYS[activeGymDay]
  const { user } = useAuthStore()
  const todayIdx = getDayOfWeekIndex(new Date())
  const todayStr = toDateStr(new Date())
  const isViewingToday = activeGymDay === todayIdx

  const weekStart = getMondayOfWeek(new Date())
  const { data: workoutLogs } = useWorkoutLogs(weekStart)
  const logWorkout = useLogWorkout()
  const deleteLog = useDeleteWorkoutLog()
  const todayLogged = workoutLogs?.get(todayStr) ?? null

  return (
    <div style={{ padding: '14px 16px' }}>
      {/* Sub header */}
      <div style={{ padding: '20px 0 14px', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
        <h1 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
          Gym Programme
        </h1>
        <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
          6-day split · Sets, reps & alternatives
        </p>
      </div>

      {/* Day tabs */}
      <div
        style={{
          display: 'flex', gap: 6,
          overflowX: 'auto', scrollbarWidth: 'none',
          marginBottom: 14, paddingBottom: 2,
        }}
      >
        {DAY_LABELS.map((label, i) => (
          <button
            key={i}
            onClick={() => setActiveGymDay(i)}
            style={{
              flexShrink: 0, padding: '6px 13px',
              borderRadius: 20,
              fontSize: 12, fontWeight: 500,
              color: activeGymDay === i ? '#fff' : 'var(--text3)',
              background: activeGymDay === i ? 'var(--accent)' : 'transparent',
              border: `1px solid ${activeGymDay === i ? 'var(--accent)' : 'var(--edge)'}`,
              boxShadow: activeGymDay === i ? '0 2px 12px rgba(91,141,238,0.35)' : 'none',
              transition: 'all 0.18s',
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Muscle map */}
      <MuscleMap day={day} />

      {/* Rest day */}
      {day.isRest && (
        <div
          style={{
            background: 'var(--card)', border: '1px solid var(--edge)',
            borderRadius: 'var(--radius)', padding: '2.5rem 2rem', textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 44, marginBottom: 14 }}>😴</div>
          <div style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
            Full Rest Day
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.7, maxWidth: 280, margin: '0 auto' }}>
            Muscle is built during recovery, not during the workout. Hit your protein, sleep 8 hours, and let the body repair. A light 20–30 min walk is fine if you feel restless — nothing more.
          </div>
        </div>
      )}

      {/* Active training day */}
      {!day.isRest && (
        <>
          {/* Day header card */}
          <div
            style={{
              background: 'var(--card)', border: '1px solid var(--edge)',
              borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 12,
              position: 'relative', overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
              }}
            />
            <div style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: 19, fontWeight: 700, color: 'var(--text)' }}>
              {day.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>{day.sub}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {day.isCardio ? (
                <>
                  <StatBox val={day.duration} lbl="Duration" />
                  <StatBox val="Zone 2" lbl="Intensity" />
                  <StatBox val="60–70%" lbl="Heart rate" />
                </>
              ) : (
                <>
                  <StatBox val={String(day.exercises ?? '—')} lbl="Exercises" />
                  <StatBox val={String(day.sets ?? '—')} lbl="Total sets" />
                  <StatBox val={day.duration} lbl="Duration" />
                </>
              )}
            </div>

            {/* Log workout */}
            {user && isViewingToday && (
              <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                {todayLogged ? (
                  <button
                    onClick={() => deleteLog.mutate(todayStr)}
                    style={{
                      width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)',
                      background: 'var(--greenbg)', border: '1px solid rgba(86,201,154,0.3)',
                      color: 'var(--green)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    Workout logged ✓ — tap to undo
                  </button>
                ) : (
                  <button
                    onClick={() => logWorkout.mutate({ logged_date: todayStr, gym_day_index: todayIdx })}
                    disabled={logWorkout.isPending}
                    style={{
                      width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)',
                      background: 'var(--accentbg)', border: '1px solid var(--accentbd)',
                      color: 'var(--accent)', fontSize: 13, fontWeight: 600,
                      cursor: logWorkout.isPending ? 'default' : 'pointer',
                      opacity: logWorkout.isPending ? 0.7 : 1,
                    }}
                  >
                    Log today's workout
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Warmup banner */}
          {day.warmup && (
            <div
              style={{
                background: 'var(--goldbg)', border: '1px solid var(--goldbd)',
                borderRadius: 'var(--radius-sm)', padding: '10px 13px',
                fontSize: 12, color: 'var(--gold)', marginBottom: 12,
                display: 'flex', gap: 8, lineHeight: 1.5,
              }}
            >
              🔥 <span><strong>Warm-up:</strong> {day.warmup}</span>
            </div>
          )}

          {/* Injury note */}
          {day.injuryNote && (
            <div
              style={{
                background: 'var(--redbg)', border: '1px solid var(--redbd)',
                borderRadius: 'var(--radius-sm)', padding: '10px 13px',
                fontSize: 12, color: 'var(--red)', marginBottom: 12,
                display: 'flex', gap: 8, lineHeight: 1.5,
              }}
            >
              ⚠️ <span>{day.injuryNote}</span>
            </div>
          )}

          {/* Cardio options */}
          {day.isCardio && day.cardioOptions && (
            <>
              {day.cardioOptions.map((opt) => (
                <ExerciseCard key={opt.id} exercise={opt} isCardio />
              ))}
            </>
          )}

          {/* Strength sections */}
          {!day.isCardio && day.sections && day.sections.map((section) => (
            <div key={section.label}>
              <div
                style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.10em',
                  color: 'var(--text3)', textTransform: 'uppercase',
                  margin: '14px 0 8px',
                }}
              >
                {section.label}
              </div>
              {section.exercises.map((ex) => (
                <ExerciseCard key={ex.id} exercise={ex} />
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  )
}

function StatBox({ val, lbl }: { val: string; lbl: string }) {
  return (
    <div
      style={{
        flex: 1, background: 'var(--bg3)', borderRadius: 'var(--radius-sm)',
        padding: 8, textAlign: 'center', border: '1px solid var(--border)',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{val}</div>
      <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {lbl}
      </div>
    </div>
  )
}
