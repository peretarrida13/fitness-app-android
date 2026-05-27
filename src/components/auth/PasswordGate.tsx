import { useState, type ReactNode } from 'react'

const SESSION_KEY = 'app_unlocked'
const CORRECT = import.meta.env.VITE_APP_PASSWORD

function isUnlocked() {
  return sessionStorage.getItem(SESSION_KEY) === '1'
}

export function PasswordGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(isUnlocked)
  const [input, setInput] = useState('')
  const [shake, setShake] = useState(false)
  const [showPw, setShowPw] = useState(false)

  if (unlocked) return <>{children}</>

  function attempt() {
    if (input === CORRECT) {
      sessionStorage.setItem(SESSION_KEY, '1')
      setUnlocked(true)
    } else {
      setShake(true)
      setInput('')
      setTimeout(() => setShake(false), 600)
    }
  }

  return (
    <>
      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-8px); }
          40%      { transform: translateX(8px); }
          60%      { transform: translateX(-6px); }
          80%      { transform: translateX(6px); }
        }
      `}</style>

      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', padding: '0 20px',
      }}>
        {/* Glow orb */}
        <div style={{
          position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(91,141,238,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          width: '100%', maxWidth: 340, position: 'relative', zIndex: 1,
        }}>
          {/* Avatar / greeting */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, boxShadow: '0 0 32px rgba(91,141,238,0.35)',
            }}>
              💪
            </div>
            <h1 style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontSize: 26, fontWeight: 700, color: 'var(--text)',
              letterSpacing: '-0.02em', marginBottom: 6,
            }}>
              Welcome Pere!
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text3)' }}>
              Enter your password to continue
            </p>
          </div>

          {/* Card */}
          <div style={{
            background: 'var(--card)', border: '1px solid var(--edge)',
            borderRadius: 'var(--radius)', padding: '24px 20px',
            animation: shake ? 'shake 0.5s ease' : 'none',
          }}>
            <div style={{ position: 'relative' }}>
              <input
                autoFocus
                type={showPw ? 'text' : 'password'}
                placeholder="Password"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && attempt()}
                style={{
                  width: '100%', padding: '12px 44px 12px 14px',
                  background: 'var(--bg2)', border: `1px solid ${shake ? 'var(--red)' : 'var(--edge)'}`,
                  borderRadius: 'var(--radius-sm)', color: 'var(--text)',
                  fontSize: 15, outline: 'none', transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
              />
              <button
                onClick={() => setShowPw((v) => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text3)', fontSize: 14, padding: 0, lineHeight: 1,
                }}
              >
                {showPw ? '🙈' : '👁'}
              </button>
            </div>

            <button
              onClick={attempt}
              style={{
                width: '100%', marginTop: 12, padding: '12px',
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                border: 'none', borderRadius: 'var(--radius-sm)',
                color: '#fff', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', letterSpacing: '0.02em',
                boxShadow: '0 4px 16px rgba(91,141,238,0.35)',
                transition: 'opacity 0.15s',
              }}
            >
              Unlock
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
