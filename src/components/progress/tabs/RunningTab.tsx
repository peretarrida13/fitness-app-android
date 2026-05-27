import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts'
import { useRunningData } from '@/hooks/useProgressData'
import { getMondayOfWeek, toDateStr } from '@/lib/dateUtils'
import type { Activity } from '@/types/supabase'

// ─── Formatters ──────────────────────────────────────────────────────────────

function formatPace(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60)
  const s = Math.round(secPerKm % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatKm(m: number): string { return (m / 1000).toFixed(1) }

function formatDuration(s: number): string {
  const m = Math.floor(s / 60)
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`
}

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ─── Weekly aggregation ───────────────────────────────────────────────────────

interface WeekBucket { label: string; km: number; runs: number }

function buildWeeklyKm(runs: Activity[]): WeekBucket[] {
  const buckets = new Map<string, WeekBucket>()

  for (const run of runs) {
    if (!run.distance_meters) continue
    const monday = getMondayOfWeek(new Date(run.activity_date + 'T12:00:00'))
    const key = toDateStr(monday)
    const label = monday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    const existing = buckets.get(key) ?? { label, km: 0, runs: 0 }
    existing.km = Math.round((existing.km + run.distance_meters / 1000) * 10) / 10
    existing.runs++
    buckets.set(key, existing)
  }

  // Last 8 weeks
  const result: WeekBucket[] = []
  for (let i = 7; i >= 0; i--) {
    const d = getMondayOfWeek(new Date())
    d.setDate(d.getDate() - i * 7)
    const key = toDateStr(d)
    const label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    result.push(buckets.get(key) ?? { label, km: 0, runs: 0 })
  }
  return result
}

// ─── Pace chart data ──────────────────────────────────────────────────────────

function buildPaceData(runs: Activity[]) {
  return runs
    .filter((r) => r.avg_pace_sec_per_km && r.distance_meters && r.distance_meters > 500)
    .slice(-20)
    .map((r) => ({
      date: r.activity_date.slice(5),
      pace: r.avg_pace_sec_per_km!,
      paceLabel: formatPace(r.avg_pace_sec_per_km!),
    }))
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function PaceTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--card2)', border: '1px solid var(--edge)',
      borderRadius: 8, padding: '8px 12px', fontSize: 12,
    }}>
      <div style={{ color: 'var(--text3)', marginBottom: 3 }}>{label}</div>
      <div style={{ color: 'var(--green)' }}>
        Pace: <strong style={{ color: 'var(--text)' }}>{formatPace(payload[0].value)} /km</strong>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RunningTab() {
  const { data: runs = [] } = useRunningData(90)

  const weeklyKm = buildWeeklyKm(runs)
  const paceData = buildPaceData(runs)
  const thisWeek = weeklyKm.at(-1)
  const lastWeek = weeklyKm.at(-2)

  const totalKm = runs.reduce((s, r) => s + (r.distance_meters ?? 0) / 1000, 0)
  const avgPace = paceData.length
    ? paceData.reduce((s, d) => s + d.pace, 0) / paceData.length
    : null
  const avgHR = runs.filter((r) => r.avg_heart_rate).length
    ? Math.round(runs.filter((r) => r.avg_heart_rate).reduce((s, r) => s + r.avg_heart_rate!, 0) / runs.filter((r) => r.avg_heart_rate).length)
    : null

  if (runs.length === 0) {
    return (
      <div style={{
        background: 'var(--card)', border: '1px solid var(--edge)',
        borderRadius: 'var(--radius)', padding: '32px 20px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🏃</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
          No runs synced yet
        </div>
        <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6 }}>
          Sync your Garmin on the Calendar page to pull your Garmin Coach runs.
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 8 }}>
        <StatBox val={`${(thisWeek?.km ?? 0).toFixed(1)}`} unit="km" lbl="This week" color="var(--green)" />
        <StatBox val={runs.length.toString()} unit="runs" lbl="Last 90 days" color="var(--accent)" />
        <StatBox val={avgPace ? formatPace(avgPace) : '—'} unit="/km" lbl="Avg pace" color="var(--gold)" />
        {avgHR && <StatBox val={avgHR.toString()} unit="bpm" lbl="Avg HR" color="var(--red)" />}
      </div>

      {/* Weekly km bar chart */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--edge)',
        borderRadius: 'var(--radius)', padding: '12px 4px 8px',
      }}>
        <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, padding: '0 12px 8px' }}>
          Weekly km
          {lastWeek && thisWeek && lastWeek.km > 0 && (
            <span style={{
              marginLeft: 8, fontSize: 10,
              color: thisWeek.km >= lastWeek.km ? 'var(--green)' : 'var(--red)',
            }}>
              {thisWeek.km >= lastWeek.km ? '▲' : '▼'} vs last week
            </span>
          )}
        </div>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={weeklyKm} margin={{ left: -16, right: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#44445a', fontSize: 9 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#44445a', fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}`} />
            <Tooltip
              contentStyle={{ background: 'var(--card2)', border: '1px solid var(--edge)', borderRadius: 8, fontSize: 12 }}
              formatter={(v: number) => [`${v} km`, 'Distance']}
            />
            <Bar dataKey="km" fill="rgba(86,201,154,0.75)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 10, color: 'var(--text3)', textAlign: 'center', marginTop: 2 }}>
          Total last 90 days: {totalKm.toFixed(0)} km
        </div>
      </div>

      {/* Pace trend */}
      {paceData.length > 1 && (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--edge)',
          borderRadius: 'var(--radius)', padding: '12px 4px 8px',
        }}>
          <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, padding: '0 12px 8px' }}>
            Pace trend (lower = faster)
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={paceData} margin={{ left: -16, right: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#44445a', fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis
                reversed
                tick={{ fill: '#44445a', fontSize: 9 }} tickLine={false} axisLine={false}
                tickFormatter={(v) => formatPace(v)}
              />
              <Tooltip content={<PaceTooltip />} />
              <Line type="monotone" dataKey="pace" stroke="var(--gold)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent runs */}
      <div>
        <div style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.10em',
          color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 8,
        }}>
          Recent runs
        </div>
        {runs.slice().reverse().slice(0, 10).map((run) => (
          <div
            key={run.garmin_activity_id}
            style={{
              padding: '10px 0', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}
          >
            <span style={{ fontSize: 18 }}>🏃</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
                {run.name ?? 'Run'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, display: 'flex', gap: 8 }}>
                {run.distance_meters && <span>{formatKm(run.distance_meters)} km</span>}
                {run.avg_pace_sec_per_km && <span>· {formatPace(run.avg_pace_sec_per_km)} /km</span>}
                {run.duration_seconds && <span>· {formatDuration(run.duration_seconds)}</span>}
                {run.avg_heart_rate && <span>· ❤️ {run.avg_heart_rate}</span>}
                {run.elevation_gain_m && run.elevation_gain_m > 5 && <span>· ↑ {Math.round(run.elevation_gain_m)}m</span>}
              </div>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0 }}>
              {formatDate(run.activity_date)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatBox({ val, unit, lbl, color }: { val: string; unit: string; lbl: string; color: string }) {
  return (
    <div style={{
      flex: 1, background: 'var(--card)', border: '1px solid var(--edge)',
      borderRadius: 'var(--radius-sm)', padding: '10px 6px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 15, fontWeight: 700, color, lineHeight: 1 }}>
        {val}<span style={{ fontSize: 10, marginLeft: 2 }}>{unit}</span>
      </div>
      <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {lbl}
      </div>
    </div>
  )
}
