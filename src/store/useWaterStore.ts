import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WaterState {
  date: string
  ml: number
  add: (amount: number) => void
  reset: () => void
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export const useWaterStore = create<WaterState>()(
  persist(
    (set, get) => ({
      date: todayISO(),
      ml: 0,
      add: (amount) => {
        const today = todayISO()
        const { date, ml } = get()
        if (date !== today) {
          set({ date: today, ml: amount })
        } else {
          set({ ml: ml + amount })
        }
      },
      reset: () => set({ date: todayISO(), ml: 0 }),
    }),
    { name: 'jarvis-water' }
  )
)
