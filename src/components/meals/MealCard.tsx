import { useState } from 'react'
import { Check } from 'lucide-react'
import type { Meal } from '@/types/meals'

interface Props {
  meal: Meal
  isEaten?: boolean
  onToggle?: () => void
}

export function MealCard({ meal, isEaten = false, onToggle }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div
      style={{
        background: 'var(--card)',
        border: `1px solid ${open ? 'var(--accentbd)' : 'var(--edge)'}`,
        borderRadius: 'var(--radius)',
        marginBottom: 10,
        overflow: 'hidden',
        transition: 'border-color 0.18s',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '13px 14px',
        }}
      >
        <div
          onClick={() => setOpen(!open)}
          style={{ display: 'flex', alignItems: 'center', gap: 11, flex: 1, cursor: 'pointer', userSelect: 'none' }}
        >
          <div
            style={{
              width: 36, height: 36,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, flexShrink: 0,
              border: '1px solid var(--edge)',
              opacity: isEaten ? 0.5 : 1,
            }}
          >
            {meal.icon}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: isEaten ? 'var(--text3)' : 'var(--text)', textDecoration: isEaten ? 'line-through' : 'none' }}>{meal.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{meal.time}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onToggle && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggle() }}
              title={isEaten ? 'Mark as not eaten' : 'Mark as eaten'}
              style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isEaten ? 'var(--greenbg)' : 'transparent',
                border: `1.5px solid ${isEaten ? 'var(--green)' : 'var(--edge)'}`,
                cursor: 'pointer', transition: 'all 0.15s',
                color: isEaten ? 'var(--green)' : 'var(--text3)',
              }}
            >
              {isEaten ? <Check size={14} strokeWidth={2.5} /> : <span style={{ fontSize: 14 }}>+</span>}
            </button>
          )}
          <div
            onClick={() => setOpen(!open)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
          >
            <div style={{ fontSize: 13, color: 'var(--accent2)', fontWeight: 600, flexShrink: 0 }}>
              {meal.kcal} kcal
            </div>
            <div
              style={{
                fontSize: 16,
                color: 'var(--text3)',
                transition: 'transform 0.22s',
                transform: open ? 'rotate(180deg)' : 'none',
                flexShrink: 0,
                marginLeft: 4,
              }}
            >
              ⌄
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      {open && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {/* Ingredients */}
          <div style={{ padding: '12px 14px' }}>
            <div
              style={{
                fontSize: 10, fontWeight: 600, letterSpacing: '0.10em',
                color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 8,
              }}
            >
              Ingredients
            </div>
            {meal.ingredients.map((ing, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                  padding: '5px 0',
                  borderBottom: i < meal.ingredients.length - 1 ? '1px solid var(--border)' : 'none',
                  fontSize: 13,
                }}
              >
                <div style={{ color: 'var(--text)' }}>{ing.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{ing.macro}</div>
              </div>
            ))}
          </div>

          {/* Steps */}
          <div
            style={{
              padding: '12px 14px',
              background: 'var(--bg3)',
              borderTop: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                fontSize: 10, fontWeight: 600, letterSpacing: '0.10em',
                color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 8,
              }}
            >
              How to cook
            </div>
            {meal.steps.map((step, si) => (
              <div
                key={si}
                style={{
                  display: 'flex', gap: 11, padding: '9px 0',
                  borderBottom: si < meal.steps.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div
                  style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'var(--accent)', color: '#fff',
                    fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 1,
                  }}
                >
                  {si + 1}
                </div>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.55 }}>
                    {step.text}
                  </div>
                  {step.tip && (
                    <div
                      style={{
                        marginTop: 5, fontSize: 12, color: 'var(--gold)',
                        display: 'flex', gap: 5,
                      }}
                    >
                      💡 {step.tip}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
