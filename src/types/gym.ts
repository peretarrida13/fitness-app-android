export type DayType = 'strength' | 'cardio' | 'rest'

export interface ExerciseAlt {
  name: string
  reason: string
}

export interface Exercise {
  id: string
  name: string
  type: 'compound' | 'iso' | 'cardio'
  muscle: string
  sets?: number
  reps?: string
  rest?: string
  tip?: string
  alts?: ExerciseAlt[]
  badge?: string
  details?: string
}

export interface ExerciseSection {
  label: string
  exercises: Exercise[]
}

export interface GymDay {
  name: string
  sub: string
  duration: string
  type: DayType
  warmup?: string
  injuryNote?: string
  exercises?: number
  sets?: number
  sections?: ExerciseSection[]
  isCardio?: boolean
  cardioOptions?: Exercise[]
  isRest?: boolean
}
