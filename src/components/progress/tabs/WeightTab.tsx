import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, CartesianGrid,
} from 'recharts'
import { useWeightLogs, useLogWeight, useDeleteWeightLog } from '@/hooks/useProgressData'
import type { WeightLog } from '@/types/supabase'

const GOAL_KG = 80

function rollingAvg(logs: WeightLog[], window = 7): { date: string; weight: number; avg: number | null }[] {
  return logs.map((log, i) => {
    const slice = logs.slice(Math.max(0, i - window + 1), i + 1)
    const avg = slice.reduce((s, l) => s + l.weight_kg, 0) / slice.length
    return { date: log.logged_date.slice(5), weight: log.weight_kg, avg: Math.round(avg * 10) / 10 }
  })
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { value: number; name: string }[] }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--card2)', border: '1px solid var(--edge)',
      borderRadius: 8, padding: '8px 12px', fontSize: 12,
    }}>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.name === 'avg' ? 'var(--accent)' : 'var(--text2)', marginBottom: 2 }}>
          {p.name === 'avg' ? '7d avg' : 'Weight'}: <strong style={{ color: 'var(--text)' }}>{p.value} kg</strong>
        </div>
      ))}
    </div>
  )
}

export function WeightTab() {
  const { data: logs = [] } = useWeightLogs()
  const logWeight = useLogWeight()
  const deleteWeight = useDeleteWeightLog()

  const [input, setInput] = useState('')
  const [showForm, setShowForm] = useState(false)

  const chartData = rollingAvg(logs)
  const latest = logs.at(-1)
  const oldest = logs[0]
  const totalChange = latest && oldest && logs.length > 1
    ? Math.round((latest.weight_kg - oldest.weight_kg) * 10) / 10
    : null

  const domain: [number, number] = logs.length
    ? [Math.floor(Math.min(...logs.map((l) => l.weight_kg)) - 0.5),
       Math.ceil(Math.max(...logs.map((l) => l.weight_kg)) + 0.5)]
    : [78, 88]

  async function handleLog() {
    const kg = parseFloat(input)
    if (isNaN(kg) || kg < 40 || kg > 200) return
    await logWeight.mutateAsync({ weight_kg: kg })
    setInput('')
    setShowForm(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 8 }}>
        <StatBox
          val={latest ? `${latest.weight_kg} kg` : '—'}
          lbl="Current"
          color="var(--accent)"
        />
        <StatBox
          val={totalChange !== null ? `${totalChange > 0 ? '+' : ''}${totalChange} kg` : '—'}
          lbl={`vs ${logs.length} days ago`}
          color={totalChange !== null && totalChange <= 0 ? 'var(--green)' : 'var(--red)'}
        />
        <StatBox val={`${GOAL_KG} kg`} lbl="Goal" color="var(--gold)" />
      </div>

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
              <YAxis domain={domain} tick={{ fill: '#44445a', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={GOAL_KG} stroke="#f0c060" strokeDasharray="4 4" strokeOpacity={0.5} />
              <Line type="monotone" dataKey="weight" stroke="rgba(91,141,238,0.35)" strokeWidth={1.5} dot={false} name="weight" />
              <Line type="monotone" dataKey="avg" stroke="#5b8dee" strokeWidth={2} dot={false} name="avg" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 10, color: 'var(--text3)', textAlign: 'center', marginTop: 2 }}>
            — 7-day average &nbsp;· &nbsp;- - goal {GOAL_KG} kg
          </div>
        </div>
      ) : (
        <EmptyChart label="Log your first weigh-in to see the chart" />
      )}

      {/* Log form */}
      {showForm ? (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--edge)',
          borderRadius: 'var(--radius)', padding: '14px 16px',
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <input
            autoFocus
            type="number"
            step="0.1"
            placeholder="e.g. 84.5"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLog()}
            style={{
              flex: 1, padding: '9px 12px',
              background: 'var(--bg2)', border: '1px solid var(--edge)',
              borderRadius: 'var(--radius-sm)', color: 'var(--text)',
              fontSize: 14, outline: 'none',
            }}
          />
          <span style={{ color: 'var(--text3)', fontSize: 13 }}>kg</span>
          <button
            onClick={handleLog}
            disabled={logWeight.isPending}
            style={{
              padding: '9px 16px', background: 'var(--accent)',
              border: 'none', borderRadius: 'var(--radius-sm)',
              color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            Save
          </button>
          <button
            onClick={() => setShowForm(false)}
            style={{
              padding: '9px 10px', background: 'none',
              border: '1px solid var(--edge)', borderRadius: 'var(--radius-sm)',
              color: 'var(--text3)', fontSize: 13, cursor: 'pointer', flexShrink: 0,
            }}
          >
            ✕
          </button>
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
          + Log today's weight
        </button>
      )}

      {/* Recent logs */}
      {logs.length > 0 && (
        <div>
          <SectionLabel>Recent weigh-ins</SectionLabel>
          {logs.slice(-10).reverse().map((log) => (
            <div
              key={log.id}
              style={{
                display: 'flex', alignItems: 'center',
                padding: '9px 0', borderBottom: '1px solid var(--border)',
              }}
            >
              <span style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>
                {formatDate(log.logged_date)}
              </span>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginRight: 12 }}>
                {log.weight_kg} kg
              </span>
              <button
                onClick={() => deleteWeight.mutate(log.id)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text3)',
                  cursor: 'pointer', fontSize: 13, padding: '0 4px',
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatBox({ val, lbl, color }: { val: string; lbl: string; color: string }) {
  return (
    <div style={{
      flex: 1, background: 'var(--card)', border: '1px solid var(--edge)',
      borderRadius: 'var(--radius-sm)', padding: '10px 8px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 16, fontWeight: 700, color }}>{val}</div>
      <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {lbl}
      </div>
    </div>
  )
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--edge)',
      borderRadius: 'var(--radius)', padding: '32px 16px',
      textAlign: 'center', color: 'var(--text3)', fontSize: 13,
    }}>
      {label}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 600, letterSpacing: '0.10em',
      color: 'var(--text3)', textTransform: 'uppercase',
      margin: '4px 0 8px',
    }}>
      {children}
    </div>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}
