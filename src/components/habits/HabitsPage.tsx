import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useHabits, useHabitStreaks, useAddHabit } from '@/hooks/useHabitData'
import { TodayTab } from './tabs/TodayTab'
import { TasksTab } from './tabs/TasksTab'
import { MonthTab } from './tabs/MonthTab'
import type { HabitColor } from '@/types/supabase'

export const HABIT_COLORS: { value: HabitColor; label: string }[] = [
  { value: '--accent', label: 'Blue'  },
  { value: '--green',  label: 'Green' },
  { value: '--gold',   label: 'Gold'  },
  { value: '--red',    label: 'Red'   },
  { value: '--text2',  label: 'Grey'  },
]

type Tab = 'today' | 'tasks' | 'month'

export function HabitsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('today')
  const [showAddForm, setShowAddForm] = useState(false)
  const [addName, setAddName] = useState('')
  const [addIcon, setAddIcon] = useState('✅')
  const [addColor, setAddColor] = useState<HabitColor>('--accent')

  const { data: habits = [] } = useHabits()
  const { data: streaks = new Map() } = useHabitStreaks()
  const addHabit = useAddHabit()

  async function handleAddSave() {
    const name = addName.trim()
    if (!name) return
    try {
      await addHabit.mutateAsync({
        name,
        icon: addIcon || '✅',
        color: addColor,
        sort_order: habits.length,
      })
      setAddName('')
      setAddIcon('✅')
      setAddColor('--accent')
      setShowAddForm(false)
    } catch (err) {
      alert(`Failed to save habit: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  function handleCancel() {
    setShowAddForm(false)
    setAddName('')
    setAddIcon('✅')
    setAddColor('--accent')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(10,10,15,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--edge)',
        padding: 'calc(env(safe-area-inset-top, 0px) + 14px) 16px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0,
            }}>Habits</h1>
            <p style={{ fontSize: 12, color: 'var(--text2)', margin: '2px 0 0' }}>
              Track your daily habits
            </p>
          </div>
          {activeTab === 'today' && (
            <button
              onClick={() => setShowAddForm((v) => !v)}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: showAddForm ? 'var(--accent)' : 'var(--card)',
                border: '1px solid var(--edge)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: showAddForm ? '#fff' : 'var(--text2)',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <Plus size={18} />
            </button>
          )}
        </div>

        {/* Tab strip */}
        <div style={{ display: 'flex' }}>
          {(['today', 'tasks', 'month'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '8px 0',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${activeTab === tab ? 'var(--accent)' : 'transparent'}`,
                color: activeTab === tab ? 'var(--accent)' : 'var(--text3)',
                fontSize: 13, fontWeight: 500,
                cursor: 'pointer',
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              {tab === 'today' ? 'Today' : tab === 'tasks' ? 'Tasks' : 'Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Add habit form (Today tab only) */}
      {showAddForm && activeTab === 'today' && (
        <div style={{
          margin: '12px 16px 0',
          background: 'var(--card)',
          border: '1px solid var(--edge)',
          borderRadius: 'var(--radius)',
          padding: 14,
        }}>
          <p style={{
            fontSize: 11, fontWeight: 600, color: 'var(--text3)',
            marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            New Habit
          </p>
          <input
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSave()}
            placeholder="Habit name…"
            maxLength={100}
            autoFocus
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'var(--bg2)', border: '1px solid var(--edge)',
              borderRadius: 'var(--radius-sm)', padding: '8px 10px',
              color: 'var(--text)', fontSize: 14, outline: 'none',
              marginBottom: 10,
            }}
          />
          <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 5 }}>Icon</p>
              <input
                value={addIcon}
                onChange={(e) => setAddIcon(e.target.value.slice(0, 2))}
                placeholder="✅"
                style={{
                  width: 48, background: 'var(--bg2)', border: '1px solid var(--edge)',
                  borderRadius: 'var(--radius-sm)', padding: '6px 4px',
                  color: 'var(--text)', fontSize: 20, outline: 'none', textAlign: 'center',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 5 }}>Color</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {HABIT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setAddColor(c.value)}
                    title={c.label}
                    style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: `var(${c.value})`,
                      border: addColor === c.value ? '3px solid var(--text)' : '3px solid transparent',
                      cursor: 'pointer', flexShrink: 0,
                      boxShadow: addColor === c.value ? `0 0 0 1px var(${c.value})` : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleAddSave}
              disabled={!addName.trim() || addHabit.isPending}
              style={{
                flex: 1, padding: '9px', borderRadius: 'var(--radius-sm)',
                background: 'var(--accent)', border: 'none',
                color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: addName.trim() && !addHabit.isPending ? 'pointer' : 'not-allowed',
                opacity: addName.trim() && !addHabit.isPending ? 1 : 0.5,
              }}
            >
              {addHabit.isPending ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              style={{
                flex: 1, padding: '9px', borderRadius: 'var(--radius-sm)',
                background: 'var(--bg3)', border: '1px solid var(--edge)',
                color: 'var(--text2)', fontSize: 13, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tab content */}
      <div style={{ padding: '0 16px 96px' }}>
        {activeTab === 'today' && <TodayTab habits={habits} streaks={streaks} />}
        {activeTab === 'tasks' && <TasksTab />}
        {activeTab === 'month' && <MonthTab habits={habits} />}
      </div>
    </div>
  )
}
