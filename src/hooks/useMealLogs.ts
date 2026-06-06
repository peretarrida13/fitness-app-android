import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'

export function useMealLogsForDay(date: string) {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: ['meal_logs', date],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meal_logs')
        .select('meal_id')
        .eq('logged_date', date)
      if (error) throw error
      return new Set((data as { meal_id: string }[]).map((r) => r.meal_id))
    },
  })
}

export function useToggleMealLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      date,
      mealId,
      currentlyEaten,
    }: { date: string; mealId: string; currentlyEaten: boolean }) => {
      if (currentlyEaten) {
        const { error } = await supabase
          .from('meal_logs')
          .delete()
          .eq('logged_date', date)
          .eq('meal_id', mealId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('meal_logs')
          .insert({ logged_date: date, meal_id: mealId })
        if (error && error.code !== '23505') throw error
      }
    },
    onSuccess: (_data, { date }) => {
      qc.invalidateQueries({ queryKey: ['meal_logs', date] })
    },
  })
}
