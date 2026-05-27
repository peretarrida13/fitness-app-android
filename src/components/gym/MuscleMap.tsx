import type { GymDay, Exercise } from '@/types/gym'

type MuscleKey =
  | 'chest' | 'front_delt' | 'biceps' | 'forearms' | 'core' | 'quads' | 'calves'
  | 'upper_back' | 'lats' | 'rear_delt' | 'triceps' | 'glutes' | 'hamstrings'

type Scores = Record<MuscleKey, number>

const ALL_KEYS: MuscleKey[] = [
  'chest', 'front_delt', 'biceps', 'forearms', 'core', 'quads', 'calves',
  'upper_back', 'lats', 'rear_delt', 'triceps', 'glutes', 'hamstrings',
]

// ─── Keyword → muscle mapping ───────────────────────────────────────────────

function parseMuscle(str: string): MuscleKey[] {
  const s = str.toLowerCase()
  const out: MuscleKey[] = []

  if (s.includes('chest') || s.includes('pect')) out.push('chest')
  if (s.includes('front delt')) out.push('front_delt')
  else if (s.includes('shoulder')) out.push('front_delt')
  if (s.includes('rear delt')) out.push('rear_delt')
  if (s.includes('tricep')) out.push('triceps')
  if (s.includes('bicep')) out.push('biceps')
  if (s.includes('forearm')) out.push('forearms')
  if (s.includes('upper back')) { out.push('upper_back'); out.push('lats') }
  else if (s.includes('back')) out.push('upper_back')
  if (s.includes('lat')) out.push('lats')
  if (s.includes('quad')) out.push('quads')
  if (s.includes('hamstring')) out.push('hamstrings')
  if (s.includes('glute')) out.push('glutes')
  if (s.includes('calf') || s.includes('calves')) out.push('calves')
  if (s.includes('core') || s.includes('abs')) out.push('core')
  if (s.includes('trap')) out.push('upper_back')

  return [...new Set(out)]
}

function zero(): Scores {
  return Object.fromEntries(ALL_KEYS.map((k) => [k, 0])) as Scores
}

function scoreExercise(ex: Exercise, scores: Scores) {
  const points = ex.type === 'compound' ? 3 : 1
  const muscles = parseMuscle(ex.muscle)
  for (const m of muscles) scores[m] = Math.min(scores[m] + points, 12)
}

function computeScores(day: GymDay): Scores {
  const s = zero()
  if (day.isRest) return s

  if (day.isCardio) {
    // Full-body activation at moderate level
    const cardioMuscles: MuscleKey[] = [
      'quads', 'hamstrings', 'calves', 'glutes', 'core',
      'chest', 'lats', 'biceps', 'triceps', 'forearms', 'front_delt',
    ]
    for (const m of cardioMuscles) s[m] = 3
    s.quads = 5; s.hamstrings = 4; s.calves = 4; s.glutes = 4; s.core = 4
    return s
  }

  for (const section of day.sections ?? []) {
    for (const ex of section.exercises) scoreExercise(ex, s)
  }
  return s
}

// ─── Color helpers ───────────────────────────────────────────────────────────

function muscleColor(score: number): string {
  if (score === 0) return 'rgba(255,255,255,0.04)'
  const t = Math.min(score / 10, 1)
  if (t < 0.25) return 'rgba(91,141,238,0.22)'
  if (t < 0.55) return 'rgba(91,141,238,0.52)'
  return 'rgba(91,141,238,0.88)'
}

function muscleStroke(score: number): string {
  if (score === 0) return 'rgba(255,255,255,0.08)'
  const t = Math.min(score / 10, 1)
  if (t < 0.25) return 'rgba(91,141,238,0.35)'
  if (t < 0.55) return 'rgba(91,141,238,0.65)'
  return '#5b8dee'
}

function hasGlow(score: number) { return score >= 6 }

// ─── SVG building blocks ─────────────────────────────────────────────────────

interface MuscleShapeProps {
  score: number
  cx?: number; cy?: number; rx?: number; ry?: number
  d?: string
}

