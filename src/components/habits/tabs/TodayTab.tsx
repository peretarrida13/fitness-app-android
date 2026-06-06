import { useState } from 'react'
import { Pencil, Trash2, Check } from 'lucide-react'
import {
  useHabitLogsForWeek,
  useToggleHabitLog,
  useUpdateHabit,
  useDeleteHabit,
} from '@/hooks/useHabitData'
import { getMondayOfWeek, toDateStr } from '@/lib/dateUtils'
import { HABIT_COLORS } from '../HabitsPage'
import type { Habit, HabitColor } from '@/types/supabase'

interface Props {
  habits: Habit[]
  streaks: Map<string, number>
}

interface EditState {
  name: string
  icon: string
  color: HabitColor
}

export function TodayTab({ habits, streaks }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>({ name: '', icon: '', color: '--accent' })

  const today = toDateStr(new Date())
  const { data: logsMap = new Map() } = useHabitLogsForWeek(getMondayOfWeek(new Date()))
  const toggle = useToggleHabitLog()
  const updateHabit = useUpdateHabit()
  const deleteHabit = useDeleteHabit()

  const todayLogs = logsMap.get(today) ?? new Set<string>()

  function startEdit(habit: Habit) {
    setEditingId(habit.id)
    setEditState({ name: habit.name, icon: habit.icon, color: habit.color })
  }

  async function saveEdit(id: string) {
    const name = editState.name.trim()
    await updateHabit.mutateAsync({
      id,
      ...(name ? { name } : {}),
      icon: editState.icon || undefined,
      color: editState.color,
    })
    setEditingId(null)
  }

  if (habits.length === 0) {
    return (
      <div style={{
        marginTop: 24,
        background: 'var(--card)', border: '1px solid var(--edge)',
        borderRadius: 'var(--radius)', padding: '40px 20px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
        <div style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 4, fontWeight: 500 }}>
          No habits yet
        </div>
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>
          Tap + to add your first habit
        </div>
      </div>
    )
  }

  const doneCount = habits.filter((h) => todayLogs.has(h.id)).length
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <p style={{ fontSize: 12, color: 'var(--text3)' }}>{todayLabel}</p>
        <p style={{ fontSize: 12, color: doneCount === habits.length ? 'var(--green)' : 'var(--text3)' }}>
          {doneCount}/{habits.length} done
        </p>
      </div>

      <div style={{
        background: 'var(--card)', border: '1px solid var(--edge)',
        borderRadius: 'var(--radius)', overflow: 'hidden',
      }}>
        {habits.map((habit, idx) => {
          const done = todayLogs.has(habit.id)
          const streak = streaks.get(habit.id) ?? 0
          const isLast = idx === habits.length - 1

          if (editingId === habit.id) {
            return (
              <div
                key={habit.id}
                style={{
                  padding: '12px 14px',
                  borderBottom: isLast ? 'none' : '1px solid var(--edge)',
                }}
              >
                <p style={{
                  fontSize: 10, fontWeight: 600, color: 'var(--text3)',
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
                }}>Edit Habit</p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    value={editState.name}
                    onChange={(e) => setEditState((s) => ({ ...s, name: e.target.value }))}
                    maxLength={100}
                    style={{
                      flex: 1, background: 'var(--bg2)', border: '1px solid var(--edge)',
                      borderRadius: 'var(--radius-sm)', padding: '6px 10px',
                      color: 'var(--text)', fontSize: 14, outline: 'none',
                    }}
                  />
                  <input
                    value={editState.icon}
                    onChange={(e) => setEditState((s) => ({ ...s, icon: e.target.value.slice(0, 2) }))}
                    style={{
                      width: 44, background: 'var(--bg2)', border: '1px solid var(--edge)',
                      borderRadius: 'var(--radius-sm)', padding: '6px 4px',
                      color: 'var(--text)', fontSize: 20, outline: 'none', textAlign: 'center',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  {HABIT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setEditState((s) => ({ ...s, color: c.value }))}
                      title={c.label}
                      style={{
                        width: 26, height: 26, borderRadius: '50%',
                        background: `var(${c.value})`,
                        border: editState.color === c.value ? '3px solid var(--text)' : '3px solid transparent',
                        cursor: 'pointer', flexShrink: 0,
                        boxShadow: editState.color === c.value ? `0 0 0 1px var(${c.value})` : 'none',
                      }}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => saveEdit(habit.id)}
                    disabled={updateHabit.isPending}
                    style={{
                      flex: 1, padding: '7px', borderRadius: 'var(--radius-sm)',
                      background: 'var(--accent)', border: 'none',
                      color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    {updateHabit.isPending ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    style={{
                      flex: 1, padding: '7px', borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg3)', border: '1px solid var(--edge)',
                      color: 'var(--text2)', fontSize: 12, cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )
          }

          return (
            <div
              key={habit.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px',
                borderBottom: isLast ? 'none' : '1px solid var(--edge)',
              }}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggle.mutate({ habitId: habit.id, date: today, currentlyDone: done })}
                style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  border: `1.5px solid var(${habit.color})`,
                  background: done ? `var(${habit.color})` : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'background 0.15s',
                }}
              >
                {done && <Check size={13} color="#fff" strokeWidth={3} />}
              </button>

              {/* Icon */}
              <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{habit.icon}</span>

              {/* Name */}
              <span style={{
                flex: 1, fontSize: 15, fontWeight: 500,
                color: done ? 'var(--text2)' : 'var(--text)',
                textDecoration: done ? 'line-through' : 'none',
                transition: 'color 0.15s',
              }}>
                {habit.name}
              </span>

              {/* Streak */}
              {streak > 0 && (
                <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600, flexShrink: 0 }}>
                  🔥 {streak}
                </span>
              )}

              {/* Edit */}
              <button
                onClick={() => startEdit(habit)}
                style={{
                  padding: 4, background: 'none', border: 'none',
                  cursor: 'pointer', color: 'var(--text3)', lineHeight: 0, flexShrink: 0,
                }}
              >
                <Pencil size={14} />
              </button>

              {/* Delete */}
              <button
                onClick={() => deleteHabit.mutate(habit.id)}
                disabled={deleteHabit.isPending}
                style={{
                  padding: 4, background: 'none', border: 'none',
                  cursor: 'pointer', color: 'var(--text3)', lineHeight: 0, flexShrink: 0,
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
