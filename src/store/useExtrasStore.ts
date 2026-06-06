import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ExtrasEntry {
  kcal: number
  protein: number
}

interface ExtrasState {
  extras: Record<string, ExtrasEntry>
  setExtras: (date: string, kcal: number, protein: number) => void
}

export const useExtrasStore = create<ExtrasState>()(
  persist(
    (set) => ({
      extras: {},
      setExtras: (date, kcal, protein) =>
        set((state) => ({ extras: { ...state.extras, [date]: { kcal, protein } } })),
    }),
    { name: 'jarvis-extras' }
  )
)
