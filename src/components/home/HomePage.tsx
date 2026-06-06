import { useState } from 'react'
import { Check } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useWorkoutLogs, useLogWorkout, useDeleteWorkoutLog, useWorkoutStreak, useTodayDailyActivity } from '@/hooks/useCalendarData'
import { useHabits, useHabitLogsForWeek, useToggleHabitLog } from '@/hooks/useHabitData'
import { useWeightLogs } from '@/hooks/useProgressData'
import { useMealLogsForDay } from '@/hooks/useMealLogs'
import { getMondayOfWeek, getDayOfWeekIndex, toDateStr } from '@/lib/dateUtils'
import { GYM_DAYS } from '@/data/defaultGym'
import { DAYS } from '@/data/defaultMeals'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useWaterStore } from '@/store/useWaterStore'
import { RecoveryCard } from '@/components/home/RecoveryCard'
import { WhoopDashboard } from '@/components/whoop/WhoopDashboard'
import { DailyInputModal } from '@/components/home/DailyInputModal'

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

export function HomePage() {
  const { user } = useAuthStore()
  const { weightGoalKg, calorieTarget, proteinTarget, waterGoalMl } = useSettingsStore()
  const waterStore = useWaterStore()
  const [showDailyModal, setShowDailyModal] = useState(false)

  const today = new Date()
  const todayStr = toDateStr(today)
  const weekStart = getMondayOfWeek(today)
  const dayIdx = getDayOfWeekIndex(today)
  const gymDay = GYM_DAYS[dayIdx]
  const mealDay = DAYS[dayIdx]

  const { data: workoutLogs } = useWorkoutLogs(weekStart)
  const { data: habits = [] } = useHabits()
  const { data: habitLogsMap } = useHabitLogsForWeek(weekStart)
  const { data: weightLogs = [] } = useWeightLogs(7)
  const { data: eatenSet } = useMealLogsForDay(todayStr)
  const { data: todayActivity = null } = useTodayDailyActivity()
  const streak = useWorkoutStreak()

  const logWorkout = useLogWorkout()
  const deleteLog = useDeleteWorkoutLog()
  const toggleHabit = useToggleHabitLog()

  const workoutLog = workoutLogs?.get(todayStr) ?? null
  const todayHabitsDone = habitLogsMap?.get(todayStr) ?? new Set<string>()

  const latestWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1] : null
  const oldestWeight = weightLogs.length > 1 ? weightLogs[0] : null
  const weightDelta = latestWeight && oldestWeight
    ? Math.round((latestWeight.weight_kg - oldestWeight.weight_kg) * 10) / 10
    : null

  const gymLabel = gymDay.isRest
    ? 'Rest day'
    : gymDay.name.split('—')[1]?.trim() ?? gymDay.name

  const dateLabel = `${WEEKDAYS[today.getDay()]}, ${today.getDate()} ${MONTHS[today.getMonth()]}`

  const eatenMeals = user && eatenSet && mealDay ? mealDay.meals.filter((m) => eatenSet.has(m.id)) : []
  const eatenKcal = eatenMeals.reduce((sum, m) => sum + m.kcal, 0)
  const eatenProtein = eatenMeals.reduce((sum, m) => sum + (m.protein ?? 0), 0)

  const todayWaterMl = waterStore.date === todayStr ? waterStore.ml : 0

  if (!user) {
    return (
      <div style={{ padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🏠</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
          Welcome to Jarvis
        </div>
        <div style={{ fontSize: 14, color: 'var(--text2)' }}>
          Sign in to see your daily dashboard
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '0 16px 96px' }}>
      <WhoopDashboard />
      {/* Header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 0 16px' }}>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>{dateLabel}</div>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: 0,
        }}>
          Today
        </h1>
      </div>

      {/* Workout card */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--edge)',
        borderRadius: 'var(--radius)', padding: '14px', marginBottom: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: gymDay.isRest ? 0 : 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Gym
            </div>
            {streak > 0 && (
              <div style={{
                fontSize: 11, fontWeight: 600,
                background: 'rgba(240,192,96,0.15)', color: 'var(--gold)',
                border: '1px solid rgba(240,192,96,0.25)', borderRadius: 20, padding: '2px 8px',
              }}>
                🔥 {streak}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{gymLabel}</div>
            {!gymDay.isRest && (
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                {gymDay.duration} · {gymDay.exercises ?? 0} exercises · {gymDay.sets ?? 0} sets
              </div>
            )}
          </div>
          {!gymDay.isRest && (
            <button
              onClick={() => workoutLog
                ? deleteLog.mutate(todayStr)
                : logWorkout.mutate({ logged_date: todayStr, gym_day_index: dayIdx })
              }
              style={{
                width: 40, height: 40, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: workoutLog ? 'var(--greenbg)' : 'var(--bg2)',
                border: `2px solid ${workoutLog ? 'var(--green)' : 'var(--edge)'}`,
                cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
                color: workoutLog ? 'var(--green)' : 'var(--text3)',
              }}
            >
              {workoutLog ? <Check size={18} strokeWidth={2.5} /> : <span style={{ fontSize: 18 }}>+</span>}
            </button>
          )}
        </div>
        {workoutLog && (
          <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 8 }}>Logged ✓</div>
        )}
      </div>

      {/* Macro card */}
      {mealDay && (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--edge)',
          borderRadius: 'var(--radius)', padding: '14px', marginBottom: 10,
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Nutrition Today
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
              <span style={{ color: 'var(--text2)' }}>Energy</span>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>
                {eatenKcal.toLocaleString()} / {calorieTarget.toLocaleString()} kcal
              </span>
            </div>
            <ProgressBar value={eatenKcal} max={calorieTarget} color="var(--accent)" />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
              <span style={{ color: 'var(--text2)' }}>Protein</span>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>{eatenProtein}g / {proteinTarget}g</span>
            </div>
            <ProgressBar value={eatenProtein} max={proteinTarget} color="var(--green)" />
          </div>
        </div>
      )}

      {/* Water card */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--edge)',
        borderRadius: 'var(--radius)', padding: '14px', marginBottom: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Water
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>
            {todayWaterMl} / {waterGoalMl} ml
          </div>
        </div>
        <ProgressBar value={todayWaterMl} max={waterGoalMl} color="#4eb3e8" />
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          {[200, 350, 500].map((amount) => (
            <button
              key={amount}
              onClick={() => waterStore.add(amount)}
              style={{
                flex: 1, padding: '7px 4px',
                background: 'var(--bg2)', border: '1px solid var(--edge)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12, color: 'var(--text2)', cursor: 'pointer', fontWeight: 500,
              }}
            >
              +{amount}ml
            </button>
          ))}
          <button
            onClick={() => waterStore.reset()}
            style={{
              padding: '7px 10px', background: 'none', border: '1px solid var(--edge)',
              borderRadius: 'var(--radius-sm)', fontSize: 11, color: 'var(--text3)', cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Habits card */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--edge)',
        borderRadius: 'var(--radius)', padding: '14px', marginBottom: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Habits
          </div>
          {habits.length > 0 && (
            <div style={{ fontSize: 12, color: todayHabitsDone.size === habits.length ? 'var(--green)' : 'var(--text3)' }}>
              {todayHabitsDone.size}/{habits.length}
            </div>
          )}
        </div>
        {habits.length === 0 ? (
          <div>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>No habits yet</div>
            <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 2 }}>Add one in the Habits tab →</div>
          </div>
        ) : (
          <>
            <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, marginBottom: 12, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 2,
                background: todayHabitsDone.size === habits.length ? 'var(--green)' : 'var(--accent)',
                width: `${(todayHabitsDone.size / habits.length) * 100}%`,
                transition: 'width 0.3s',
              }} />
            </div>
            {habits.map((habit, idx) => {
              const done = todayHabitsDone.has(habit.id)
              return (
                <div
                  key={habit.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '7px 0',
                    borderBottom: idx < habits.length - 1 ? '1px solid var(--edge)' : 'none',
                  }}
                >
                  <button
                    onClick={() => toggleHabit.mutate({ habitId: habit.id, date: todayStr, currentlyDone: done })}
                    style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      border: `1.5px solid var(${habit.color})`,
                      background: done ? `var(${habit.color})` : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                  >
                    {done && <Check size={11} color="#fff" strokeWidth={3} />}
                  </button>
                  <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>{habit.icon}</span>
                  <span style={{
                    flex: 1, fontSize: 14, fontWeight: 500,
                    color: done ? 'var(--text3)' : 'var(--text)',
                    textDecoration: done ? 'line-through' : 'none',
                  }}>
                    {habit.name}
                  </span>
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Weight card */}
      {latestWeight && (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--edge)',
          borderRadius: 'var(--radius)', padding: '14px', marginBottom: 10,
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Weight
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', fontFamily: "'Space Grotesk', sans-serif" }}>
              {latestWeight.weight_kg}
            </span>
            <span style={{ fontSize: 14, color: 'var(--text3)' }}>kg</span>
            {weightDelta !== null && weightDelta !== 0 && (
              <span style={{ fontSize: 12, color: weightDelta < 0 ? 'var(--green)' : 'var(--red)' }}>
                {weightDelta > 0 ? '+' : ''}{weightDelta} kg (7d)
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
            Goal: {weightGoalKg} kg · {Math.abs(Math.round((latestWeight.weight_kg - weightGoalKg) * 10) / 10)} kg to go
          </div>
        </div>
      )}

      {/* Recovery card */}
      <RecoveryCard activity={todayActivity} onLogClick={() => setShowDailyModal(true)} />

      <DailyInputModal open={showDailyModal} onClose={() => setShowDailyModal(false)} />
    </div>
  )
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0)
  return (
    <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{
        height: '100%', borderRadius: 3, background: color,
        width: `${pct}%`, transition: 'width 0.3s',
      }} />
    </div>
  )
}
