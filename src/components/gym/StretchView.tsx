import { STRETCH_SECTIONS } from '@/data/defaultStretch'
import { StretchCard } from './StretchCard'

export function StretchView() {
  let stretchNumber = 0

  return (
    <div>
      {/* Injury banner */}
      <div
        style={{
          background: 'var(--redbg)', border: '1px solid var(--redbd)',
          borderRadius: 'var(--radius-sm)', padding: '10px 13px',
          fontSize: 12, color: 'var(--red)', marginBottom: 10,
          display: 'flex', gap: 8, lineHeight: 1.5,
        }}
      >
        ⚠️ <span><strong>Left shoulder:</strong> Certain stretches have specific left-shoulder notes inline — follow them carefully.</span>
      </div>

      {/* Info banner */}
      <div
        style={{
          background: 'var(--stretchbg)', border: '1px solid var(--stretchbd)',
          borderRadius: 'var(--radius-sm)', padding: '10px 13px',
          fontSize: 12, color: 'var(--stretch2)', marginBottom: 14,
          display: 'flex', gap: 8, lineHeight: 1.5,
        }}
      >
        🧘 <span>Hold each stretch fully, breathe deeply — mild discomfort only, no sharp pain.</span>
      </div>

      {/* Summary stats card */}
      <div
        style={{
          background: 'var(--card)', border: '1px solid var(--edge)',
          borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 16,
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, var(--stretch), var(--stretch2))',
          }}
        />
        <div
          style={{
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 12,
          }}
        >
          Morning Stretch Routine
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { val: '11', lbl: 'Stretches' },
            { val: '~10', lbl: 'Minutes' },
            { val: 'Daily', lbl: 'Frequency' },
          ].map((stat) => (
            <div
              key={stat.lbl}
              style={{
                flex: 1, background: 'var(--bg3)', borderRadius: 'var(--radius-sm)',
                padding: 8, textAlign: 'center', border: '1px solid var(--border)',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--stretch)' }}>
                {stat.val}
              </div>
              <div
                style={{
                  fontSize: 10, color: 'var(--text3)', marginTop: 2,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}
              >
                {stat.lbl}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sections */}
      {STRETCH_SECTIONS.map((section) => (
        <div key={section.label}>
          <div
            style={{
              fontSize: 10, fontWeight: 600, letterSpacing: '0.10em',
              color: 'var(--text3)', textTransform: 'uppercase',
              margin: '14px 0 8px',
            }}
          >
            {section.label}
          </div>
          {section.stretches.map((stretch) => {
            stretchNumber++
            return (
              <StretchCard
                key={stretch.id}
                stretch={stretch}
                number={stretchNumber}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
