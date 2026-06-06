import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { toDateStr } from '@/lib/dateUtils'
import { useUpsertDailyActivity } from '@/hooks/useCalendarData'
import { useLogManualActivity } from '@/hooks/useProgressData'

type Tab = 'sleep' | 'recovery' | 'activity'

const ACTIVITY_TYPES = [
  { value: 'RUNNING', label: 'Running' },
  { value: 'CYCLING', label: 'Cycling' },
  { value: 'STRENGTH_TRAINING', label: 'Strength' },
  { value: 'HIIT', label: 'HIIT' },
  { value: 'SWIMMING', label: 'Swimming' },
  { value: 'WALKING', label: 'Walking' },
  { value: 'YOGA', label: 'Yoga' },
  { value: 'OTHER', label: 'Other' },
]

interface Props {
  open: boolean
  onClose: () => void
}

export function DailyInputModal({ open, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('sleep')
  const todayStr = toDateStr(new Date())

  const [sleepHours, setSleepHours] = useState('')
  const [sleepScore, setSleepScore] = useState('')
  const [deepMin, setDeepMin] = useState('')
  const [lightMin, setLightMin] = useState('')
  const [remMin, setRemMin] = useState('')
  const [awakeMin, setAwakeMin] = useState('')

  const [hrv, setHrv] = useState('')
  const [rhr, setRhr] = useState('')
  const [stress, setStress] = useState('')
  const [activeMin, setActiveMin] = useState('')
  const [steps, setSteps] = useState('')
  const [activeKcal, setActiveKcal] = useState('')
  const [distanceKm, setDistanceKm] = useState('')
  const [floors, setFloors] = useState('')

  const [actType, setActType] = useState('RUNNING')
  const [actName, setActName] = useState('')
  const [actHours, setActHours] = useState('')
  const [actMinutes, setActMinutes] = useState('')
  const [actDistKm, setActDistKm] = useState('')
  const [actHR, setActHR] = useState('')
  const [actKcal, setActKcal] = useState('')

  const upsertActivity = useUpsertDailyActivity()
  const logManualActivity = useLogManualActivity()

  const saveSleep = () => {
    const payload: Parameters<typeof upsertActivity.mutate>[0] = { activity_date: todayStr }
    if (sleepHours) payload.sleep_hours = parseFloat(sleepHours)
    if (sleepScore) payload.sleep_score = parseInt(sleepScore)
    if (deepMin) payload.sleep_deep_minutes = parseInt(deepMin)
    if (lightMin) payload.sleep_light_minutes = parseInt(lightMin)
    if (remMin) payload.sleep_rem_minutes = parseInt(remMin)
    if (awakeMin) payload.sleep_awake_minutes = parseInt(awakeMin)
    upsertActivity.mutate(payload, { onSuccess: onClose })
  }

  const saveRecovery = () => {
    const payload: Parameters<typeof upsertActivity.mutate>[0] = { activity_date: todayStr }
    if (hrv) payload.hrv_rmssd = parseFloat(hrv)
    if (rhr) payload.resting_heart_rate = parseInt(rhr)
    if (stress) payload.stress_avg = parseInt(stress)
    if (activeMin) payload.active_seconds = parseInt(activeMin) * 60
    if (steps) payload.steps = parseInt(steps)
    if (activeKcal) payload.active_calories = parseInt(activeKcal)
    if (distanceKm) payload.distance_meters = parseFloat(distanceKm) * 1000
    if (floors) payload.floors_climbed = parseInt(floors)
    upsertActivity.mutate(payload, { onSuccess: onClose })
  }

  const saveActivity = () => {
    const totalSecs = (parseInt(actHours) || 0) * 3600 + (parseInt(actMinutes) || 0) * 60
    logManualActivity.mutate({
      activity_date: todayStr,
      activity_type: actType,
      name: actName || undefined,
      duration_seconds: totalSecs || undefined,
      distance_meters: actDistKm ? parseFloat(actDistKm) * 1000 : undefined,
      avg_heart_rate: actHR ? parseInt(actHR) : undefined,
      calories: actKcal ? parseInt(actKcal) : undefined,
    }, { onSuccess: onClose })
  }

  const isSaving = upsertActivity.isPending || logManualActivity.isPending

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)', zIndex: 200,
        }} />
        <Dialog.Content style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'var(--card)', borderRadius: '18px 18px 0 0',
          padding: '0 0 env(safe-area-inset-bottom)',
          zIndex: 201, maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
            <div style={{ width: 36, height: 4, background: 'var(--edge)', borderRadius: 2, margin: '0 auto 14px' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Dialog.Title style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0,
              }}>
                Log Today
              </Dialog.Title>
              <Dialog.Close asChild>
                <button style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'var(--bg2)', border: '1px solid var(--edge)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--text3)',
                }}>
                  <X size={15} />
                </button>
              </Dialog.Close>
            </div>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
              {(['sleep', 'recovery', 'activity'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    flex: 1, padding: '8px 0', background: 'none', border: 'none',
                    borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`,
                    color: tab === t ? 'var(--accent)' : 'var(--text3)',
                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    transition: 'color 0.15s, border-color 0.15s', textTransform: 'capitalize',
                  }}
                >
                  {t === 'sleep' ? '😴 Sleep' : t === 'recovery' ? '⚡ Recovery' : '🏃 Activity'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowY: 'auto', flex: 1, padding: '16px 16px 24px' }}>
            {tab === 'sleep' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Row label="Sleep duration (hours)">
                  <input type="number" placeholder="7.5" min={0} max={24} step={0.5}
                    value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} style={inputSt} />
                </Row>
                <Row label="Sleep score (0–100)">
                  <input type="number" placeholder="Optional" min={0} max={100}
                    value={sleepScore} onChange={(e) => setSleepScore(e.target.value)} style={inputSt} />
                </Row>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>
                  Sleep stages (minutes)
                </div>
                <Row label="Deep sleep">
                  <input type="number" placeholder="0" min={0} value={deepMin} onChange={(e) => setDeepMin(e.target.value)} style={inputSt} />
                </Row>
                <Row label="Light sleep">
                  <input type="number" placeholder="0" min={0} value={lightMin} onChange={(e) => setLightMin(e.target.value)} style={inputSt} />
                </Row>
                <Row label="REM sleep">
                  <input type="number" placeholder="0" min={0} value={remMin} onChange={(e) => setRemMin(e.target.value)} style={inputSt} />
                </Row>
                <Row label="Awake">
                  <input type="number" placeholder="0" min={0} value={awakeMin} onChange={(e) => setAwakeMin(e.target.value)} style={inputSt} />
                </Row>
                <SaveButton onClick={saveSleep} loading={isSaving} />
              </div>
            )}

            {tab === 'recovery' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Row label="HRV RMSSD (ms)">
                  <input type="number" placeholder="e.g. 55" min={0} max={200} value={hrv} onChange={(e) => setHrv(e.target.value)} style={inputSt} />
                </Row>
                <Row label="Resting heart rate (bpm)">
                  <input type="number" placeholder="e.g. 58" min={30} max={120} value={rhr} onChange={(e) => setRhr(e.target.value)} style={inputSt} />
                </Row>
                <Row label="Stress level (0–100)">
                  <input type="number" placeholder="e.g. 25" min={0} max={100} value={stress} onChange={(e) => setStress(e.target.value)} style={inputSt} />
                </Row>
                <div style={{ height: 1, background: 'var(--edge)', margin: '4px 0' }} />
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Daily activity
                </div>
                <Row label="Steps">
                  <input type="number" placeholder="e.g. 8000" min={0} value={steps} onChange={(e) => setSteps(e.target.value)} style={inputSt} />
                </Row>
                <Row label="Active minutes">
                  <input type="number" placeholder="e.g. 45" min={0} value={activeMin} onChange={(e) => setActiveMin(e.target.value)} style={inputSt} />
                </Row>
                <Row label="Active calories (kcal)">
                  <input type="number" placeholder="e.g. 400" min={0} value={activeKcal} onChange={(e) => setActiveKcal(e.target.value)} style={inputSt} />
                </Row>
                <Row label="Distance (km)">
                  <input type="number" placeholder="e.g. 5.2" min={0} step={0.1} value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} style={inputSt} />
                </Row>
                <Row label="Floors climbed">
                  <input type="number" placeholder="e.g. 8" min={0} value={floors} onChange={(e) => setFloors(e.target.value)} style={inputSt} />
                </Row>
                <SaveButton onClick={saveRecovery} loading={isSaving} />
              </div>
            )}

            {tab === 'activity' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>Activity type</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {ACTIVITY_TYPES.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setActType(t.value)}
                        style={{
                          padding: '6px 12px', borderRadius: 20,
                          fontSize: 12, fontWeight: 500,
                          color: actType === t.value ? '#fff' : 'var(--text3)',
                          background: actType === t.value ? 'var(--accent)' : 'var(--bg2)',
                          border: `1px solid ${actType === t.value ? 'var(--accent)' : 'var(--edge)'}`,
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <Row label="Name (optional)">
                  <input type="text" placeholder="e.g. Morning run" value={actName} onChange={(e) => setActName(e.target.value)} style={inputSt} />
                </Row>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>Duration</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <input type="number" placeholder="0 h" min={0} max={23} value={actHours} onChange={(e) => setActHours(e.target.value)} style={{ ...inputSt, textAlign: 'center' }} />
                      <div style={{ fontSize: 10, color: 'var(--text3)', textAlign: 'center', marginTop: 3 }}>hours</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <input type="number" placeholder="0 min" min={0} max={59} value={actMinutes} onChange={(e) => setActMinutes(e.target.value)} style={{ ...inputSt, textAlign: 'center' }} />
                      <div style={{ fontSize: 10, color: 'var(--text3)', textAlign: 'center', marginTop: 3 }}>minutes</div>
                    </div>
                  </div>
                </div>
                <Row label="Distance (km)">
                  <input type="number" placeholder="Optional" min={0} step={0.01} value={actDistKm} onChange={(e) => setActDistKm(e.target.value)} style={inputSt} />
                </Row>
                <Row label="Avg heart rate (bpm)">
                  <input type="number" placeholder="Optional" min={30} max={220} value={actHR} onChange={(e) => setActHR(e.target.value)} style={inputSt} />
                </Row>
                <Row label="Calories burned (kcal)">
                  <input type="number" placeholder="Optional" min={0} value={actKcal} onChange={(e) => setActKcal(e.target.value)} style={inputSt} />
                </Row>
                <SaveButton onClick={saveActivity} loading={isSaving} label="Log Activity" />
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  )
}

function SaveButton({ onClick, loading, label = 'Save' }: {
  onClick: () => void
  loading: boolean
  label?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        width: '100%', marginTop: 8, padding: '11px 0',
        background: 'var(--accent)', border: 'none',
        borderRadius: 'var(--radius-sm)', color: '#fff',
        fontSize: 14, fontWeight: 600, cursor: 'pointer',
        opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s',
      }}
    >
      {loading ? 'Saving…' : label}
    </button>
  )
}

const inputSt: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: 'var(--bg2)', border: '1px solid var(--edge)',
  borderRadius: 'var(--radius-sm)', padding: '8px 10px',
  color: 'var(--text)', fontSize: 14, outline: 'none',
}
