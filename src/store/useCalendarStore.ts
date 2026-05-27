import { create } from 'zustand'
import { getMondayOfWeek } from '@/lib/dateUtils'

interface CalendarState {
  weekOffset: number
  googleAccessToken: string | null
  garminConnected: boolean
  prevWeek: () => void
  nextWeek: () => void
  resetToToday: () => void
  getWeekStart: () => Date
  setGoogleToken: (token: string | null) => void
  setGarminConnected: (v: boolean) => void
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  weekOffset: 0,
  googleAccessToken: null,
  garminConnected: false,

  prevWeek: () => set((s) => ({ weekOffset: s.weekOffset - 1 })),
  nextWeek: () => set((s) => ({ weekOffset: s.weekOffset + 1 })),
  resetToToday: () => set({ weekOffset: 0 }),

  getWeekStart: () => {
    const monday = getMondayOfWeek(new Date())
    monday.setDate(monday.getDate() + get().weekOffset * 7)
    return monday
  },

  setGoogleToken: (token) => set({ googleAccessToken: token }),
  setGarminConnected: (v) => set({ garminConnected: v }),
}))
