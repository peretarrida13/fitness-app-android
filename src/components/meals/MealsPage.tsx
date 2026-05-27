import { useUIStore } from '@/store/useUIStore'
import { DAYS } from '@/data/defaultMeals'
import { MealCard } from './MealCard'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function MealsPage() {
  const { activeMealDay, setActiveMealDay } = useUIStore()
  const day = DAYS[activeMealDay]

  return (
    <div>
      {/* Header */}
      <div
        style={{
          background: 'rgba(10,10,15,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding: '48px 20px 14px',
          position: 'sticky', top: 0, zIndex: 100,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <h1
          style={{
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            fontSize: 24, fontWeight: 700,
            color: 'var(--text)', letterSpacing: '-0.5px', lineHeight: 1.1,
          }}
        >
          7-Day Meal Plan
        </h1>
        <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3, letterSpacing: '0.02em' }}>
          High protein · 2,150 kcal · Recomposition plan
        </p>
      </div>

      {/* Macro pill bar */}
      <div
        style={{
          display: 'flex', gap: 6,
          padding: '10px 16px',
          overflowX: 'auto', scrollbarWidth: 'none',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {[
          { label: '🔥', value: '2,150', suffix: ' kcal/day' },
          { label: '🥩', value: '170g', suffix: ' protein' },
          { label: '🌾', value: '220g', suffix: ' carbs' },
          { label: '🧈', value: '65g', suffix: ' fat' },
          { label: '⚖️ Goal:', value: '-0.5kg/wk', suffix: '' },
        ].map((pill, i) => (
          <div
            key={i}
            style={{
              flexShrink: 0,
              background: 'var(--card)',
              border: '1px solid var(--edge)',
              borderRadius: 20,
              padding: '5px 12px',
              fontSize: 12, color: 'var(--text2)',
              whiteSpace: 'nowrap', letterSpacing: '0.01em',
            }}
          >
            {pill.label}{' '}
            <span style={{ color: 'var(--accent2)', fontWeight: 600 }}>{pill.value}</span>
            {pill.suffix}
          </div>
        ))}
      </div>

      {/* Day tabs */}
      <div
        style={{
          display: 'flex', gap: 6,
          padding: '12px 16px',
          overflowX: 'auto', scrollbarWidth: 'none',
          background: 'rgba(10,10,15,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          position: 'sticky', top: 82, zIndex: 99,
          borderBottom: '1px solid var(--border)',
        }}
      >
        {DAY_LABELS.map((label, i) => (
          <button
            key={i}
            onClick={() => setActiveMealDay(i)}
            style={{
              flexShrink: 0,
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 12, fontWeight: 500,
              color: activeMealDay === i ? '#fff' : 'var(--text3)',
              background: activeMealDay === i ? 'var(--accent)' : 'transparent',
              border: `1px solid ${activeMealDay === i ? 'var(--accent)' : 'var(--edge)'}`,
              boxShadow: activeMealDay === i ? '0 2px 12px rgba(91,141,238,0.35)' : 'none',
              transition: 'all 0.18s',
              cursor: 'pointer',
              letterSpacing: '0.01em',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '14px 16px' }}>
        {/* Day summary */}
        <div
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
            background: 'var(--card)',
            border: '1px solid var(--edge)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            marginBottom: 14,
          }}
        >
          {[
            { val: day.macros.kcal.toLocaleString(), lbl: 'kcal' },
            { val: `${day.macros.protein}g`, lbl: 'protein' },
            { val: `${day.macros.carbs}g`, lbl: 'carbs' },
            { val: `${day.macros.fat}g`, lbl: 'fat' },
          ].map((item, i, arr) => (
            <div
              key={i}
              style={{
                padding: '12px 8px', textAlign: 'center',
                borderRight: i < arr.length - 1 ? '1px solid var(--edge)' : 'none',
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent2)', letterSpacing: '-0.5px' }}>
                {item.val}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {item.lbl}
              </div>
            </div>
          ))}
        </div>

        {/* Meal cards */}
        {day.meals.map((meal) => (
          <MealCard key={meal.id} meal={meal} />
        ))}
      </div>
    </div>
  )
}
