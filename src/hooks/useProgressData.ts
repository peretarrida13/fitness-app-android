import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { toDateStr } from '@/lib/dateUtils'
import type { WeightLog, Measurement, PersonalRecord, Activity } from '@/types/supabase'

export interface HealthRow {
  activity_date: string
  resting_heart_rate: number | null
  stress_avg: number | null
  active_seconds: number | null
  hrv_rmssd: number | null
  body_battery_low: number | null
  steps: number
}

// ─── Weight ────────────────────────────────────────────────────────────────

export function useWeightLogs(days = 90) {
  const user = useAuthStore((s) => s.user)
  const since = toDateStr(new Date(Date.now() - days * 86400_000))

  return useQuery({
    queryKey: ['weight_logs', days],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weight_logs')
        .select('*')
        .gte('logged_date', since)
        .order('logged_date', { ascending: true })
      if (error) throw error
      return data as WeightLog[]
    },
  })
}

export function useLogWeight() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ weight_kg, note }: { weight_kg: number; note?: string }) => {
      const { error } = await supabase
        .from('weight_logs')
        .upsert({ logged_date: toDateStr(new Date()), weight_kg, note: note ?? null },
          { onConflict: 'user_id,logged_date' })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['weight_logs'] }),
  })
}

export function useDeleteWeightLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('weight_logs').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['weight_logs'] }),
  })
}

// ─── Personal Records ───────────────────────────────────────────────────────

export function usePersonalRecords() {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: ['personal_records'],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('personal_records')
        .select('*')
        .order('logged_date', { ascending: false })
      if (error) throw error
      return data as PersonalRecord[]
    },
  })
}

export function useAddPR() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (pr: { exercise_name: string; weight_kg: number; reps: number; note?: string }) => {
      const { error } = await supabase
        .from('personal_records')
        .insert({ ...pr, logged_date: toDateStr(new Date()), note: pr.note ?? null })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['personal_records'] }),
  })
}

export function useDeletePR() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('personal_records').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['personal_records'] }),
  })
}

// ─── Measurements ──────────────────────────────────────────────────────────

export function useMeasurements(days = 90) {
  const user = useAuthStore((s) => s.user)
  const since = toDateStr(new Date(Date.now() - days * 86400_000))

  return useQuery({
    queryKey: ['measurements', days],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('measurements')
        .select('*')
        .gte('logged_date', since)
        .order('logged_date', { ascending: true })
      if (error) throw error
      return data as Measurement[]
    },
  })
}

export function useLogMeasurement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (m: { waist_cm?: number; chest_cm?: number; left_arm_cm?: number; hips_cm?: number }) => {
      const { error } = await supabase
        .from('measurements')
        .upsert({ logged_date: toDateStr(new Date()), ...m },
          { onConflict: 'user_id,logged_date' })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['measurements'] }),
  })
}

// ─── Running activities ─────────────────────────────────────────────────────

const RUNNING_TYPES = ['RUNNING', 'TREADMILL_RUNNING', 'TRAIL_RUNNING', 'INDOOR_RUNNING', 'VIRTUAL_RUN']

export function useRunningData(days = 90) {
  const user = useAuthStore((s) => s.user)
  const since = toDateStr(new Date(Date.now() - days * 86400_000))

  return useQuery({
    queryKey: ['running_activities', days],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .gte('activity_date', since)
        .in('activity_type', RUNNING_TYPES)
        .order('activity_date', { ascending: true })
      if (error) throw error
      return data as Activity[]
    },
  })
}

// ─── Health (Garmin daily_activity) ────────────────────────────────────────

export function useHealthData(days = 30) {
  const user = useAuthStore((s) => s.user)
  const since = toDateStr(new Date(Date.now() - days * 86400_000))

  return useQuery({
    queryKey: ['health_data', days],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_activity')
        .select('activity_date,resting_heart_rate,stress_avg,active_seconds,steps,hrv_rmssd,body_battery_low')
        .gte('activity_date', since)
        .order('activity_date', { ascending: true })
      if (error) throw error
      return data as HealthRow[]
    },
  })
}

// ─── Workout history (reuse existing workout_logs) ─────────────────────────

export function useWorkoutHistory(days = 84) {
  const user = useAuthStore((s) => s.user)
  const since = toDateStr(new Date(Date.now() - days * 86400_000))

  return useQuery({
    queryKey: ['workout_history', days],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_logs')
        .select('logged_date,gym_day_index')
        .gte('logged_date', since)
        .order('logged_date', { ascending: false })
      if (error) throw error
      return data as { logged_date: string; gym_day_index: number }[]
    },
  })
}
