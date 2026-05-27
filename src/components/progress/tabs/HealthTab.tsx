import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'
import { useHealthData, type HealthRow } from '@/hooks/useProgressData'
import { useCalendarStore } from '@/store/useCalendarStore'
import { startGarminOAuth } from '@/lib/garmin'

function MiniChart({
  data, dataKey, color, unit, refValue,
}: {
  data: Record<string, unknown>[]
  dataKey: string
  color: string
  unit: string
  refValue?: number
}) {
  const values = data.map((d) => d[dataKey] as number | null).filter((v): v is number => v !== null)
  if (values.length === 0) return null
  const min = Math.floor(Math.min(...values) - 2)
  const max = Math.ceil(Math.max(...values) + 2)

  return (
    <ResponsiveContainer width="100%" height={110}>
      <LineChart data={data} margin={{ left: -16, right: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: '#44445a', fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis domain={[min, max]} tick={{ fill: '#44445a', fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}`} />
        <Tooltip
          contentStyle={{
            background: 'var(--card2)', border: '1px solid var(--edge)',
            borderRadius: 8, fontSize: 12,
          }}
          formatter={(v) => [`${v} ${unit}`, '']}
        />
        {refValue && <ReferenceLine y={refValue} stroke={color} strokeDasharray="4 4" strokeOpacity={0.3} />}
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  )
}

function StatCard({
  label, value, unit, color, note,
}: {
  label: string; value: number | null; unit: string; color: string; note?: string
}) {
  return (
    <div style={{
      flex: '1 1 44%', background: 'var(--card)', border: '1px solid var(--edge)',
      borderRadius: 'var(--radius-sm)', padding: '10px 10px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 18, fontWeight: 700, color }}>
        {value !== null ? `${value}` : '—'}
      </div>
      <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label} {unit && <span style={{ color }}>{unit}</span>}
      </div>
      {note && <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 2 }}>{note}</div>}
    </div>
  )
}

export function HealthTab() {
  const { data: health = [] } = useHealthData(30)
  const { garminConnected } = useCalendarStore()

  const chartData = health.map((d: HealthRow) => ({
    date: d.activity_date.slice(5),
    rhr: d.resting_heart_rate,
    stress: d.stress_avg,
    active_min: d.active_seconds !== null ? Math.round((d.active_seconds ?? 0) / 60) : null,
    steps: d.steps,
    hrv: d.hrv_rmssd,
  }))

  const latest: HealthRow | undefined = health.at(-1)
  type ChartRow = { date: string; rhr: number | null; stress: number | null; active_min: number | null; steps: number; hrv: number | null }
  const avg7 = (key: Exclude<keyof ChartRow, 'date'>) => {
    const slice = chartData.slice(-7)
    const vals = slice.map((d) => d[key]).filter((v): v is number => v !== null)
    return vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : null
  }

  if (!garminConnected) {
    return (
      <div style={{
        background: 'var(--card)', border: '1px solid var(--edge)',
        borderRadius: 'var(--radius)', padding: '32px 20px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⌚</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
          Connect your Garmin
        </div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20, lineHeight: 1.6 }}>
          RHR, HRV, stress, and active minutes are pulled automatically once your Garmin is connected.
        </div>
        <button
          onClick={() => startGarminOAuth().catch(console.error)}
          style={{
            padding: '11px 20px', background: 'var(--accent)',
            border: 'none', borderRadius: 'var(--radius-sm)',
            color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Connect Garmin
        </button>
      </div>
    )
  }

  if (health.length === 0) {
    return (
      <div style={{
        background: 'var(--card)', border: '1px solid var(--edge)',
        borderRadius: 'var(--radius)', padding: '28px 16px',
        textAlign: 'center', color: 'var(--text3)', fontSize: 13,
      }}>
        No Garmin data yet — tap Sync on the Calendar page to pull your data.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <StatCard label="Resting HR" value={latest?.resting_heart_rate ?? null} unit="bpm" color="var(--red)" note="latest" />
        <StatCard label="Avg Stress" value={avg7('stress')} unit="" color="var(--gold)" note="7d avg · 0–100" />
        <StatCard label="Active" value={avg7('active_min')} unit="min" color="var(--green)" note="7d avg" />
        <StatCard label="Steps" value={avg7('steps')} unit="" color="var(--accent)" note="7d avg" />
      </div>

      {/* RHR chart */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--edge)',
        borderRadius: 'var(--radius)', padding: '12px 4px 6px',
      }}>
        <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, padding: '0 12px 6px' }}>
          Resting Heart Rate (bpm)
        </div>
        <MiniChart data={chartData} dataKey="rhr" color="var(--red)" unit="bpm" refValue={60} />
      </div>

      {/* Stress chart */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--edge)',
        borderRadius: 'var(--radius)', padding: '12px 4px 6px',
      }}>
        <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, padding: '0 12px 6px' }}>
          Average Stress Level
        </div>
        <MiniChart data={chartData} dataKey="stress" color="var(--gold)" unit="" refValue={25} />
      </div>

      {/* Active minutes chart */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--edge)',
        borderRadius: 'var(--radius)', padding: '12px 4px 6px',
      }}>
        <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, padding: '0 12px 6px' }}>
          Active Minutes
        </div>
        <MiniChart data={chartData} dataKey="active_min" color="var(--green)" unit="min" refValue={30} />
      </div>

      {/* Steps chart */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--edge)',
        borderRadius: 'var(--radius)', padding: '12px 4px 6px',
      }}>
        <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, padding: '0 12px 6px' }}>
          Daily Steps
        </div>
        <MiniChart data={chartData} dataKey="steps" color="var(--accent)" unit="steps" refValue={10000} />
      </div>

      {/* HRV if available */}
      {chartData.some((d) => d.hrv !== null) && (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--edge)',
          borderRadius: 'var(--radius)', padding: '12px 4px 6px',
        }}>
          <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, padding: '0 12px 6px' }}>
            HRV (RMSSD ms)
          </div>
          <MiniChart data={chartData} dataKey="hrv" color="#9b8dee" unit="ms" />
        </div>
      )}
    </div>
  )
}
