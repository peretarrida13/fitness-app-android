export interface StretchModification {
  text: string
}

export interface Stretch {
  id: number
  name: string
  target: string
  duration: string
  durationSec: number
  howTo: string
  feel: string
  shoulderNote?: string
  bilateral?: boolean
  modifications: StretchModification[]
}

export interface StretchSection {
  label: string
  stretches: Stretch[]
}
