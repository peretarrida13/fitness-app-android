import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { toDateStr, getMondayOfWeek, getWeekDays } from '@/lib/dateUtils'
import type { Habit, HabitLog, HabitColor } from '@/types/supabase'

const QK = {
  habits:   ['habits'] as const,
  logsWeek: (start: string) => ['habit_logs', 'week', start] as const,
  streaks:  ['habit_streaks'] as const,
}

export function useHabits() {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: QK.habits,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .order('sort_order', { ascending: true })
      if (error) throw error
      return data as Habit[]
    },
  })
}

export function useHabitLogsForWeek(weekStart: Date) {
  const user = useAuthStore((s) => s.user)
  const days = getWeekDays(weekStart)
  const start = toDateStr(days[0])
  const end = toDateStr(days[6])

  return useQuery({
    queryKey: QK.logsWeek(start),
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habit_logs')
        .select('habit_id, logged_date')
        .gte('logged_date', start)
        .lte('logged_date', end)
      if (error) throw error
      const map = new Map<string, Set<string>>()
      for (const row of data as Pick<HabitLog, 'habit_id' | 'logged_date'>[]) {
        const set = map.get(row.logged_date) ?? new Set<string>()
        set.add(row.habit_id)
        map.set(row.logged_date, set)
      }
      return map
    },
  })
}

export function useHabitStreaks() {
  const user = useAuthStore((s) => s.user)
  const today = toDateStr(new Date())
  const since = toDateStr(new Date(Date.now() - 90 * 86_400_000))

  return useQuery({
    queryKey: QK.streaks,
    enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habit_logs')
        .select('habit_id, logged_date')
        .gte('logged_date', since)
        .order('logged_date', { ascending: false })
      if (error) throw error

      const byHabit = new Map<string, string[]>()
      for (const row of data as Pick<HabitLog, 'habit_id' | 'logged_date'>[]) {
        const arr = byHabit.get(row.habit_id) ?? []
        arr.push(row.logged_date)
        byHabit.set(row.habit_id, arr)
      }

      const streaks = new Map<string, number>()
      const MS_DAY = 86_400_000

      for (const [habitId, dates] of byHabit) {
        let streak = 0
        let cursor = new Date(today + 'T12:00:00')
        for (const dateStr of dates) {
          const d = new Date(dateStr + 'T12:00:00')
          const diff = Math.round((cursor.getTime() - d.getTime()) / MS_DAY)
          if (diff === 0 || diff === 1) {
            streak++
            cursor = d
          } else {
            break
          }
        }
        streaks.set(habitId, streak)
      }
      return streaks
    },
  })
}

export function useHabitLogsForMonth(monthStart: Date) {
  const user = useAuthStore((s) => s.user)
  const start = toDateStr(monthStart)
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)
  const end = toDateStr(monthEnd)

  return useQuery({
    queryKey: ['habit_logs', 'month', start] as const,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habit_logs')
        .select('habit_id, logged_date')
        .gte('logged_date', start)
        .lte('logged_date', end)
      if (error) throw error
      const map = new Map<string, Set<string>>()
      for (const row of data as Pick<HabitLog, 'habit_id' | 'logged_date'>[]) {
        const set = map.get(row.logged_date) ?? new Set<string>()
        set.add(row.habit_id)
        map.set(row.logged_date, set)
      }
      return map
    },
  })
}

export function useAddHabit() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  return useMutation({
    mutationFn: async (payload: { name: string; icon: string; color: HabitColor; sort_order: number }) => {
      const { error } = await supabase.from('habits').insert({ ...payload, user_id: user!.id })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.habits }),
  })
}

export function useUpdateHabit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string; name?: string; icon?: string; color?: HabitColor }) => {
      const { error } = await supabase.from('habits').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.habits }),
  })
}

export function useDeleteHabit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('habits').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.habits })
      qc.invalidateQueries({ queryKey: ['habit_logs'] })
      qc.invalidateQueries({ queryKey: QK.streaks })
    },
  })
}

export function useToggleHabitLog() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  return useMutation({
    mutationFn: async ({
      habitId,
      date,
      currentlyDone,
    }: { habitId: string; date: string; currentlyDone: boolean }) => {
      if (currentlyDone) {
        const { error } = await supabase
          .from('habit_logs')
          .delete()
          .eq('habit_id', habitId)
          .eq('logged_date', date)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('habit_logs')
          .insert({ user_id: user!.id, habit_id: habitId, logged_date: date })
        if (error && error.code !== '23505') throw error
      }
    },
    onSuccess: (_data, { date }) => {
      const weekStart = toDateStr(getMondayOfWeek(new Date(date + 'T12:00:00')))
      qc.invalidateQueries({ queryKey: QK.logsWeek(weekStart) })
      qc.invalidateQueries({ queryKey: QK.streaks })
    },
  })
}
