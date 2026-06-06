/**
 * src/components/whoop/WhoopChart.tsx
 * Pure SVG 7-day recovery bar chart. No external chart libraries.
 * Bars coloured by recovery level. Day labels below. Score inside each bar.
 */
interface DayPoint {
  date: string
  recoveryScore: number | null
}

interface Props {
  history: DayPoint[]
}

function recoveryColor(score: number | null): string {
  if (score == null) return '#252535'
  if (score >= 67) return '#22c55e'
  if (score >= 34) return '#eab308'
  return '#ef4444'
}

function dayLabel(dateStr: string): string {
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' }).slice(0, 3)
  } catch { return '—' }
}

export function WhoopChart({ history }: Props) {
  const days = history.slice(-7)
  if (!days.length) return null

  const W = 260
  const H = 80
  const barW = 24
  const gap = (W - days.length * barW) / (days.length + 1)
  const maxBarH = 50
  const labelY = H - 2
  const topPad = 6

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: 'block', width: '100%', height: H, minWidth: 220 }}
      preserveAspectRatio="xMidYMid meet"
    >
      {days.map((d, i) => {
        const score = d.recoveryScore
        const color = recoveryColor(score)
        const bh = score != null ? Math.max(6, Math.round((score / 100) * maxBarH)) : 4
        const x = gap + i * (barW + gap)
        const y = topPad + maxBarH - bh
        const label = dayLabel(d.date)
        return (
          <g key={d.date}>
            <rect x={x} y={y} width={barW} height={bh} rx={4} fill={color} />
            {score != null && (
              <text
                x={x + barW / 2} y={y - 2}
                textAnchor="middle" fill={color}
                fontSize={9} fontWeight={600}
              >
                {score}
              </text>
            )}
            <text
              x={x + barW / 2} y={labelY}
              textAnchor="middle" fill="#555" fontSize={9}
            >
              {label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
