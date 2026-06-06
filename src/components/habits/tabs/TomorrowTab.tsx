import { useState } from 'react'
import { Check, CalendarClock } from 'lucide-react'
import { useHabitLogsForWeek, useToggleHabitLog } from '@/hooks/useHabitData'
import { getMondayOfWeek, toDateStr } from '@/lib/dateUtils'
import { useCalendarStore } from '@/store/useCalendarStore'
import { PlannerModal } from '../PlannerModal'
import type { Habit } from '@/types/supabase'

interface Props {
  habits: Habit[]
}

export function TomorrowTab({ habits }: Props) {
  const [showPlanner, setShowPlanner] = useState(false)

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = toDateStr(tomorrow)

  const { data: logsMap = new Map() } = useHabitLogsForWeek(getMondayOfWeek(tomorrow))
  const toggle = useToggleHabitLog()
  const googleAccessToken = useCalendarStore((s) => s.googleAccessToken)

  const tomorrowLogs = logsMap.get(tomorrowStr) ?? new Set<string>()
  const plannedCount = habits.filter((h) => tomorrowLogs.has(h.id)).length
  const plannedHabits = habits.filter((h) => tomorrowLogs.has(h.id))

  if (habits.length === 0) {
    return (
      <div style={{
        marginTop: 24,
        background: 'var(--card)', border: '1px solid var(--edge)',
        borderRadius: 'var(--radius)', padding: '40px 20px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
        <div style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 4, fontWeight: 500 }}>
          No habits yet
        </div>
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>
          Add habits from the Today tab
        </div>
      </div>
    )
  }

  const tomorrowLabel = tomorrow.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <p style={{ fontSize: 12, color: 'var(--text3)' }}>{tomorrowLabel}</p>
        <p style={{ fontSize: 12, color: plannedCount > 0 ? 'var(--accent)' : 'var(--text3)' }}>
          {plannedCount} planned
        </p>
      </div>

      <div style={{
        background: 'var(--card)', border: '1px solid var(--edge)',
        borderRadius: 'var(--radius)', overflow: 'hidden',
      }}>
        {habits.map((habit, idx) => {
          const planned = tomorrowLogs.has(habit.id)
          const isLast = idx === habits.length - 1

          return (
            <div
              key={habit.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px',
                borderBottom: isLast ? 'none' : '1px solid var(--edge)',
              }}
            >
              <button
                onClick={() => toggle.mutate({ habitId: habit.id, date: tomorrowStr, currentlyDone: planned })}
                style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  border: `1.5px solid var(${habit.color})`,
                  background: planned ? `var(${habit.color})` : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'background 0.15s',
                }}
              >
                {planned && <Check size={13} color="#fff" strokeWidth={3} />}
              </button>

              <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{habit.icon}</span>

              <span style={{
                flex: 1, fontSize: 15, fontWeight: 500,
                color: planned ? 'var(--text2)' : 'var(--text)',
                textDecoration: planned ? 'line-through' : 'none',
                transition: 'color 0.15s',
              }}>
                {habit.name}
              </span>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 16 }}>
        {googleAccessToken ? (
          <button
            onClick={() => setShowPlanner(true)}
            style={{
              width: '100%', padding: '12px',
              background: 'var(--card)', border: '1px solid var(--edge)',
              borderRadius: 'var(--radius)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              color: 'var(--accent)', fontSize: 14, fontWeight: 600,
              transition: 'background 0.15s',
            }}
          >
            <CalendarClock size={16} />
            Schedule My Day
          </button>
        ) : (
          <p style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.5 }}>
            Connect Google Calendar in the Calendar tab to schedule your day
          </p>
        )}
      </div>

      {showPlanner && (
        <PlannerModal
          plannedHabits={plannedHabits}
          tomorrow={tomorrow}
          onClose={() => setShowPlanner(false)}
        />
      )}
    </div>
  )
}
