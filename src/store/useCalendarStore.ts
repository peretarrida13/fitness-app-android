import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getMondayOfWeek } from '@/lib/dateUtils'

interface CalendarState {
  weekOffset: number
  googleAccessToken: string | null
  prevWeek: () => void
  nextWeek: () => void
  resetToToday: () => void
  getWeekStart: () => Date
  setGoogleToken: (token: string | null) => void
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      weekOffset: 0,
      googleAccessToken: null,

      prevWeek: () => set((s) => ({ weekOffset: s.weekOffset - 1 })),
      nextWeek: () => set((s) => ({ weekOffset: s.weekOffset + 1 })),
      resetToToday: () => set({ weekOffset: 0 }),

      getWeekStart: () => {
        const monday = getMondayOfWeek(new Date())
        monday.setDate(monday.getDate() + get().weekOffset * 7)
        return monday
      },

      setGoogleToken: (token) => set({ googleAccessToken: token }),
    }),
    {
      name: 'jarvis-calendar',
      partialize: (s) => ({ googleAccessToken: s.googleAccessToken }),
    }
  )
)
