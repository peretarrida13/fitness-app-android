import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useHabitLogsForMonth } from '@/hooks/useHabitData'
import { toDateStr, getDayOfWeekIndex, isToday } from '@/lib/dateUtils'
import type { Habit } from '@/types/supabase'

interface Props {
  habits: Habit[]
}

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function MonthTab({ habits }: Props) {
  const [monthOffset, setMonthOffset] = useState(0)

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)

  const { data: habitLogsMap } = useHabitLogsForMonth(monthStart)

  // Build Mon-anchored calendar grid
  const gridStart = new Date(monthStart)
  gridStart.setDate(monthStart.getDate() - getDayOfWeekIndex(monthStart))

  const weeks: Date[][] = []
  const cursor = new Date(gridStart)
  while (cursor <= monthEnd) {
    const week: Date[] = []
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }

  const monthLabel = monthStart.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div style={{ marginTop: 16 }}>
      {/* Month navigation */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <button
          onClick={() => setMonthOffset((o) => o - 1)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text2)', padding: 4, lineHeight: 0,
          }}
        >
          <ChevronLeft size={18} />
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
          {monthLabel}
        </span>
        <button
          onClick={() => setMonthOffset((o) => o + 1)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text2)', padding: 4, lineHeight: 0,
          }}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4,
      }}>
        {DAY_HEADERS.map((d) => (
          <div key={d} style={{
            textAlign: 'center', fontSize: 10, fontWeight: 600,
            color: 'var(--text3)', paddingBottom: 2,
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {week.map((day) => {
              const dateStr = toDateStr(day)
              const logsForDay = habitLogsMap?.get(dateStr)
              const inMonth = day.getMonth() === monthStart.getMonth()
              const dayIsToday = isToday(day)
              const doneDots = habits.filter((h) => logsForDay?.has(h.id))

              return (
                <div
                  key={dateStr}
                  style={{
                    minHeight: 44,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '5px 2px 4px',
                    borderRadius: 6,
                    background: dayIsToday ? 'var(--accentbg)' : 'transparent',
                    border: `1px solid ${dayIsToday ? 'var(--accentbd)' : 'transparent'}`,
                    opacity: inMonth ? 1 : 0.25,
                  }}
                >
                  <span style={{
                    fontSize: 12,
                    fontWeight: dayIsToday ? 700 : 400,
                    color: dayIsToday ? 'var(--accent)' : 'var(--text2)',
                  }}>
                    {day.getDate()}
                  </span>
                  {doneDots.length > 0 && (
                    <div style={{
                      display: 'flex', flexWrap: 'wrap', gap: 2,
                      marginTop: 3, justifyContent: 'center',
                    }}>
                      {doneDots.slice(0, 5).map((h) => (
                        <div
                          key={h.id}
                          style={{
                            width: 4, height: 4, borderRadius: '50%',
                            background: `var(${h.color})`,
                            flexShrink: 0,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
