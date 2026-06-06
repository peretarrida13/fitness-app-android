import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useMeasurements, useLogMeasurement } from '@/hooks/useProgressData'
import type { Measurement } from '@/types/supabase'

const FIELDS: { key: keyof Omit<Measurement, 'id' | 'user_id' | 'logged_date' | 'note' | 'created_at'>; label: string; color: string }[] = [
  { key: 'waist_cm',    label: 'Waist',    color: '#ee6b6b' },
  { key: 'chest_cm',   label: 'Chest',    color: '#5b8dee' },
  { key: 'left_arm_cm',label: 'Arm',      color: '#f0c060' },
  { key: 'hips_cm',    label: 'Hips',     color: '#56c99a' },
]

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--card2)', border: '1px solid var(--edge)',
      borderRadius: 8, padding: '8px 12px', fontSize: 12,
    }}>
      <div style={{ color: 'var(--text3)', marginBottom: 4 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color }}>
          {FIELDS.find((f) => f.key === p.name)?.label}: <strong style={{ color: 'var(--text)' }}>{p.value} cm</strong>
        </div>
      ))}
    </div>
  )
}

export function BodyTab() {
  const { data: measurements = [] } = useMeasurements()
  const logMeasurement = useLogMeasurement()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ waist_cm: '', chest_cm: '', left_arm_cm: '', hips_cm: '' })

  const chartData = measurements.map((m) => ({
    date: m.logged_date.slice(5),
    waist_cm: m.waist_cm ?? undefined,
    chest_cm: m.chest_cm ?? undefined,
    left_arm_cm: m.left_arm_cm ?? undefined,
    hips_cm: m.hips_cm ?? undefined,
  }))

  const latest = measurements.at(-1)
  const oldest = measurements[0]

  async function handleSave() {
    const parsed: Record<string, number | undefined> = {}
    for (const f of FIELDS) {
      const v = parseFloat(form[f.key as keyof typeof form])
      if (!isNaN(v) && v > 0 && v <= 300) parsed[f.key] = v
    }
    if (Object.keys(parsed).length === 0) return
    await logMeasurement.mutateAsync(parsed)
    setForm({ waist_cm: '', chest_cm: '', left_arm_cm: '', hips_cm: '' })
    setShowForm(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Latest snapshot */}
      {latest && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FIELDS.map(({ key, label, color }) => {
            const curr = latest[key] as number | null
            const prev = oldest?.[key] as number | null
            const diff = curr !== null && prev !== null && curr !== prev
              ? Math.round((curr - prev) * 10) / 10
              : null
            return curr !== null ? (
              <div
                key={key}
                style={{
                  flex: '1 1 40%', background: 'var(--card)', border: '1px solid var(--edge)',
                  borderRadius: 'var(--radius-sm)', padding: '10px 10px', textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 700, color }}>{curr} cm</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {label}
                </div>
                {diff !== null && (
                  <div style={{ fontSize: 10, color: diff < 0 ? 'var(--green)' : 'var(--red)', marginTop: 2 }}>
                    {diff > 0 ? '+' : ''}{diff} cm
                  </div>
                )}
              </div>
            ) : null
          })}
        </div>
      )}

      {/* Chart */}
      {chartData.length > 1 ? (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--edge)',
          borderRadius: 'var(--radius)', padding: '14px 4px 8px',
        }}>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData} margin={{ left: -10, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#44445a', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#44445a', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {FIELDS.map(({ key, color }) => (
                <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 6, flexWrap: 'wrap' }}>
            {FIELDS.map(({ label, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text3)' }}>
                <div style={{ width: 10, height: 2, background: color, borderRadius: 1 }} />
                {label}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--edge)',
          borderRadius: 'var(--radius)', padding: '32px 16px',
          textAlign: 'center', color: 'var(--text3)', fontSize: 13,
        }}>
          Log measurements to see your trend chart
        </div>
      )}

      {/* Log form */}
      {showForm ? (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--edge)',
          borderRadius: 'var(--radius)', padding: '14px 16px',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>Log measurements (cm)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {FIELDS.map(({ key, label, color }) => (
              <div key={key} style={{ flex: '1 1 40%', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color }}>{label}</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="cm"
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  style={{
                    padding: '8px 10px',
                    background: 'var(--bg2)', border: '1px solid var(--edge)',
                    borderRadius: 'var(--radius-sm)', color: 'var(--text)',
                    fontSize: 14, outline: 'none', width: '100%',
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSave}
              disabled={logMeasurement.isPending}
              style={{
                flex: 1, padding: '10px',
                background: 'var(--accent)', border: 'none',
                borderRadius: 'var(--radius-sm)', color: '#fff',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Save
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                padding: '10px 14px', background: 'none',
                border: '1px solid var(--edge)', borderRadius: 'var(--radius-sm)',
                color: 'var(--text3)', fontSize: 13, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          style={{
            width: '100%', padding: '11px',
            background: 'var(--accentbg)', border: '1px solid var(--accentbd)',
            borderRadius: 'var(--radius-sm)', color: 'var(--accent)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          + Log measurements
        </button>
      )}

      {/* Recent logs */}
      {measurements.length > 0 && (
        <div>
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '0.10em',
            color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 8,
          }}>
            History
          </div>
          {measurements.slice(-8).reverse().map((m) => (
            <div
              key={m.id}
              style={{
                padding: '8px 0', borderBottom: '1px solid var(--border)',
                fontSize: 12,
              }}
            >
              <div style={{ color: 'var(--text3)', marginBottom: 3 }}>{m.logged_date}</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {FIELDS.map(({ key, label, color }) => {
                  const v = m[key] as number | null
                  return v !== null ? (
                    <span key={key} style={{ color }}>
                      {label}: <strong style={{ color: 'var(--text)' }}>{v}</strong>
                    </span>
                  ) : null
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
