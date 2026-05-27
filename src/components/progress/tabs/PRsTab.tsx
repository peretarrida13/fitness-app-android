import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { usePersonalRecords, useAddPR, useDeletePR } from '@/hooks/useProgressData'
import type { PersonalRecord } from '@/types/supabase'

const DEFAULT_EXERCISES = [
  'Barbell Bench Press',
  'Overhead Press',
  'Squat',
  'Deadlift',
  'Weighted Pull-ups',
  'Dumbbell Row',
]

function e1rm(weight: number, reps: number): number {
  // Brzycki formula
  return Math.round(weight / (1.0278 - 0.0278 * reps) * 10) / 10
}

export function PRsTab() {
  const { data: allPRs = [] } = usePersonalRecords()
  const addPR = useAddPR()
  const deletePR = useDeletePR()

  const [expanded, setExpanded] = useState<string | null>(null)
  const [newExercise, setNewExercise] = useState('')
  const [form, setForm] = useState({ weight_kg: '', reps: '', note: '' })
  const [addingCustom, setAddingCustom] = useState(false)

  // Group PRs by exercise
  const byExercise = new Map<string, PersonalRecord[]>()
  for (const pr of allPRs) {
    const list = byExercise.get(pr.exercise_name) ?? []
    list.push(pr)
    byExercise.set(pr.exercise_name, list)
  }

  // Merge tracked exercises with any custom ones from the DB
  const allExercises = [...new Set([...DEFAULT_EXERCISES, ...byExercise.keys()])]

  function topPR(name: string): PersonalRecord | undefined {
    return byExercise.get(name)?.reduce((best, pr) =>
      e1rm(pr.weight_kg, pr.reps) > e1rm(best.weight_kg, best.reps) ? pr : best
    )
  }

  async function handleAdd(exerciseName: string) {
    const kg = parseFloat(form.weight_kg)
    const reps = parseInt(form.reps)
    if (isNaN(kg) || isNaN(reps) || kg <= 0 || reps <= 0) return
    await addPR.mutateAsync({ exercise_name: exerciseName, weight_kg: kg, reps, note: form.note || undefined })
    setForm({ weight_kg: '', reps: '', note: '' })
    setExpanded(exerciseName)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

      {allExercises.map((name) => {
        const best = topPR(name)
        const history = byExercise.get(name) ?? []
        const isOpen = expanded === name

        return (
          <div
            key={name}
            style={{
              background: 'var(--card)', border: '1px solid var(--edge)',
              borderRadius: 'var(--radius)', overflow: 'hidden',
            }}
          >
            {/* Header row */}
            <button
              onClick={() => setExpanded(isOpen ? null : name)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                padding: '13px 14px', background: 'none', border: 'none',
                cursor: 'pointer', textAlign: 'left', gap: 10,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{name}</div>
                {best ? (
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                    Best: <span style={{ color: 'var(--accent)' }}>{best.weight_kg} kg × {best.reps}</span>
                    <span style={{ color: 'var(--text3)' }}> · {e1rm(best.weight_kg, best.reps)} kg e1RM</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>No records yet</div>
                )}
              </div>
              {isOpen ? <ChevronUp size={16} color="var(--text3)" /> : <ChevronDown size={16} color="var(--text3)" />}
            </button>

            {/* Expanded content */}
            {isOpen && (
              <div style={{ borderTop: '1px solid var(--border)', padding: '12px 14px' }}>
                {/* History */}
                {history.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    {history.slice(0, 5).map((pr) => (
                      <div
                        key={pr.id}
                        style={{
                          display: 'flex', alignItems: 'center',
                          padding: '6px 0', borderBottom: '1px solid var(--border)',
                          fontSize: 12,
                        }}
                      >
                        <span style={{ color: 'var(--text3)', width: 72 }}>{pr.logged_date.slice(5)}</span>
                        <span style={{ flex: 1, color: 'var(--text)' }}>
                          {pr.weight_kg} kg × {pr.reps} reps
                        </span>
                        <span style={{ color: 'var(--text3)', marginRight: 10 }}>
                          {e1rm(pr.weight_kg, pr.reps)} e1RM
                        </span>
                        <button
                          onClick={() => deletePR.mutate(pr.id)}
                          style={{
                            background: 'none', border: 'none', color: 'var(--text3)',
                            cursor: 'pointer', fontSize: 12, padding: '0 2px',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add PR form */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input
                    type="number"
                    placeholder="kg"
                    step="0.5"
                    value={form.weight_kg}
                    onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value }))}
                    style={inputStyle}
                  />
                  <span style={{ color: 'var(--text3)', fontSize: 12 }}>×</span>
                  <input
                    type="number"
                    placeholder="reps"
                    value={form.reps}
                    onChange={(e) => setForm((f) => ({ ...f, reps: e.target.value }))}
                    style={{ ...inputStyle, width: 60 }}
                  />
                  <button
                    onClick={() => handleAdd(name)}
                    disabled={addPR.isPending}
                    style={{
                      padding: '8px 14px', background: 'var(--accent)',
                      border: 'none', borderRadius: 'var(--radius-sm)',
                      color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    Add PR
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Add custom exercise */}
      {addingCustom ? (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--edge)',
          borderRadius: 'var(--radius)', padding: '14px',
          display: 'flex', gap: 8,
        }}>
          <input
            autoFocus
            placeholder="Exercise name"
            value={newExercise}
            onChange={(e) => setNewExercise(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            onClick={() => {
              if (newExercise.trim()) {
                setExpanded(newExercise.trim())
                setNewExercise('')
              }
              setAddingCustom(false)
            }}
            style={{
              padding: '8px 14px', background: 'var(--accent)',
              border: 'none', borderRadius: 'var(--radius-sm)',
              color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Add
          </button>
          <button
            onClick={() => setAddingCustom(false)}
            style={{
              padding: '8px 10px', background: 'none',
              border: '1px solid var(--edge)', borderRadius: 'var(--radius-sm)',
              color: 'var(--text3)', fontSize: 12, cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAddingCustom(true)}
          style={{
            width: '100%', padding: '11px',
            background: 'transparent', border: '1px dashed var(--edge)',
            borderRadius: 'var(--radius)', color: 'var(--text3)',
            fontSize: 12, cursor: 'pointer', marginTop: 2,
          }}
        >
          + Add exercise
        </button>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  flex: 1, padding: '8px 10px',
  background: 'var(--bg2)', border: '1px solid var(--edge)',
  borderRadius: 'var(--radius-sm)', color: 'var(--text)',
  fontSize: 13, outline: 'none', minWidth: 0,
}
