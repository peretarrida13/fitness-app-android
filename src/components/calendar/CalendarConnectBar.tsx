import { Calendar, LogOut } from 'lucide-react'
import { useGoogleLogin } from '@react-oauth/google'
import { Capacitor } from '@capacitor/core'
import { useAuthStore } from '@/store/useAuthStore'
import { useGoogleAuthAndroid } from '@/hooks/useGoogleAuth'

interface Props {
  googleConnected: boolean
  onGoogleToken: (token: string) => void
  onGoogleDisconnect: () => void
}

export function CalendarConnectBar({
  googleConnected, onGoogleToken, onGoogleDisconnect,
}: Props) {
  const { user, signOut } = useAuthStore()

  const googleLogin = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/calendar.events.readonly',
    onSuccess: (res) => onGoogleToken(res.access_token),
  })

  const googleLoginAndroid = useGoogleAuthAndroid(onGoogleToken)
  const handleGoogleLogin = Capacitor.isNativePlatform() ? googleLoginAndroid : () => googleLogin()

  return (
    <div style={{
      display: 'flex', gap: 8, padding: '10px 16px',
      overflowX: 'auto', scrollbarWidth: 'none',
      borderBottom: '1px solid var(--border)',
      alignItems: 'center',
    }}>
      {/* Google Calendar */}
      {!googleConnected ? (
        <PillButton
          icon={<Calendar size={13} />}
          label="Connect Google Cal"
          onClick={handleGoogleLogin}
          color="accent"
        />
      ) : (
        <>
          <PillTag icon={<Calendar size={13} />} label="Google ✓" color="green" />
          <PillButton
            icon={<LogOut size={13} />}
            label="Disconnect"
            onClick={onGoogleDisconnect}
            color="muted"
          />
        </>
      )}

      <div style={{ flex: 1 }} />

      {/* Sign out */}
      {user && (
        <button
          onClick={() => signOut()}
          style={{
            flexShrink: 0, fontSize: 11, color: 'var(--text3)',
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
          }}
        >
          Sign out
        </button>
      )}
    </div>
  )
}

function PillButton({
  icon, label, onClick, disabled, color,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  color: 'accent' | 'muted'
}) {
  const isAccent = color === 'accent'
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 11px', borderRadius: 20,
        fontSize: 12, fontWeight: 500,
        color: isAccent ? 'var(--accent)' : 'var(--text3)',
        background: isAccent ? 'var(--accentbg)' : 'var(--bg3)',
        border: `1px solid ${isAccent ? 'var(--accentbd)' : 'var(--edge)'}`,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      {icon} {label}
    </button>
  )
}

function PillTag({
  icon, label, color,
}: {
  icon: React.ReactNode
  label: string
  color: 'green' | 'accent'
}) {
  const isGreen = color === 'green'
  return (
    <div style={{
      flexShrink: 0,
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '5px 11px', borderRadius: 20,
      fontSize: 12, fontWeight: 500,
      color: isGreen ? 'var(--green)' : 'var(--accent)',
      background: isGreen ? 'var(--greenbg)' : 'var(--accentbg)',
      border: `1px solid ${isGreen ? 'rgba(86,201,154,0.3)' : 'var(--accentbd)'}`,
    }}>
      {icon} {label}
    </div>
  )
}