function MuscleShape({ score, cx, cy, rx, ry, d }: MuscleShapeProps) {
  const fill = muscleColor(score)
  const stroke = muscleStroke(score)
  const filter = hasGlow(score) ? 'url(#glow)' : undefined
  const sw = score === 0 ? 0.5 : 1

  if (d) {
    return <path d={d} fill={fill} stroke={stroke} strokeWidth={sw} filter={filter} />
  }
  return (
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry}
      fill={fill} stroke={stroke} strokeWidth={sw} filter={filter} />
  )
}

// ─── Body silhouette (shared by front + back) ────────────────────────────────

function BodySilhouette() {
  const c = '#16161f'
  const s = '#252535'
  return (
    <g>
      {/* Head */}
      <ellipse cx="50" cy="14" rx="13" ry="14" fill={c} stroke={s} strokeWidth="0.8" />
      {/* Neck */}
      <rect x="44" y="26" width="12" height="8" fill={c} stroke={s} strokeWidth="0.8" />
      {/* Upper torso */}
      <path
        d="M 18 34 Q 12 38 12 48 L 13 80 L 87 80 L 88 48 Q 88 38 82 34 L 66 30 L 60 28 L 40 28 L 34 30 Z"
        fill={c} stroke={s} strokeWidth="0.8"
      />
      {/* Left upper arm */}
      <rect x="11" y="34" width="12" height="40" rx="6" fill={c} stroke={s} strokeWidth="0.8" />
      {/* Right upper arm */}
      <rect x="77" y="34" width="12" height="40" rx="6" fill={c} stroke={s} strokeWidth="0.8" />
      {/* Left forearm */}
      <rect x="10" y="72" width="10" height="30" rx="5" fill={c} stroke={s} strokeWidth="0.8" />
      {/* Right forearm */}
      <rect x="80" y="72" width="10" height="30" rx="5" fill={c} stroke={s} strokeWidth="0.8" />
      {/* Left hand */}
      <ellipse cx="15" cy="107" rx="6" ry="5" fill={c} stroke={s} strokeWidth="0.8" />
      {/* Right hand */}
      <ellipse cx="85" cy="107" rx="6" ry="5" fill={c} stroke={s} strokeWidth="0.8" />
      {/* Hip/pelvis */}
      <rect x="28" y="80" width="44" height="18" rx="6" fill={c} stroke={s} strokeWidth="0.8" />
      {/* Left upper leg */}
      <rect x="28" y="96" width="19" height="48" rx="8" fill={c} stroke={s} strokeWidth="0.8" />
      {/* Right upper leg */}
      <rect x="53" y="96" width="19" height="48" rx="8" fill={c} stroke={s} strokeWidth="0.8" />
      {/* Left lower leg */}
      <rect x="29" y="142" width="16" height="44" rx="7" fill={c} stroke={s} strokeWidth="0.8" />
      {/* Right lower leg */}
      <rect x="55" y="142" width="16" height="44" rx="7" fill={c} stroke={s} strokeWidth="0.8" />
      {/* Feet */}
      <ellipse cx="37" cy="191" rx="10" ry="5" fill={c} stroke={s} strokeWidth="0.8" />
      <ellipse cx="63" cy="191" rx="10" ry="5" fill={c} stroke={s} strokeWidth="0.8" />
    </g>
  )
}

// ─── Front view muscles ──────────────────────────────────────────────────────

function FrontMuscles({ s }: { s: Scores }) {
  return (
    <g>
      {/* Chest */}
      <MuscleShape score={s.chest} cx={37} cy={52} rx={11} ry={10} />
      <MuscleShape score={s.chest} cx={63} cy={52} rx={11} ry={10} />
      {/* Front delts */}
      <MuscleShape score={s.front_delt} cx={16} cy={43} rx={8} ry={7} />
      <MuscleShape score={s.front_delt} cx={84} cy={43} rx={8} ry={7} />
      {/* Biceps */}
      <MuscleShape score={s.biceps} cx={16} cy={61} rx={6} ry={9} />
      <MuscleShape score={s.biceps} cx={84} cy={61} rx={6} ry={9} />
      {/* Forearms */}
      <MuscleShape score={s.forearms} cx={15} cy={83} rx={5} ry={11} />
      <MuscleShape score={s.forearms} cx={85} cy={83} rx={5} ry={11} />
      {/* Core / Abs */}
      <MuscleShape score={s.core} cx={50} cy={68} rx={13} ry={9} />
      {/* Quads */}
      <MuscleShape score={s.quads} cx={36} cy={118} rx={9} ry={20} />
      <MuscleShape score={s.quads} cx={64} cy={118} rx={9} ry={20} />
      {/* Calves */}
      <MuscleShape score={s.calves} cx={36} cy={161} rx={7} ry={13} />
      <MuscleShape score={s.calves} cx={64} cy={161} rx={7} ry={13} />
    </g>
  )
}

