import { Activity, Calendar, RefreshCw, LogOut } from 'lucide-react'
import { useGoogleLogin } from '@react-oauth/google'
import { useAuthStore } from '@/store/useAuthStore'
import { startGarminOAuth } from '@/lib/garmin'

interface Props {
  garminConnected: boolean
  garminSyncing: boolean
  onSyncGarmin: () => void
  googleConnected: boolean
  onGoogleToken: (token: string) => void
  onGoogleDisconnect: () => void
}

export function CalendarConnectBar({
  garminConnected, garminSyncing, onSyncGarmin,
  googleConnected, onGoogleToken, onGoogleDisconnect,
}: Props) {
  const { user, signOut } = useAuthStore()

  const googleLogin = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/calendar.events.readonly',
    onSuccess: (res) => onGoogleToken(res.access_token),
  })

  return (
    <div style={{
      display: 'flex', gap: 8, padding: '10px 16px',
      overflowX: 'auto', scrollbarWidth: 'none',
      borderBottom: '1px solid var(--border)',
      alignItems: 'center',
    }}>
      {/* Garmin */}
      {!garminConnected ? (
        <PillButton
          icon={<Activity size={13} />}
          label="Connect Garmin"
          onClick={() => startGarminOAuth().catch(console.error)}
          color="accent"
        />
      ) : (
        <>
          <PillTag icon={<Activity size={13} />} label="Garmin ✓" color="green" />
          <PillButton
            icon={<RefreshCw size={13} style={{ animation: garminSyncing ? 'spin 1s linear infinite' : 'none' }} />}
            label={garminSyncing ? 'Syncing…' : 'Sync'}
            onClick={onSyncGarmin}
            disabled={garminSyncing}
            color="accent"
          />
        </>
      )}

      <div style={{ width: 1, height: 18, background: 'var(--edge)', flexShrink: 0 }} />

      {/* Google Calendar */}
      {!googleConnected ? (
        <PillButton
          icon={<Calendar size={13} />}
          label="Connect Google Cal"
          onClick={() => googleLogin()}
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
