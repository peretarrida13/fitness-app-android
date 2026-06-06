import type { DailyActivity } from '@/types/supabase'

interface Props {
  activity: DailyActivity | null
  onLogClick: () => void
}

function computeRecoveryScore(activity: DailyActivity | null): number | null {
  if (!activity) return null

  const { hrv_rmssd, resting_heart_rate, sleep_hours } = activity

  const components: { score: number; weight: number }[] = []

  if (hrv_rmssd !== null) {
    const score = Math.min(100, Math.max(0, ((hrv_rmssd - 20) / 60) * 100))
    components.push({ score, weight: 0.4 })
  }

  if (resting_heart_rate !== null) {
    const score = Math.min(100, Math.max(0, ((80 - resting_heart_rate) / 40) * 100))
    components.push({ score, weight: 0.3 })
  }

  if (sleep_hours !== null) {
    const score = Math.min(100, (sleep_hours / 8) * 100)
    components.push({ score, weight: 0.3 })
  }

  if (components.length === 0) return null

  const totalWeight = components.reduce((s, c) => s + c.weight, 0)
  const weighted = components.reduce((s, c) => s + c.score * (c.weight / totalWeight), 0)
  return Math.round(weighted)
}

function RecoveryRing({ score }: { score: number | null }) {
  const size = 96
  const strokeWidth = 9
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const pct = score !== null ? score / 100 : 0
  const offset = circumference * (1 - pct)

  const color = score === null
    ? 'var(--edge)'
    : score >= 67
      ? 'var(--green)'
      : score >= 34
        ? 'var(--gold)'
        : 'var(--red)'

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--bg3)" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s' }}
      />
      <g transform={`rotate(90, ${size / 2}, ${size / 2})`}>
        <text x={size / 2} y={size / 2 - 4} textAnchor="middle" dominantBaseline="middle"
          style={{ fill: color, fontSize: 20, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
          {score !== null ? score : '—'}
        </text>
        <text x={size / 2} y={size / 2 + 14} textAnchor="middle" dominantBaseline="middle"
          style={{ fill: 'var(--text3)', fontSize: 8, fontFamily: 'inherit' }}>
          {score !== null ? 'RECOVERY' : 'NO DATA'}
        </text>
      </g>
    </svg>
  )
}

function MetricChip({ label, value, unit, color }: {
  label: string
  value: string | number | null
  unit: string
  color: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color, fontFamily: "'Space Grotesk', sans-serif" }}>
          {value !== null ? value : '—'}
        </span>
        {value !== null && (
          <span style={{ fontSize: 10, color: 'var(--text3)' }}>{unit}</span>
        )}
      </div>
    </div>
  )
}

export function RecoveryCard({ activity, onLogClick }: Props) {
  const score = computeRecoveryScore(activity)

  const scoreColor = score === null
    ? 'var(--text3)'
    : score >= 67 ? 'var(--green)' : score >= 34 ? 'var(--gold)' : 'var(--red)'

  const scoreLabel = score === null
    ? 'Not logged'
    : score >= 67 ? 'Well recovered' : score >= 34 ? 'Moderate recovery' : 'Low recovery'

  const sleepDisplay = activity?.sleep_hours !== null && activity?.sleep_hours !== undefined
    ? Number(activity.sleep_hours).toFixed(1)
    : null

  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--edge)',
      borderRadius: 'var(--radius)', padding: '14px',
      marginBottom: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Recovery
        </div>
        <div style={{ fontSize: 11, color: scoreColor, fontWeight: 600 }}>{scoreLabel}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <RecoveryRing score={score} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <MetricChip
            label="HRV"
            value={activity?.hrv_rmssd !== null && activity?.hrv_rmssd !== undefined ? Math.round(activity.hrv_rmssd) : null}
            unit="ms" color="#9b8dee"
          />
          <MetricChip label="Resting HR" value={activity?.resting_heart_rate ?? null} unit="bpm" color="var(--red)" />
          <MetricChip label="Sleep" value={sleepDisplay} unit="h" color="var(--accent)" />
        </div>
        {activity?.stress_avg !== null && activity?.stress_avg !== undefined && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, alignSelf: 'flex-start' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stress</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)', fontFamily: "'Space Grotesk', sans-serif" }}>
                {activity.stress_avg}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text3)' }}>/100</span>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onLogClick}
        style={{
          width: '100%', marginTop: 12, padding: '8px 0',
          background: score !== null ? 'var(--bg2)' : 'var(--accentbg)',
          border: `1px solid ${score !== null ? 'var(--edge)' : 'var(--accentbd)'}`,
          borderRadius: 'var(--radius-sm)',
          fontSize: 12, fontWeight: 600,
          color: score !== null ? 'var(--text2)' : 'var(--accent)',
          cursor: 'pointer', transition: 'opacity 0.15s',
        }}
      >
        {score !== null ? "Update today's stats" : "Log today's stats"}
      </button>
    </div>
  )
}
