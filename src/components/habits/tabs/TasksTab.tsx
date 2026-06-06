import { useState, useRef } from 'react'
import { Check, X } from 'lucide-react'
import { useTodos, useAddTodo, useToggleTodo, useDeleteTodo } from '@/hooks/useTodoData'
import { useAuthStore } from '@/store/useAuthStore'

export function TasksTab() {
  const { user } = useAuthStore()
  const { data: todos = [] } = useTodos()
  const addTodo = useAddTodo()
  const toggleTodo = useToggleTodo()
  const deleteTodo = useDeleteTodo()

  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleAdd() {
    const title = draft.trim()
    if (!title) return
    setDraft('')
    await addTodo.mutateAsync(title)
    inputRef.current?.focus()
  }

  if (!user) {
    return (
      <div style={{
        marginTop: 24,
        background: 'var(--card)', border: '1px solid var(--edge)',
        borderRadius: 'var(--radius)', padding: '40px 20px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
        <div style={{ fontSize: 15, color: 'var(--text2)', fontWeight: 500 }}>
          Sign in to use tasks
        </div>
      </div>
    )
  }

  const pending = todos.filter((t) => !t.completed)
  const done = todos.filter((t) => t.completed)

  return (
    <div style={{ marginTop: 16 }}>
      {/* Add task input */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add a task…"
          maxLength={200}
          style={{
            flex: 1, boxSizing: 'border-box',
            background: 'var(--card)', border: '1px solid var(--edge)',
            borderRadius: 'var(--radius-sm)', padding: '10px 12px',
            color: 'var(--text)', fontSize: 14, outline: 'none',
          }}
        />
        <button
          onClick={handleAdd}
          disabled={!draft.trim() || addTodo.isPending}
          style={{
            padding: '10px 16px', borderRadius: 'var(--radius-sm)',
            background: draft.trim() ? 'var(--accent)' : 'var(--bg3)',
            border: 'none', color: draft.trim() ? '#fff' : 'var(--text3)',
            fontSize: 13, fontWeight: 600, cursor: draft.trim() ? 'pointer' : 'default',
            transition: 'background 0.15s, color 0.15s', flexShrink: 0,
          }}
        >
          Add
        </button>
      </div>

      {/* Empty state */}
      {todos.length === 0 && (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--edge)',
          borderRadius: 'var(--radius)', padding: '40px 20px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 15, color: 'var(--text2)', fontWeight: 500 }}>
            Nothing here yet
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>
            Type a task above and press Enter
          </div>
        </div>
      )}

      {/* Pending tasks */}
      {pending.length > 0 && (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--edge)',
          borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 16,
        }}>
          {pending.map((todo, idx) => (
            <div
              key={todo.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px',
                borderBottom: idx < pending.length - 1 ? '1px solid var(--edge)' : 'none',
              }}
            >
              <button
                onClick={() => toggleTodo.mutate({ id: todo.id, completed: true })}
                style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  border: '1.5px solid var(--accent)',
                  background: 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'background 0.15s',
                }}
              />
              <span style={{ flex: 1, fontSize: 14, color: 'var(--text)' }}>
                {todo.title}
              </span>
              <button
                onClick={() => deleteTodo.mutate(todo.id)}
                style={{
                  padding: 4, background: 'none', border: 'none',
                  cursor: 'pointer', color: 'var(--text3)', lineHeight: 0, flexShrink: 0,
                }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Completed tasks */}
      {done.length > 0 && (
        <>
          <div style={{
            fontSize: 10, fontWeight: 600, color: 'var(--text3)',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            marginBottom: 8,
          }}>
            Completed
          </div>
          <div style={{
            background: 'var(--card)', border: '1px solid var(--edge)',
            borderRadius: 'var(--radius)', overflow: 'hidden',
          }}>
            {done.map((todo, idx) => (
              <div
                key={todo.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px',
                  borderBottom: idx < done.length - 1 ? '1px solid var(--edge)' : 'none',
                  opacity: 0.6,
                }}
              >
                <button
                  onClick={() => toggleTodo.mutate({ id: todo.id, completed: false })}
                  style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    border: '1.5px solid var(--green)',
                    background: 'var(--green)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Check size={11} color="#fff" strokeWidth={3} />
                </button>
                <span style={{ flex: 1, fontSize: 14, color: 'var(--text3)', textDecoration: 'line-through' }}>
                  {todo.title}
                </span>
                <button
                  onClick={() => deleteTodo.mutate(todo.id)}
                  style={{
                    padding: 4, background: 'none', border: 'none',
                    cursor: 'pointer', color: 'var(--text3)', lineHeight: 0, flexShrink: 0,
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
