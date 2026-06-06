import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { SHOPPING } from '@/data/defaultShopping'
import { useShoppingStore } from '@/store/useShoppingStore'
import { useAuthStore } from '@/store/useAuthStore'
import {
  useShoppingChecks, useToggleShoppingCheck, useClearShoppingChecks,
  useCustomShoppingItems, useAddCustomShoppingItem, useDeleteCustomShoppingItem,
  useToggleCustomShoppingItem, useClearCustomShoppingChecks,
} from '@/hooks/useShoppingData'

const ALL_CATEGORIES = Object.keys(SHOPPING)

export function ShoppingContent() {
  const { user } = useAuthStore()

  const localStore = useShoppingStore()

  const { data: supaChecks } = useShoppingChecks()
  const toggleCheck = useToggleShoppingCheck()
  const clearChecks = useClearShoppingChecks()
  const { data: customItems = [] } = useCustomShoppingItems()
  const addCustom = useAddCustomShoppingItem()
  const deleteCustom = useDeleteCustomShoppingItem()
  const toggleCustom = useToggleCustomShoppingItem()
  const clearCustomChecked = useClearCustomShoppingChecks()

  const [showAddForm, setShowAddForm] = useState(false)
  const [addName, setAddName] = useState('')
  const [addQty, setAddQty] = useState('')
  const [addCategory, setAddCategory] = useState('My Items')

  function isChecked(key: string): boolean {
    if (user) return supaChecks?.has(key) ?? false
    return !!localStore.checked[key]
  }

  function handleToggle(key: string) {
    if (user) {
      const nowChecked = supaChecks ? !supaChecks.has(key) : false
      toggleCheck.mutate({ itemKey: key, nowChecked })
    } else {
      localStore.toggle(key)
    }
  }

  function handleClearAll() {
    if (user) {
      clearChecks.mutate()
      clearCustomChecked.mutate()
    } else {
      localStore.clearAll()
    }
  }

  async function handleAddCustom() {
    const name = addName.trim()
    if (!name) return
    await addCustom.mutateAsync({ name, qty: addQty.trim(), category: addCategory })
    setAddName('')
    setAddQty('')
    setAddCategory('My Items')
    setShowAddForm(false)
  }

  const customCategories = [...new Set(customItems.map((i) => i.category))]
  const allCategories = [...new Set([...ALL_CATEGORIES, ...customCategories])]

  return (
    <div style={{ padding: '0 16px 96px' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 0 10px', alignItems: 'center' }}>
        {user && (
          <button
            onClick={() => setShowAddForm((v) => !v)}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: showAddForm ? 'var(--accent)' : 'var(--card)',
              border: '1px solid var(--edge)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: showAddForm ? '#fff' : 'var(--text2)',
            }}
          >
            <Plus size={16} />
          </button>
        )}
        <button
          onClick={handleClearAll}
          style={{
            background: 'var(--card)', border: '1px solid var(--edge)',
            borderRadius: 'var(--radius-sm)', padding: '6px 12px',
            fontSize: 12, color: 'var(--text2)', cursor: 'pointer',
          }}
        >
          Clear checked
        </button>
      </div>

      {!user && (
        <div style={{
          background: 'var(--accentbg)', border: '1px solid var(--accentbd)',
          borderRadius: 'var(--radius)', padding: '10px 14px',
          fontSize: 12, color: 'var(--accent2)', marginBottom: 16,
        }}>
          Sign in to sync your list and add custom items
        </div>
      )}

      {showAddForm && user && (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--edge)',
          borderRadius: 'var(--radius)', padding: 14, marginBottom: 16,
        }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Add Custom Item
          </p>
          <input
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
            placeholder="Item name…"
            maxLength={100}
            autoFocus
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'var(--bg2)', border: '1px solid var(--edge)',
              borderRadius: 'var(--radius-sm)', padding: '8px 10px',
              color: 'var(--text)', fontSize: 14, outline: 'none', marginBottom: 8,
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              value={addQty}
              onChange={(e) => setAddQty(e.target.value)}
              placeholder="Qty (e.g. 500g)"
              maxLength={30}
              style={{
                flex: 1,
                background: 'var(--bg2)', border: '1px solid var(--edge)',
                borderRadius: 'var(--radius-sm)', padding: '8px 10px',
                color: 'var(--text)', fontSize: 14, outline: 'none',
              }}
            />
            <select
              value={addCategory}
              onChange={(e) => setAddCategory(e.target.value)}
              style={{
                flex: 1,
                background: 'var(--bg2)', border: '1px solid var(--edge)',
                borderRadius: 'var(--radius-sm)', padding: '8px 10px',
                color: 'var(--text)', fontSize: 13, outline: 'none',
              }}
            >
              {[...ALL_CATEGORIES, 'My Items'].map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleAddCustom}
              disabled={!addName.trim() || addCustom.isPending}
              style={{
                flex: 1, padding: '9px', borderRadius: 'var(--radius-sm)',
                background: 'var(--accent)', border: 'none',
                color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: addName.trim() ? 'pointer' : 'not-allowed',
                opacity: addName.trim() ? 1 : 0.5,
              }}
            >
              {addCustom.isPending ? 'Adding…' : 'Add'}
            </button>
            <button
              onClick={() => { setShowAddForm(false); setAddName(''); setAddQty('') }}
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

      {allCategories.map((category) => {
        const defaultItems = (SHOPPING as Record<string, { name: string; qty: string }[]>)[category] ?? []
        const custom = customItems.filter((i) => i.category === category)
        if (defaultItems.length === 0 && custom.length === 0) return null

        return (
          <div key={category} style={{ marginBottom: 22 }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: 'var(--text3)',
              textTransform: 'uppercase', letterSpacing: '0.10em',
              marginBottom: 6, paddingBottom: 6,
              borderBottom: '1px solid var(--edge)',
            }}>
              {category}
            </div>

            {defaultItems.map((item, i) => {
              const key = `${category}-${i}`
              const checked = isChecked(key)
              return (
                <div
                  key={key}
                  onClick={() => handleToggle(key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 0',
                    borderBottom: i < defaultItems.length - 1 || custom.length > 0 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{
                    width: 20, height: 20,
                    border: checked ? '1.5px solid var(--accent)' : '1.5px solid var(--edge)',
                    borderRadius: 5, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: checked ? 'var(--accent)' : 'transparent',
                    transition: 'all 0.15s',
                  }}>
                    {checked && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>}
                  </div>
                  <div style={{
                    fontSize: 13, flex: 1,
                    color: checked ? 'var(--text3)' : 'var(--text)',
                    textDecoration: checked ? 'line-through' : 'none',
                  }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', flexShrink: 0 }}>
                    {item.qty}
                  </div>
                </div>
              )
            })}

            {custom.map((item, ci) => (
              <div
                key={item.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0',
                  borderBottom: ci < custom.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div
                  onClick={() => toggleCustom.mutate({ id: item.id, checked: !item.checked })}
                  style={{
                    width: 20, height: 20,
                    border: item.checked ? '1.5px solid var(--accent)' : '1.5px solid var(--edge)',
                    borderRadius: 5, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: item.checked ? 'var(--accent)' : 'transparent',
                    transition: 'all 0.15s', cursor: 'pointer',
                  }}
                >
                  {item.checked && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>}
                </div>
                <div
                  onClick={() => toggleCustom.mutate({ id: item.id, checked: !item.checked })}
                  style={{
                    fontSize: 13, flex: 1,
                    color: item.checked ? 'var(--text3)' : 'var(--text)',
                    textDecoration: item.checked ? 'line-through' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  {item.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', flexShrink: 0 }}>
                  {item.qty}
                </div>
                <button
                  onClick={() => deleteCustom.mutate(item.id)}
                  style={{
                    padding: 4, background: 'none', border: 'none',
                    cursor: 'pointer', color: 'var(--text3)', lineHeight: 0, flexShrink: 0,
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
