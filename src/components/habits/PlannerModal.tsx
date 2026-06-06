import { useState, useEffect } from 'react'
import { X, RefreshCw, Check } from 'lucide-react'
import { useCalendarStore } from '@/store/useCalendarStore'
import { useGoogleCalendarEvents, createCalendarEvent } from '@/hooks/useGoogleCalendar'
import { GYM_DAYS } from '@/data/defaultGym'
import { getMondayOfWeek, toDateStr, getDayOfWeekIndex } from '@/lib/dateUtils'
import type { Habit } from '@/types/supabase'

interface Props {
  plannedHabits: Habit[]
  tomorrow: Date
  onClose: () => void
}

interface HabitSchedule {
  habitId: string
  startTime: string  // "HH:MM"
  durationMins: number
}

const CARDIO_KEYWORDS = ['cardio', 'run', 'walk', 'bike', 'cycling', 'rowing', 'swim', 'treadmill', 'hiit']
const GYM_KEYWORDS = ['gym', 'workout', 'lift', 'strength', 'weights', 'press', 'squat', 'pull', 'push', 'deadlift', 'bench']

function parseTimeMins(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

function formatTimeMins(mins: number): string {
  const clamped = Math.max(0, Math.min(mins, 23 * 60 + 59))
  return `${String(Math.floor(clamped / 60)).padStart(2, '0')}:${String(clamped % 60).padStart(2, '0')}`
}

function minsToISO(date: Date, mins: number): string {
  const d = new Date(date)
  d.setHours(Math.floor(mins / 60), mins % 60, 0, 0)
  return d.toISOString()
}

function suggestSchedule(
  habits: Habit[],
  workStart: string,
  workEnd: string,
  dayIndex: number
): HabitSchedule[] {
  const workStartMins = parseTimeMins(workStart)
  const workEndMins = parseTimeMins(workEnd)
  const gymType = GYM_DAYS[dayIndex]?.type ?? 'rest'

  let cardioSlot = Math.max(6 * 60, workStartMins - 50)
  let gymSlot = workEndMins + 30
  let otherSlot = workEndMins + 30

  return habits.map((habit) => {
    const name = habit.name.toLowerCase()
    const isCardio = CARDIO_KEYWORDS.some((k) => name.includes(k))
    const isGym = GYM_KEYWORDS.some((k) => name.includes(k))

    if (isCardio) {
      const start = cardioSlot
      cardioSlot += 50
      return { habitId: habit.id, startTime: formatTimeMins(start), durationMins: 45 }
    }

    if (isGym || gymType === 'strength') {
      const start = gymSlot
      gymSlot += 65
      otherSlot = Math.max(otherSlot, gymSlot)
      return { habitId: habit.id, startTime: formatTimeMins(start), durationMins: 60 }
    }

    const start = otherSlot
    otherSlot += 35
    return { habitId: habit.id, startTime: formatTimeMins(start), durationMins: 30 }
  })
}

function loadWorkHours(): { workStart: string; workEnd: string } {
  try {
    const stored = localStorage.getItem('planner_work_hours')
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  return { workStart: '09:00', workEnd: '18:00' }
}

export function PlannerModal({ plannedHabits, tomorrow, onClose }: Props) {
  const googleAccessToken = useCalendarStore((s) => s.googleAccessToken)
  const tomorrowStr = toDateStr(tomorrow)
  const dayIndex = getDayOfWeekIndex(tomorrow)

  const [workStart, setWorkStart] = useState(() => loadWorkHours().workStart)
  const [workEnd, setWorkEnd] = useState(() => loadWorkHours().workEnd)
  const [schedule, setSchedule] = useState<HabitSchedule[]>([])
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { data: calendarMap } = useGoogleCalendarEvents(getMondayOfWeek(tomorrow), googleAccessToken)
  const tomorrowEvents = calendarMap?.get(tomorrowStr) ?? []

  useEffect(() => {
    setSchedule(suggestSchedule(plannedHabits, workStart, workEnd, dayIndex))
  }, [])

  function saveWorkHours(start: string, end: string) {
    localStorage.setItem('planner_work_hours', JSON.stringify({ workStart: start, workEnd: end }))
  }

  function handleWorkStartChange(val: string) {
    setWorkStart(val)
    saveWorkHours(val, workEnd)
  }

  function handleWorkEndChange(val: string) {
    setWorkEnd(val)
    saveWorkHours(workStart, val)
  }

  function handleResuggest() {
    setSchedule(suggestSchedule(plannedHabits, workStart, workEnd, dayIndex))
  }

  function updateHabitTime(habitId: string, field: 'startTime' | 'durationMins', value: string | number) {
    setSchedule((prev) =>
      prev.map((s) => s.habitId === habitId ? { ...s, [field]: value } : s)
    )
  }

  async function handleCreate() {
    if (!googleAccessToken || schedule.length === 0) return
    setCreating(true)
    setError(null)
    try {
      for (const item of schedule) {
        const habit = plannedHabits.find((h) => h.id === item.habitId)
        if (!habit) continue
        const startMins = parseTimeMins(item.startTime)
        const endMins = startMins + item.durationMins
        await createCalendarEvent(googleAccessToken, {
          summary: `${habit.icon} ${habit.name}`,
          description: 'Added by your fitness app planner',
          startISO: minsToISO(tomorrow, startMins),
          endISO: minsToISO(tomorrow, endMins),
        })
      }
      setCreated(schedule.length)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create events')
    } finally {
      setCreating(false)
    }
  }

  const gymDayName = GYM_DAYS[dayIndex]?.name ?? ''

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
          <div>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0,
            }}>
              Plan My Day
            </h2>
            {gymDayName && (
              <p style={{ fontSize: 11, color: 'var(--text3)', margin: '2px 0 0' }}>
                {gymDayName}
              </p>
            )}
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
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 16px 16px' }}>

          {/* Work Hours */}
          <div style={{ marginTop: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={{
                fontSize: 11, fontWeight: 600, color: 'var(--text3)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                Work Hours
              </p>
              <button
                onClick={handleResuggest}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 11, color: 'var(--accent)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                }}
              >
                <RefreshCw size={11} /> Re-suggest times
              </button>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Starts</p>
                <input
                  type="time"
                  value={workStart}
                  onChange={(e) => handleWorkStartChange(e.target.value)}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'var(--card)', border: '1px solid var(--edge)',
                    borderRadius: 'var(--radius-sm)', padding: '7px 10px',
                    color: 'var(--text)', fontSize: 14, outline: 'none',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Ends</p>
                <input
                  type="time"
                  value={workEnd}
                  onChange={(e) => handleWorkEndChange(e.target.value)}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'var(--card)', border: '1px solid var(--edge)',
                    borderRadius: 'var(--radius-sm)', padding: '7px 10px',
                    color: 'var(--text)', fontSize: 14, outline: 'none',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Planned Habits */}
          <p style={{
            fontSize: 11, fontWeight: 600, color: 'var(--text3)',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
          }}>
            Planned Habits
          </p>

          {plannedHabits.length === 0 ? (
            <div style={{
              background: 'var(--card)', border: '1px solid var(--edge)',
              borderRadius: 'var(--radius)', padding: '20px', textAlign: 'center',
              marginBottom: 16,
            }}>
              <p style={{ fontSize: 13, color: 'var(--text3)' }}>
                Check habits in the Tomorrow tab first
              </p>
            </div>
          ) : (
            <div style={{
              background: 'var(--card)', border: '1px solid var(--edge)',
              borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 16,
            }}>
              {plannedHabits.map((habit, idx) => {
                const item = schedule.find((s) => s.habitId === habit.id)
                const isLast = idx === plannedHabits.length - 1
                return (
                  <div
                    key={habit.id}
                    style={{
                      padding: '10px 14px',
                      borderBottom: isLast ? 'none' : '1px solid var(--edge)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        background: `var(${habit.color})`,
                      }} />
                      <span style={{ fontSize: 16, lineHeight: 1 }}>{habit.icon}</span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', flex: 1 }}>
                        {habit.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3 }}>Start</p>
                        <input
                          type="time"
                          value={item?.startTime ?? '09:00'}
                          onChange={(e) => updateHabitTime(habit.id, 'startTime', e.target.value)}
                          style={{
                            width: '100%', boxSizing: 'border-box',
                            background: 'var(--bg)', border: '1px solid var(--edge)',
                            borderRadius: 'var(--radius-sm)', padding: '5px 8px',
                            color: 'var(--text)', fontSize: 13, outline: 'none',
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3 }}>Duration</p>
                        <select
                          value={item?.durationMins ?? 30}
                          onChange={(e) => updateHabitTime(habit.id, 'durationMins', Number(e.target.value))}
                          style={{
                            width: '100%', boxSizing: 'border-box',
                            background: 'var(--bg)', border: '1px solid var(--edge)',
                            borderRadius: 'var(--radius-sm)', padding: '5px 8px',
                            color: 'var(--text)', fontSize: 13, outline: 'none',
                          }}
                        >
                          <option value={15}>15 min</option>
                          <option value={30}>30 min</option>
                          <option value={45}>45 min</option>
                          <option value={60}>60 min</option>
                          <option value={75}>75 min</option>
                          <option value={90}>90 min</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Tomorrow's existing events */}
          {tomorrowEvents.length > 0 && (
            <>
              <p style={{
                fontSize: 11, fontWeight: 600, color: 'var(--text3)',
                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
              }}>
                Already in Calendar
              </p>
              <div style={{
                background: 'var(--card)', border: '1px solid var(--edge)',
                borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 16,
              }}>
                {tomorrowEvents.map((ev, idx) => {
                  const timeStr = ev.start.dateTime
                    ? new Date(ev.start.dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                    : 'All day'
                  const isLast = idx === tomorrowEvents.length - 1
                  return (
                    <div
                      key={ev.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 14px',
                        borderBottom: isLast ? 'none' : '1px solid var(--edge)',
                      }}
                    >
                      <span style={{ fontSize: 12, color: 'var(--text3)', flexShrink: 0, minWidth: 40 }}>
                        {timeStr}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--text2)', flex: 1 }}>
                        {ev.summary}
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* Status */}
          {error && (
            <p style={{ fontSize: 13, color: 'var(--red)', marginBottom: 12, textAlign: 'center' }}>
              {error}
            </p>
          )}
          {created !== null && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px', borderRadius: 'var(--radius)',
              background: 'rgba(86,201,154,0.12)', border: '1px solid rgba(86,201,154,0.3)',
              marginBottom: 12,
            }}>
              <Check size={14} color="var(--green)" strokeWidth={3} />
              <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 500 }}>
                {created} event{created !== 1 ? 's' : ''} added to Google Calendar
              </span>
            </div>
          )}

          {/* Create button */}
          <button
            onClick={handleCreate}
            disabled={creating || plannedHabits.length === 0 || created !== null}
            style={{
              width: '100%', padding: '13px',
              borderRadius: 'var(--radius)', border: 'none',
              background: 'var(--accent)', color: '#fff',
              fontSize: 14, fontWeight: 600,
              cursor: creating || plannedHabits.length === 0 || created !== null ? 'not-allowed' : 'pointer',
              opacity: creating || plannedHabits.length === 0 || created !== null ? 0.6 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {creating ? 'Creating events…' : created !== null ? 'Done' : 'Create Calendar Events'}
          </button>
        </div>
      </div>
    </>
  )
}
