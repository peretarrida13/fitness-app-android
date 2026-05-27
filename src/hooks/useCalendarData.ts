import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { toDateStr, getWeekDays } from '@/lib/dateUtils'
import { syncGarminData } from '@/lib/garmin'
import type { WorkoutLog, DailyActivity, Activity } from '@/types/supabase'

function weekDateRange(weekStart: Date) {
  const days = getWeekDays(weekStart)
  return {
    start: toDateStr(days[0]),
    end: toDateStr(days[6]),
  }
}

export function useWorkoutLogs(weekStart: Date) {
  const user = useAuthStore((s) => s.user)
  const { start, end } = weekDateRange(weekStart)

  return useQuery({
    queryKey: ['workout_logs', start],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .gte('logged_date', start)
        .lte('logged_date', end)
      if (error) throw error
      const map = new Map<string, WorkoutLog>()
      for (const row of data as WorkoutLog[]) map.set(row.logged_date, row)
      return map
    },
  })
}

export function useLogWorkout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ logged_date, gym_day_index }: { logged_date: string; gym_day_index: number }) => {
      const { error } = await supabase
        .from('workout_logs')
        .upsert({ logged_date, gym_day_index }, { onConflict: 'user_id,logged_date' })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workout_logs'] }),
  })
}

export function useDeleteWorkoutLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (logged_date: string) => {
      const { error } = await supabase
        .from('workout_logs')
        .delete()
        .eq('logged_date', logged_date)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workout_logs'] }),
  })
}

export function useDailyActivity(weekStart: Date) {
  const user = useAuthStore((s) => s.user)
  const { start, end } = weekDateRange(weekStart)

  return useQuery({
    queryKey: ['daily_activity', start],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_activity')
        .select('*')
        .gte('activity_date', start)
        .lte('activity_date', end)
      if (error) throw error
      const map = new Map<string, DailyActivity>()
      for (const row of data as DailyActivity[]) map.set(row.activity_date, row)
      return map
    },
  })
}

export function useActivities(weekStart: Date) {
  const user = useAuthStore((s) => s.user)
  const { start, end } = weekDateRange(weekStart)

  return useQuery({
    queryKey: ['activities', start],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .gte('activity_date', start)
        .lte('activity_date', end)
        .order('activity_date')
      if (error) throw error
      const map = new Map<string, Activity[]>()
      for (const row of data as Activity[]) {
        const list = map.get(row.activity_date) ?? []
        list.push(row)
        map.set(row.activity_date, list)
      }
      return map
    },
  })
}

export function useGarminSync() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (startDate: string) => syncGarminData(startDate),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['daily_activity'] }),
  })
}
