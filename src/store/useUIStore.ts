import { create } from 'zustand'

interface UIState {
  activeMealDay: number
  activeGymDay: number
  setActiveMealDay: (index: number) => void
  setActiveGymDay: (index: number) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeMealDay: 0,
  activeGymDay: 0,
  setActiveMealDay: (index) => set({ activeMealDay: index }),
  setActiveGymDay: (index) => set({ activeGymDay: index }),
}))
