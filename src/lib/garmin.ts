import { supabase } from './supabase'

export async function startGarminOAuth(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/garmin-request-token`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: session.user.id }),
    }
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error)

  window.location.href =
    `https://connect.garmin.com/oauthConfirm?oauth_token=${data.oauth_token}`
}

export async function syncGarminData(startDate: string): Promise<{ synced: number }> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/garmin-sync`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ startDate, days: 7 }),
    }
  )
  return res.json()
}
