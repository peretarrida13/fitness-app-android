import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useHabitLogsForWeek, useToggleHabitLog } from '@/hooks/useHabitData'
import {
  getMondayOfWeek,
  getWeekDays,
  toDateStr,
  getDayName,
  formatWeekRange,
  isToday,
} from '@/lib/dateUtils'
import type { Habit } from '@/types/supabase'

interface Props {
  habits: Habit[]
}

export function WeekTab({ habits }: Props) {
  const [weekOffset, setWeekOffset] = useState(0)

  const weekStart = useMemo(() => {
    const base = getMondayOfWeek(new Date())
    base.setDate(base.getDate() + weekOffset * 7)
    return base
  }, [weekOffset])

  const weekDays = getWeekDays(weekStart)
  const { data: logsMap = new Map() } = useHabitLogsForWeek(weekStart)
  const toggle = useToggleHabitLog()

  if (habits.length === 0) {
    return (
      <div style={{
        marginTop: 24,
        background: 'var(--card)', border: '1px solid var(--edge)',
        borderRadius: 'var(--radius)', padding: '40px 20px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
        <div style={{ fontSize: 15, color: 'var(--text2)', fontWeight: 500 }}>No habits to show</div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Add habits from the Today tab</div>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 16 }}>
      {/* Week navigator */}
      <div style={{
        display: 'flex', alignItems: 'center',
        marginBottom: 12,
        background: 'var(--card)', border: '1px solid var(--edge)',
        borderRadius: 'var(--radius)', padding: '6px 8px',
      }}>
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text2)', padding: '4px 6px', lineHeight: 0, borderRadius: 6,
          }}
        >
          <ChevronLeft size={18} />
        </button>
        <span style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--text2)' }}>
          {formatWeekRange(weekStart)}
        </span>
        <button
          onClick={() => setWeekOffset((o) => Math.min(0, o + 1))}
          disabled={weekOffset >= 0}
          style={{
            background: 'none', border: 'none',
            cursor: weekOffset >= 0 ? 'default' : 'pointer',
            color: 'var(--text2)', padding: '4px 6px', lineHeight: 0, borderRadius: 6,
            opacity: weekOffset >= 0 ? 0.25 : 1,
          }}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Grid */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--edge)',
        borderRadius: 'var(--radius)', overflow: 'hidden',
      }}>
        {/* Column headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '90px repeat(7, 1fr)',
          borderBottom: '1px solid var(--edge)',
        }}>
          <div />
          {weekDays.map((day) => {
            const today = isToday(day)
            return (
              <div
                key={toDateStr(day)}
                style={{
                  padding: '6px 2px', textAlign: 'center',
                  background: today ? 'rgba(91,141,238,0.1)' : 'transparent',
                }}
              >
                <div style={{
                  fontSize: 9, color: today ? 'var(--accent)' : 'var(--text3)',
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em',
                }}>
                  {getDayName(day)}
                </div>
                <div style={{
                  fontSize: 13, color: today ? 'var(--accent)' : 'var(--text2)',
                  fontWeight: 500, marginTop: 1,
                }}>
                  {day.getDate()}
                </div>
              </div>
            )
          })}
        </div>

        {/* Habit rows */}
        {habits.map((habit, hIdx) => (
          <div
            key={habit.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '90px repeat(7, 1fr)',
              borderBottom: hIdx < habits.length - 1 ? '1px solid var(--edge)' : 'none',
            }}
          >
            {/* Habit label */}
            <div style={{
              padding: '8px 8px', display: 'flex', alignItems: 'center', gap: 5,
              borderRight: '1px solid var(--edge)', overflow: 'hidden',
            }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>{habit.icon}</span>
              <span style={{
                fontSize: 11, color: 'var(--text)', fontWeight: 500,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {habit.name}
              </span>
            </div>

            {/* Day cells */}
            {weekDays.map((day) => {
              const dateStr = toDateStr(day)
              const todayCell = isToday(day)
              const done = logsMap.get(dateStr)?.has(habit.id) ?? false
              return (
                <div
                  key={dateStr}
                  onClick={() => toggle.mutate({ habitId: habit.id, date: dateStr, currentlyDone: done })}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '8px 2px',
                    background: todayCell ? 'rgba(91,141,238,0.05)' : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    background: done ? `var(${habit.color})` : 'transparent',
                    border: `1.5px solid var(${habit.color})`,
                    opacity: done ? 1 : 0.3,
                    transition: 'background 0.15s, opacity 0.15s',
                  }} />
                </div>
              )
            })}
          </div>
        ))}

        {/* Completion row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '90px repeat(7, 1fr)',
          borderTop: '1px solid var(--edge)',
          background: 'var(--bg2)',
        }}>
          <div style={{
            padding: '5px 8px', display: 'flex', alignItems: 'center',
            borderRight: '1px solid var(--edge)',
          }}>
            <span style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Done
            </span>
          </div>
          {weekDays.map((day) => {
            const dateStr = toDateStr(day)
            const dayLogs = logsMap.get(dateStr)
            const count = dayLogs ? habits.filter((h) => dayLogs.has(h.id)).length : 0
            const pct = habits.length > 0 ? Math.round((count / habits.length) * 100) : 0
            const color = pct === 100 ? 'var(--green)' : pct >= 50 ? 'var(--gold)' : 'var(--text3)'
            return (
              <div key={dateStr} style={{ padding: '5px 2px', textAlign: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color }}>
                  {pct > 0 ? `${pct}%` : '—'}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
