import { useEffect, useState, type ReactNode } from 'react'
import { useAuthStore } from '@/store/useAuthStore'

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading, init, signInWithMagicLink } = useAuthStore()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const unsub = init()
    return unsub
  }, [init])

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg)',
      }}>
        <div style={{ color: 'var(--text3)', fontSize: 14 }}>Loading…</div>
      </div>
    )
  }

  if (user) return <>{children}</>

  async function handleSend() {
    setSending(true)
    setErr(null)
    const { error } = await signInWithMagicLink(email)
    setSending(false)
    if (error) { setErr(error); return }
    setSent(true)
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)', padding: '0 20px',
    }}>
      <div style={{
        width: '100%', maxWidth: 360,
        background: 'var(--card)', border: '1px solid var(--edge)',
        borderRadius: 'var(--radius)', padding: '32px 28px',
      }}>
        <div style={{
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
          fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 6,
        }}>
          Fitness Tracker
        </div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 28 }}>
          Sign in with a magic link to sync your data.
        </div>

        {sent ? (
          <div style={{
            background: 'var(--greenbg)', border: '1px solid var(--green)',
            borderRadius: 'var(--radius-sm)', padding: '14px 16px',
            color: 'var(--green)', fontSize: 14, textAlign: 'center',
          }}>
            Check your email for the magic link ✓
          </div>
        ) : (
          <>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              style={{
                width: '100%', padding: '10px 13px',
                background: 'var(--bg2)', border: '1px solid var(--edge)',
                borderRadius: 'var(--radius-sm)', color: 'var(--text)',
                fontSize: 14, outline: 'none', marginBottom: 12,
              }}
            />
            {err && (
              <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 10 }}>{err}</div>
            )}
            <button
              onClick={handleSend}
              disabled={sending || !email}
              style={{
                width: '100%', padding: '11px',
                background: 'var(--accent)', border: 'none',
                borderRadius: 'var(--radius-sm)', color: '#fff',
                fontSize: 14, fontWeight: 600, cursor: sending ? 'default' : 'pointer',
                opacity: sending ? 0.7 : 1, transition: 'opacity 0.15s',
              }}
            >
              {sending ? 'Sending…' : 'Send magic link'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
