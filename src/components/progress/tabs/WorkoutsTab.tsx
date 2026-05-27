import { useWorkoutHistory } from '@/hooks/useProgressData'
import { GYM_DAYS } from '@/data/defaultGym'
import { getMondayOfWeek, toDateStr } from '@/lib/dateUtils'

const DAY_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const GYM_TYPE_COLOR: Record<string, string> = {
  strength: 'var(--accent)',
  cardio: 'var(--green)',
  rest: 'var(--text3)',
}

function computeStreak(loggedDates: Set<string>): number {
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 60; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dayIdx = (d.getDay() + 6) % 7
    const gymDay = GYM_DAYS[dayIdx]
    if (gymDay.isRest) continue // skip rest days
    if (loggedDates.has(toDateStr(d))) {
      streak++
    } else if (i === 0) {
      // today not yet logged — don't break streak
    } else {
      break
    }
  }
  return streak
}

export function WorkoutsTab() {
  const { data: history = [] } = useWorkoutHistory(84)

  const loggedSet = new Set(history.map((h) => h.logged_date))

  const streak = computeStreak(loggedSet)
  const thisWeekStart = getMondayOfWeek(new Date())
  const thisWeekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(thisWeekStart)
    d.setDate(d.getDate() + i)
    return toDateStr(d)
  })
  const thisWeekCount = thisWeekDates.filter((d) => loggedSet.has(d)).length
  const thisMonthCount = history.filter((h) => {
    const now = new Date()
    return h.logged_date.startsWith(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
  }).length

  // Build 12-week grid (84 days), oldest first
  const weeks: string[][] = []
  const gridEnd = new Date()
  const gridStart = getMondayOfWeek(new Date())
  gridStart.setDate(gridStart.getDate() - 77) // 11 more weeks back

  for (let w = 0; w < 12; w++) {
    const week: string[] = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(gridStart)
      date.setDate(date.getDate() + w * 7 + d)
      if (date <= gridEnd) week.push(toDateStr(date))
      else week.push('')
    }
    weeks.push(week)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 8 }}>
        <StatBox val={`${streak}`} lbl="Streak" emoji="🔥" />
        <StatBox val={`${thisWeekCount}/6`} lbl="This week" emoji="📅" />
        <StatBox val={`${thisMonthCount}`} lbl="This month" emoji="📈" />
      </div>

      {/* 12-week heatmap */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--edge)',
        borderRadius: 'var(--radius)', padding: '14px 12px',
      }}>
        <div style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
          color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 10,
        }}>
          12-week history
        </div>

        {/* Day labels */}
        <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
          <div style={{ width: 24 }} />
          {DAY_SHORT.map((d, i) => (
            <div key={i} style={{
              flex: 1, textAlign: 'center',
              fontSize: 9, color: 'var(--text3)',
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* Week rows */}
        {weeks.map((week, wi) => {
          const weekLabel = week[0] ? week[0].slice(5).replace('-', '/') : ''
          return (
            <div key={wi} style={{ display: 'flex', gap: 3, marginBottom: 3, alignItems: 'center' }}>
              <div style={{ width: 24, fontSize: 8, color: 'var(--text3)', flexShrink: 0 }}>
                {wi % 2 === 0 ? weekLabel : ''}
              </div>
              {week.map((dateStr, di) => {
                if (!dateStr) return <div key={di} style={{ flex: 1 }} />
                const logged = loggedSet.has(dateStr)
                const dayIdx = di // 0=Mon
                const isRest = GYM_DAYS[dayIdx]?.isRest
                const isToday = dateStr === toDateStr(new Date())
                return (
                  <div
                    key={di}
                    title={dateStr}
                    style={{
                      flex: 1,
                      aspectRatio: '1',
                      borderRadius: 3,
                      background: logged
                        ? GYM_TYPE_COLOR[GYM_DAYS[dayIdx]?.type ?? 'strength']
                        : isRest
                        ? 'var(--bg3)'
                        : 'var(--bg2)',
                      opacity: isRest ? 0.4 : 1,
                      outline: isToday ? '1.5px solid var(--accent)' : 'none',
                      outlineOffset: '1px',
                    }}
                  />
                )
              })}
            </div>
          )
        })}

        <div style={{ display: 'flex', gap: 12, marginTop: 10, justifyContent: 'flex-end' }}>
          <Legend color="var(--accent)" label="Strength" />
          <Legend color="var(--green)" label="Cardio" />
          <Legend color="var(--bg2)" label="Missed" />
        </div>
      </div>

      {/* Recent list */}
      {history.length > 0 && (
        <div>
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '0.10em',
            color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 8,
          }}>
            Recent sessions
          </div>
          {history.slice(0, 8).map((h) => {
            const gym = GYM_DAYS[h.gym_day_index]
            const shortName = gym.name.split('—')[1]?.trim() ?? gym.name
            return (
              <div
                key={h.logged_date}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 0', borderBottom: '1px solid var(--border)',
                }}
              >
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: GYM_TYPE_COLOR[gym.type], flexShrink: 0,
                }} />
                <span style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>
                  {shortName}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                  {formatDate(h.logged_date)}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {history.length === 0 && (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--edge)',
          borderRadius: 'var(--radius)', padding: '28px 16px',
          textAlign: 'center', color: 'var(--text3)', fontSize: 13,
        }}>
          No workouts logged yet — tap "Log today's workout" on the Gym page or Calendar.
        </div>
      )}
    </div>
  )
}

function StatBox({ val, lbl, emoji }: { val: string; lbl: string; emoji: string }) {
  return (
    <div style={{
      flex: 1, background: 'var(--card)', border: '1px solid var(--edge)',
      borderRadius: 'var(--radius-sm)', padding: '10px 8px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 18 }}>{emoji}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>{val}</div>
      <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {lbl}
      </div>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text3)' }}>
      <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
      {label}
    </div>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
