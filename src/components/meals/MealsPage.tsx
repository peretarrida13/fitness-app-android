import { useState, useEffect } from 'react'
import { useUIStore } from '@/store/useUIStore'
import { useAuthStore } from '@/store/useAuthStore'
import { DAYS } from '@/data/defaultMeals'
import { getMondayOfWeek, toDateStr } from '@/lib/dateUtils'
import { useMealLogsForDay, useToggleMealLog } from '@/hooks/useMealLogs'
import { useExtrasStore } from '@/store/useExtrasStore'
import { MealCard } from './MealCard'
import { ShoppingContent } from '@/components/shopping/ShoppingContent'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
type MealsTab = 'plan' | 'shopping'

export function MealsPage() {
  const [activeTab, setActiveTab] = useState<MealsTab>('plan')
  const { activeMealDay, setActiveMealDay } = useUIStore()
  const { user } = useAuthStore()
  const day = DAYS[activeMealDay]

  const mondayOfWeek = getMondayOfWeek(new Date())
  const selectedDayDate = new Date(mondayOfWeek)
  selectedDayDate.setDate(selectedDayDate.getDate() + activeMealDay)
  const selectedDateStr = toDateStr(selectedDayDate)

  const { data: eatenSet } = useMealLogsForDay(selectedDateStr)
  const toggleMealLog = useToggleMealLog()

  const extrasMap = useExtrasStore((s) => s.extras)
  const setExtras = useExtrasStore((s) => s.setExtras)
  const storedExtras = extrasMap[selectedDateStr] ?? { kcal: 0, protein: 0 }

  const [extraKcal, setExtraKcal] = useState(storedExtras.kcal ? String(storedExtras.kcal) : '')
  const [extraProtein, setExtraProtein] = useState(storedExtras.protein ? String(storedExtras.protein) : '')

  useEffect(() => {
    const e = extrasMap[selectedDateStr] ?? { kcal: 0, protein: 0 }
    setExtraKcal(e.kcal ? String(e.kcal) : '')
    setExtraProtein(e.protein ? String(e.protein) : '')
  }, [selectedDateStr, extrasMap])

  const eatenMeals = user && eatenSet ? day.meals.filter((m) => eatenSet.has(m.id)) : []
  const eatenKcal = eatenMeals.reduce((sum, m) => sum + m.kcal, 0) + (parseInt(extraKcal) || 0)
  const eatenProtein = eatenMeals.reduce((sum, m) => sum + (m.protein ?? 0), 0) + (parseInt(extraProtein) || 0)

  return (
    <div>
      {/* Sticky header */}
      <div
        style={{
          background: 'rgba(10,10,15,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding: '48px 20px 0',
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
          {activeTab === 'plan' ? '7-Day Meal Plan' : 'Shopping List'}
        </h1>
        <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3, letterSpacing: '0.02em' }}>
          {activeTab === 'plan' ? 'High protein · 2,150 kcal · Recomposition plan' : 'All ingredients for the week'}
        </p>

        {/* Plan / Shopping tab strip */}
        <div style={{ display: 'flex', marginTop: 14 }}>
          {(['plan', 'shopping'] as MealsTab[]).map((tab) => (
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
              {tab === 'plan' ? 'Plan' : 'Shopping'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'shopping' && <ShoppingContent />}

      {activeTab === 'plan' && (
        <>
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
              position: 'sticky', top: 124, zIndex: 99,
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
          <div style={{ padding: '14px 16px 96px' }}>
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

            {/* Eaten today running total */}
            {user && eatenMeals.length > 0 && (
              <div style={{
                padding: '10px 14px', marginBottom: 14,
                background: 'var(--greenbg)', border: '1px solid rgba(86,201,154,0.25)',
                borderRadius: 'var(--radius)',
                fontSize: 13, color: 'var(--green)',
              }}>
                Eaten so far: <strong>{eatenKcal.toLocaleString()}</strong> / {day.macros.kcal.toLocaleString()} kcal
                {eatenProtein > 0 && <> · <strong>{eatenProtein}g</strong> / {day.macros.protein}g protein</>}
              </div>
            )}

            {/* Meal cards */}
            {day.meals.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                isEaten={user ? (eatenSet?.has(meal.id) ?? false) : false}
                onToggle={user
                  ? () => toggleMealLog.mutate({ date: selectedDateStr, mealId: meal.id, currentlyEaten: eatenSet?.has(meal.id) ?? false })
                  : undefined
                }
              />
            ))}

            {/* Extras / Off-plan */}
            <div style={{
              background: 'var(--card)', border: '1px solid var(--edge)',
              borderRadius: 'var(--radius)', padding: '12px 14px', marginTop: 8,
            }}>
              <div style={{
                fontSize: 10, fontWeight: 600, color: 'var(--text3)',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
              }}>
                Extras / Off-plan
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Extra kcal</div>
                  <input
                    type="number"
                    placeholder="0"
                    value={extraKcal}
                    min={0}
                    max={5000}
                    onChange={(e) => {
                      setExtraKcal(e.target.value)
                      setExtras(selectedDateStr, parseInt(e.target.value) || 0, parseInt(extraProtein) || 0)
                    }}
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Extra protein (g)</div>
                  <input
                    type="number"
                    placeholder="0"
                    value={extraProtein}
                    min={0}
                    max={500}
                    onChange={(e) => {
                      setExtraProtein(e.target.value)
                      setExtras(selectedDateStr, parseInt(extraKcal) || 0, parseInt(e.target.value) || 0)
                    }}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '8px 10px',
  background: 'var(--bg2)', border: '1px solid var(--edge)',
  borderRadius: 'var(--radius-sm)', color: 'var(--text)',
  fontSize: 14, outline: 'none',
}