// ─── Back view muscles ───────────────────────────────────────────────────────

function BackMuscles({ s }: { s: Scores }) {
  return (
    <g>
      {/* Upper back / traps */}
      <MuscleShape score={s.upper_back} cx={50} cy={46} rx={20} ry={12} />
      {/* Lats */}
      <MuscleShape score={s.lats} cx={32} cy={66} rx={10} ry={16} />
      <MuscleShape score={s.lats} cx={68} cy={66} rx={10} ry={16} />
      {/* Rear delts */}
      <MuscleShape score={s.rear_delt} cx={16} cy={43} rx={8} ry={7} />
      <MuscleShape score={s.rear_delt} cx={84} cy={43} rx={8} ry={7} />
      {/* Triceps */}
      <MuscleShape score={s.triceps} cx={16} cy={62} rx={6} ry={10} />
      <MuscleShape score={s.triceps} cx={84} cy={62} rx={6} ry={10} />
      {/* Forearms (back) */}
      <MuscleShape score={s.forearms} cx={15} cy={83} rx={5} ry={11} />
      <MuscleShape score={s.forearms} cx={85} cy={83} rx={5} ry={11} />
      {/* Glutes */}
      <MuscleShape score={s.glutes} cx={37} cy={99} rx={13} ry={12} />
      <MuscleShape score={s.glutes} cx={63} cy={99} rx={13} ry={12} />
      {/* Hamstrings */}
      <MuscleShape score={s.hamstrings} cx={36} cy={122} rx={9} ry={20} />
      <MuscleShape score={s.hamstrings} cx={64} cy={122} rx={9} ry={20} />
      {/* Calves back */}
      <MuscleShape score={s.calves} cx={36} cy={161} rx={6} ry={12} />
      <MuscleShape score={s.calves} cx={64} cy={161} rx={6} ry={12} />
    </g>
  )
}

// ─── Legend ──────────────────────────────────────────────────────────────────

function Legend() {
  const items = [
    { label: 'Low', color: 'rgba(91,141,238,0.30)' },
    { label: 'Medium', color: 'rgba(91,141,238,0.60)' },
    { label: 'High', color: 'rgba(91,141,238,0.90)' },
  ]
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 8 }}>
      {items.map(({ label, color }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'var(--text3)' }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: color, border: '1px solid rgba(91,141,238,0.5)' }} />
          {label}
        </div>
      ))}
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

interface Props {
  day: GymDay
}

const SVG_DEFS = (
  <defs>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="2.5" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
)

export function MuscleMap({ day }: Props) {
  if (day.isRest) return null

  const scores = computeScores(day)

  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--edge)',
      borderRadius: 'var(--radius)', padding: '12px 14px',
      marginBottom: 12,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '0.10em',
        color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 10,
      }}>
        Muscle activation
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {/* Front */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 9, color: 'var(--text3)', marginBottom: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Front
          </div>
          <svg viewBox="0 0 100 200" style={{ width: '100%', maxWidth: 120 }}>
            {SVG_DEFS}
            <BodySilhouette />
            <FrontMuscles s={scores} />
          </svg>
        </div>

        {/* Divider */}
        <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />

        {/* Back */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 9, color: 'var(--text3)', marginBottom: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Back
          </div>
          <svg viewBox="0 0 100 200" style={{ width: '100%', maxWidth: 120 }}>
            {SVG_DEFS}
            <BodySilhouette />
            <BackMuscles s={scores} />
          </svg>
        </div>
      </div>

      <Legend />
    </div>
  )
}
