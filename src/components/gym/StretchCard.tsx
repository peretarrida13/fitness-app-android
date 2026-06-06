import { useState, useEffect, useRef } from 'react'
import type { Stretch } from '@/types/stretch'

interface Props {
  stretch: Stretch
  number: number
}

type TimerState = 'idle' | 'running' | 'paused' | 'done'

const CIRCUMFERENCE = 213.6 // 2 * π * 34

function playDoneSound() {
  try {
    const ctx = new AudioContext()
    const beep = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.25, ctx.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + dur)
    }
    beep(880, 0, 0.15)
    beep(1320, 0.2, 0.3)
  } catch {
    // AudioContext unavailable
  }
}

export function StretchCard({ stretch, number }: Props) {
  const [open, setOpen] = useState(false)
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [secondsLeft, setSecondsLeft] = useState(stretch.durationSec)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  function startTimer() {
    if (timerState === 'done') {
      setSecondsLeft(stretch.durationSec)
      setTimerState('idle')
      return
    }
    setTimerState('running')
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          setTimerState('done')
          playDoneSound()
          navigator.vibrate?.([200, 100, 200])
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function pauseTimer() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setTimerState('paused')
  }

  function handleTimerButton(e: React.MouseEvent) {
    e.stopPropagation()
    if (timerState === 'idle' || timerState === 'paused' || timerState === 'done') startTimer()
    else if (timerState === 'running') pauseTimer()
  }

  const progress = secondsLeft / stretch.durationSec
  const dashOffset = CIRCUMFERENCE * progress

  const buttonLabel =
    timerState === 'idle' ? '▶ Start timer'
    : timerState === 'running' ? '⏸ Pause'
    : timerState === 'paused' ? '▶ Resume'
    : '✅ Done — switch sides!'

  const buttonColor =
    timerState === 'done' ? 'var(--green)'
    : 'var(--stretch)'

  const ringColor = timerState === 'done' ? 'var(--green)' : 'var(--stretch)'

  return (
    <div
      style={{
        background: 'var(--card)',
        border: `1px solid ${open ? 'var(--stretchbd)' : 'var(--edge)'}`,
        borderRadius: 'var(--radius)',
        marginBottom: 8,
        overflow: 'hidden',
        transition: 'border-color 0.18s',
      }}
    >
      {/* Collapsed header */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 14px', cursor: 'pointer',
        }}
      >
        {/* Number badge */}
        <div
          style={{
            width: 26, height: 26, borderRadius: '50%',
            background: 'var(--stretchbg)',
            border: '1px solid var(--stretchbd)',
            color: 'var(--stretch)',
            fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {number}
        </div>

        {/* Name + target */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
            {stretch.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
            {stretch.target}
          </div>
        </div>

        {/* Duration pill + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span
            style={{
              fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
              background: 'var(--stretchbg)', color: 'var(--stretch2)',
              letterSpacing: '0.03em',
            }}
          >
            {stretch.duration}
          </span>
          <div
            style={{
              fontSize: 14, color: 'var(--text3)',
              transition: 'transform 0.2s',
              transform: open ? 'rotate(180deg)' : 'none',
            }}
          >
            ⌄
          </div>
        </div>
      </div>

      {/* Expanded body */}
      {open && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {/* How-to */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
            <div
              style={{
                fontSize: 10, fontWeight: 600, color: 'var(--text3)',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7,
              }}
            >
              How to
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
              {stretch.howTo}
            </div>
            {stretch.shoulderNote && (
              <div
                style={{
                  marginTop: 8,
                  background: 'var(--redbg)', border: '1px solid var(--redbd)',
                  borderRadius: 'var(--radius-sm)', padding: '7px 10px',
                  fontSize: 12, color: 'var(--red)', lineHeight: 1.5,
                }}
              >
                ⚠️ <strong>Left shoulder:</strong> {stretch.shoulderNote}
              </div>
            )}
          </div>

          {/* What you feel */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
            <div
              style={{
                fontSize: 10, fontWeight: 600, color: 'var(--text3)',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7,
              }}
            >
              🎯 What you feel
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
              {stretch.feel}
            </div>
          </div>

          {/* Timer */}
          <div
            style={{
              padding: '16px 14px', borderBottom: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            }}
          >
            {/* SVG ring */}
            <div style={{ position: 'relative', width: 88, height: 88 }}>
              <svg width="88" height="88" viewBox="0 0 88 88" style={{ transform: 'rotate(-90deg)' }}>
                {/* Track */}
                <circle
                  cx="44" cy="44" r="34"
                  fill="none"
                  stroke="var(--edge)"
                  strokeWidth="5"
                />
                {/* Progress */}
                <circle
                  cx="44" cy="44" r="34"
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={dashOffset}
                  style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
                />
              </svg>
              {/* Seconds label */}
              <div
                style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: timerState === 'done' ? 11 : 20,
                  fontWeight: 700,
                  color: timerState === 'done' ? 'var(--green)' : 'var(--text)',
                }}
              >
                {timerState === 'done' ? '✓' : secondsLeft}
              </div>
            </div>

            {/* Timer button */}
            <button
              onClick={handleTimerButton}
              style={{
                padding: '8px 20px',
                background: timerState === 'done' ? 'rgba(86,201,154,0.12)' : 'var(--stretchbg)',
                border: `1px solid ${timerState === 'done' ? 'rgba(86,201,154,0.3)' : 'var(--stretchbd)'}`,
                borderRadius: 'var(--radius-sm)',
                color: buttonColor,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {buttonLabel}
            </button>
          </div>

          {/* Modifications */}
          <div style={{ padding: '12px 14px' }}>
            <div
              style={{
                fontSize: 10, fontWeight: 600, color: 'var(--text3)',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7,
              }}
            >
              🔄 Modifications
            </div>
            {stretch.modifications.map((mod, i) => (
              <div
                key={i}
                style={{
                  fontSize: 13, color: 'var(--text2)', lineHeight: 1.5,
                  padding: '5px 0',
                  borderBottom: i < stretch.modifications.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                · {mod.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
