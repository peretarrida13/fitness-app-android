import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  weightGoalKg: number
  calorieTarget: number
  proteinTarget: number
  stepGoal: number
  waterGoalMl: number
  setWeightGoalKg: (v: number) => void
  setCalorieTarget: (v: number) => void
  setProteinTarget: (v: number) => void
  setStepGoal: (v: number) => void
  setWaterGoalMl: (v: number) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      weightGoalKg: 80,
      calorieTarget: 2150,
      proteinTarget: 170,
      stepGoal: 10000,
      waterGoalMl: 2500,
      setWeightGoalKg: (v) => set({ weightGoalKg: v }),
      setCalorieTarget: (v) => set({ calorieTarget: v }),
      setProteinTarget: (v) => set({ proteinTarget: v }),
      setStepGoal: (v) => set({ stepGoal: v }),
      setWaterGoalMl: (v) => set({ waterGoalMl: v }),
    }),
    { name: 'jarvis-settings' }
  )
)
