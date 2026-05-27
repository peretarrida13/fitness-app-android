import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatWeekRange } from '@/lib/dateUtils'

interface Props {
  weekStart: Date
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  weekOffset: number
}

export function CalendarHeader({ weekStart, onPrev, onNext, onToday, weekOffset }: Props) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 10,
      background: 'rgba(10,10,15,0.92)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      padding: '14px 16px 12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            fontSize: 22, fontWeight: 700, color: 'var(--text)',
          }}>
            Calendar
          </h1>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
            {formatWeekRange(weekStart)}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {weekOffset !== 0 && (
            <button
              onClick={onToday}
              style={{
                padding: '5px 10px', fontSize: 11, fontWeight: 600,
                color: 'var(--accent)', background: 'var(--accentbg)',
                border: '1px solid var(--accentbd)', borderRadius: 20,
                cursor: 'pointer', marginRight: 4,
              }}
            >
              Today
            </button>
          )}
          <button
            onClick={onPrev}
            style={{
              width: 32, height: 32, display: 'flex', alignItems: 'center',
              justifyContent: 'center', background: 'var(--card)',
              border: '1px solid var(--edge)', borderRadius: 8, cursor: 'pointer',
              color: 'var(--text2)',
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={onNext}
            style={{
              width: 32, height: 32, display: 'flex', alignItems: 'center',
              justifyContent: 'center', background: 'var(--card)',
              border: '1px solid var(--edge)', borderRadius: 8, cursor: 'pointer',
              color: 'var(--text2)',
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
