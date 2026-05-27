export interface Profile {
  id: string
  email: string
  display_name: string | null
  created_at: string
}

export interface WorkoutLog {
  id: string
  user_id: string
  logged_date: string
  gym_day_index: number
  notes: string | null
  logged_at: string
}

export interface DailyActivity {
  id: string
  user_id: string
  activity_date: string
  steps: number
  active_calories: number
  resting_heart_rate: number | null
  total_calories: number
  distance_meters: number
  synced_at: string
}

export interface OAuthToken {
  id: string
  user_id: string
  provider: 'garmin'
  access_token: string
  token_secret: string
  garmin_user_id: string | null
  created_at: string
  updated_at: string
}

export interface WeightLog {
  id: string
  user_id: string
  logged_date: string
  weight_kg: number
  note: string | null
  created_at: string
}

export interface Measurement {
  id: string
  user_id: string
  logged_date: string
  waist_cm: number | null
  chest_cm: number | null
  left_arm_cm: number | null
  hips_cm: number | null
  note: string | null
  created_at: string
}

export interface PersonalRecord {
  id: string
  user_id: string
  exercise_name: string
  weight_kg: number
  reps: number
  logged_date: string
  note: string | null
  created_at: string
}

export interface Activity {
  id: string
  user_id: string
  garmin_activity_id: string
  activity_date: string
  activity_type: string
  name: string | null
  duration_seconds: number | null
  distance_meters: number | null
  avg_pace_sec_per_km: number | null
  avg_heart_rate: number | null
  calories: number | null
  elevation_gain_m: number | null
  avg_cadence: number | null
  synced_at: string
}

export interface GoogleCalendarEvent {
  id: string
  summary: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
}
