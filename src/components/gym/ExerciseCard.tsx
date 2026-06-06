import { useState } from 'react'
import type { Exercise } from '@/types/gym'

interface Props {
  exercise: Exercise
  isCardio?: boolean
  lastPR?: { weight_kg: number; reps: number }
  onLogPR?: (kg: number, reps: number) => void
}

export function ExerciseCard({ exercise, isCardio = false, lastPR, onLogPR }: Props) {
  const [open, setOpen] = useState(false)
  const [prKg, setPrKg] = useState('')
  const [prReps, setPrReps] = useState('')

  const badgeStyle = exercise.type === 'compound'
    ? { background: 'rgba(240,192,96,0.12)', color: 'var(--gold)' }
    : exercise.type === 'cardio'
      ? { background: 'var(--accentbg)', color: 'var(--accent2)' }
      : { background: 'var(--accentbg)', color: 'var(--accent2)' }

  const badgeLabel = exercise.type === 'compound' ? 'Compound' : exercise.type === 'cardio' ? exercise.badge ?? 'Cardio' : 'Accessory'

  function handleLogPR() {
    const kg = parseFloat(prKg)
    const reps = parseInt(prReps)
    if (isNaN(kg) || kg <= 0 || isNaN(reps) || reps < 1) return
    onLogPR?.(kg, reps)
    setPrKg('')
    setPrReps('')
  }

  return (
    <div
      style={{
        background: 'var(--card)',
        border: `1px solid ${open ? 'var(--accentbd)' : 'var(--edge)'}`,
        borderRadius: 'var(--radius)',
        marginBottom: 8,
        overflow: 'hidden',
        transition: 'border-color 0.18s',
      }}
    >
      {/* Header */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          padding: '12px 14px', cursor: 'pointer',
        }}
      >
        {isCardio ? (
          <>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{exercise.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{exercise.details}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 20,
                  flexShrink: 0, fontWeight: 600, letterSpacing: '0.03em',
                  ...badgeStyle,
                }}
              >
                {exercise.badge}
              </span>
              <div
                style={{
                  fontSize: 14, color: 'var(--text3)',
                  transition: 'transform 0.2s',
                  transform: open ? 'rotate(180deg)' : 'none',
                  flexShrink: 0,
                }}
              >
                ⌄
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{exercise.name}</div>
                <span
                  style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 20,
                    flexShrink: 0, marginLeft: 4, marginTop: 3, fontWeight: 600,
                    letterSpacing: '0.03em',
                    ...badgeStyle,
                  }}
                >
                  {badgeLabel}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{exercise.muscle}</div>
              {lastPR && (
                <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 3 }}>
                  Best: {lastPR.weight_kg} kg × {lastPR.reps} reps
                </div>
              )}
            </div>
            <div
              style={{
                fontSize: 14, color: 'var(--text3)',
                transition: 'transform 0.2s',
                transform: open ? 'rotate(180deg)' : 'none',
                flexShrink: 0,
              }}
            >
              ⌄
            </div>
          </>
        )}
      </div>

      {/* Stats (only for strength exercises) */}
      {!isCardio && exercise.sets && exercise.reps && exercise.rest && (
        <div
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
            gap: 6, padding: '0 14px 12px',
          }}
        >
          {[
            { val: exercise.sets, lbl: 'Sets' },
            { val: exercise.reps, lbl: 'Reps' },
            { val: exercise.rest, lbl: 'Rest' },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                background: 'var(--bg3)', borderRadius: 'var(--radius-sm)',
                padding: 8, textAlign: 'center', border: '1px solid var(--border)',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{stat.val}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {stat.lbl}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Body */}
      {open && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {exercise.tip && (
            <div
              style={{
                padding: '12px 14px', background: 'var(--bg3)',
                fontSize: 13, color: 'var(--text2)', lineHeight: 1.55,
                borderBottom: exercise.alts && exercise.alts.length ? '1px solid var(--border)' : 'none',
              }}
            >
              💡 {exercise.tip}
            </div>
          )}
          {exercise.alts && exercise.alts.length > 0 && (
            <div style={{ padding: '12px 14px' }}>
              <div
                style={{
                  fontSize: 10, fontWeight: 600, color: 'var(--gold)',
                  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8,
                }}
              >
                🔄 Alternative exercises
              </div>
              {exercise.alts.map((alt, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                    padding: '6px 0',
                    borderBottom: i < (exercise.alts?.length ?? 0) - 1 ? '1px solid var(--border)' : 'none',
                    fontSize: 13,
                  }}
                >
                  <div style={{ color: 'var(--text)', fontWeight: 500, minWidth: 150, flexShrink: 0 }}>
                    {alt.name}
                  </div>
                  <div style={{ color: 'var(--text3)', fontSize: 12, lineHeight: 1.4 }}>
                    {alt.reason}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick PR log */}
          {!isCardio && onLogPR && (
            <div style={{
              padding: '12px 14px',
              borderTop: '1px solid var(--border)',
            }}>
              <div style={{
                fontSize: 10, fontWeight: 600, color: 'var(--text3)',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
              }}>
                Log PR
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="number"
                  placeholder="kg"
                  step="0.5"
                  value={prKg}
                  onChange={(e) => setPrKg(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={inputStyle}
                />
                <span style={{ color: 'var(--text3)', fontSize: 12 }}>×</span>
                <input
                  type="number"
                  placeholder="reps"
                  value={prReps}
                  onChange={(e) => setPrReps(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{ ...inputStyle, width: 60 }}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); handleLogPR() }}
                  disabled={!prKg || !prReps}
                  style={{
                    padding: '8px 14px', background: 'var(--accent)',
                    border: 'none', borderRadius: 'var(--radius-sm)',
                    color: '#fff', fontSize: 12, fontWeight: 600,
                    cursor: prKg && prReps ? 'pointer' : 'not-allowed',
                    opacity: prKg && prReps ? 1 : 0.5,
                    flexShrink: 0,
                  }}
                >
                  Log
                </button>
              </div>
            </div>
          )}
        </div>
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
