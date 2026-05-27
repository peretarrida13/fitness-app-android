import { SHOPPING } from '@/data/defaultShopping'
import { useShoppingStore } from '@/store/useShoppingStore'

export function ShoppingPage() {
  const { checked, toggle, clearAll } = useShoppingStore()

  return (
    <div style={{ padding: '14px 16px' }}>
      {/* Header */}
      <div style={{ padding: '20px 0 14px', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
              Shopping List
            </h1>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
              All ingredients for the week
            </p>
          </div>
          <button
            onClick={clearAll}
            style={{
              background: 'var(--card)', border: '1px solid var(--edge)',
              borderRadius: 'var(--radius-sm)', padding: '6px 12px',
              fontSize: 12, color: 'var(--text2)', cursor: 'pointer',
              marginTop: 4,
            }}
          >
            Clear checked
          </button>
        </div>
      </div>

      {/* Shopping categories */}
      {Object.entries(SHOPPING).map(([category, items]) => (
        <div key={category} style={{ marginBottom: 22 }}>
          <div
            style={{
              fontSize: 11, fontWeight: 600, color: 'var(--text3)',
              textTransform: 'uppercase', letterSpacing: '0.10em',
              marginBottom: 6, paddingBottom: 6,
              borderBottom: '1px solid var(--edge)',
            }}
          >
            {category}
          </div>
          {items.map((item, i) => {
            const key = `${category}-${i}`
            const isChecked = !!checked[key]
            return (
              <div
                key={key}
                onClick={() => toggle(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0',
                  borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer',
                }}
              >
                {/* Checkbox */}
                <div
                  style={{
                    width: 20, height: 20,
                    border: isChecked ? '1.5px solid var(--accent)' : '1.5px solid var(--edge)',
                    borderRadius: 5, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isChecked ? 'var(--accent)' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  {isChecked && (
                    <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>
                  )}
                </div>
                {/* Name */}
                <div
                  style={{
                    fontSize: 13, flex: 1,
                    color: isChecked ? 'var(--text3)' : 'var(--text)',
                    textDecoration: isChecked ? 'line-through' : 'none',
                  }}
                >
                  {item.name}
                </div>
                {/* Qty */}
                <div style={{ fontSize: 12, color: 'var(--text3)', flexShrink: 0 }}>
                  {item.qty}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
