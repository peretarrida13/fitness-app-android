import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GARMIN_DAILIES_URL     = 'https://healthapi.garmin.com/wellness-api/rest/dailies'
const GARMIN_ACTIVITIES_URL  = 'https://healthapi.garmin.com/wellness-api/rest/activities'

async function hmacSha1(key: string, data: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(key),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
}

function pct(s: string): string {
  return encodeURIComponent(s)
}

function buildOAuthHeader(params: Record<string, string>, signature: string): string {
  const fields = { ...params, oauth_signature: signature }
  return 'OAuth ' + Object.entries(fields)
    .map(([k, v]) => `${k}="${pct(v)}"`)
    .join(', ')
}

async function garminGet(
  baseUrl: string,
  queryParams: Record<string, string>,
  consumerKey: string,
  consumerSecret: string,
  accessToken: string,
  tokenSecret: string,
): Promise<Response> {
  const nonce = crypto.randomUUID().replace(/-/g, '')
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: accessToken,
    oauth_version: '1.0',
  }
  const allParams = { ...oauthParams, ...queryParams }
  const sortedParams = Object.entries(allParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${pct(k)}=${pct(v)}`)
    .join('&')
  const baseString = `GET&${pct(baseUrl)}&${pct(sortedParams)}`
  const signingKey = `${pct(consumerSecret)}&${pct(tokenSecret)}`
  const signature = await hmacSha1(signingKey, baseString)
  const qs = new URLSearchParams(queryParams).toString()
  return fetch(`${baseUrl}?${qs}`, {
    headers: { Authorization: buildOAuthHeader(oauthParams, signature) },
  })
}

const MAX_BODY_BYTES = 512

// Per-user rate limit: 5 requests per 15 min (per instance)
const rateLimits = new Map<string, { count: number; resetAt: number }>()
function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimits.get(userId)
  if (!entry || now > entry.resetAt) {
    rateLimits.set(userId, { count: 1, resetAt: now + 15 * 60 * 1000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    })
  }

  try {
    // Reject oversized payloads
    const contentLength = Number(req.headers.get('content-length') ?? 0)
    if (contentLength > MAX_BODY_BYTES) {
      return new Response(JSON.stringify({ error: 'Payload too large' }), { status: 413 })
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const consumerKey = Deno.env.get('GARMIN_CONSUMER_KEY')!
    const consumerSecret = Deno.env.get('GARMIN_CONSUMER_SECRET')!

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!)
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authErr || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

    if (!checkRateLimit(user.id)) {
      return new Response(JSON.stringify({ error: 'Too many requests. Try again in 15 minutes.' }), {
        status: 429,
        headers: { 'Retry-After': '900' },
      })
    }

    // Get Garmin tokens
    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { data: tokenRow } = await adminClient
      .from('oauth_tokens')
      .select('access_token, token_secret')
      .eq('user_id', user.id)
      .eq('provider', 'garmin')
      .single()

    if (!tokenRow) {
      return new Response(JSON.stringify({ error: 'Garmin not connected' }), { status: 400 })
    }

    const body = await req.json()
    const { startDate } = body
    const days = body.days ?? 7

    // Validate inputs
    if (typeof startDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      return new Response(JSON.stringify({ error: 'Invalid startDate: expected YYYY-MM-DD' }), { status: 400 })
    }
    const daysNum = Number(days)
    if (!Number.isInteger(daysNum) || daysNum < 1 || daysNum > 30) {
      return new Response(JSON.stringify({ error: 'Invalid days: must be 1–30' }), { status: 400 })
    }

    const start = new Date(startDate)
    if (isNaN(start.getTime())) {
      return new Response(JSON.stringify({ error: 'Invalid startDate' }), { status: 400 })
    }
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + daysNum)

    const uploadStart = Math.floor(start.getTime() / 1000)
    const uploadEnd = Math.floor(end.getTime() / 1000)

    const timeQuery = {
      uploadStartTimeInSeconds: uploadStart.toString(),
      uploadEndTimeInSeconds: uploadEnd.toString(),
    }
    const creds = [consumerKey, consumerSecret, tokenRow.access_token, tokenRow.token_secret] as const

    // ── Dailies ──────────────────────────────────────────────────────────────
    const dailiesRes = await garminGet(GARMIN_DAILIES_URL, timeQuery, ...creds)
    if (!dailiesRes.ok) {
      const text = await dailiesRes.text()
      return new Response(JSON.stringify({ error: `Garmin dailies error: ${text}` }), { status: 502 })
    }
    const { dailies = [] } = await dailiesRes.json()

    let syncedDaily = 0
    for (const d of dailies) {
      await adminClient.from('daily_activity').upsert({
        user_id: user.id,
        activity_date: d.calendarDate,
        steps: d.totalSteps ?? 0,
        active_calories: d.activeKilocalories ?? 0,
        resting_heart_rate: d.restingHeartRateInBeatsPerMinute ?? null,
        total_calories: (d.activeKilocalories ?? 0) + (d.bmrKilocalories ?? 0),
        distance_meters: d.totalDistanceInMeters ?? 0,
        stress_avg: d.averageStressLevel ?? null,
        active_seconds: (d.highlyActiveSeconds ?? 0) + (d.activeSeconds ?? 0),
        body_battery_low: d.bodyBatteryLowestValue ?? null,
        floors_climbed: d.floorsClimbed ?? 0,
        synced_at: new Date().toISOString(),
      }, { onConflict: 'user_id,activity_date' })
      syncedDaily++
    }

    // ── Activities ────────────────────────────────────────────────────────────
    const activitiesRes = await garminGet(GARMIN_ACTIVITIES_URL, timeQuery, ...creds)
    let syncedActivities = 0

    if (activitiesRes.ok) {
      const { activities = [] } = await activitiesRes.json()
      for (const a of activities) {
        // Compute local calendar date from start time + offset
        const localMs = (a.startTimeInSeconds + (a.startTimeOffsetInSeconds ?? 0)) * 1000
        const d = new Date(localMs)
        const activityDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

        // Pace only for running types
        const isRun = String(a.activityType ?? '').toUpperCase().includes('RUN')
        const avgPace = isRun && a.distanceInMeters > 0
          ? a.durationInSeconds / (a.distanceInMeters / 1000)
          : null

        await adminClient.from('activities').upsert({
          user_id: user.id,
          garmin_activity_id: String(a.activityId),
          activity_date: activityDate,
          activity_type: a.activityType ?? 'UNKNOWN',
          name: a.activityName ?? null,
          duration_seconds: a.durationInSeconds ?? null,
          distance_meters: a.distanceInMeters ?? null,
          avg_pace_sec_per_km: avgPace ? Math.round(avgPace) : null,
          avg_heart_rate: a.averageHeartRateInBeatsPerMinute ?? null,
          calories: a.activeKilocalories ?? null,
          elevation_gain_m: a.totalElevationGainInMeters ?? null,
          avg_cadence: a.averageRunCadenceInStepsPerMinute ?? null,
          synced_at: new Date().toISOString(),
        }, { onConflict: 'user_id,garmin_activity_id' })
        syncedActivities++
      }
    }

    return new Response(
      JSON.stringify({ synced_daily: syncedDaily, synced_activities: syncedActivities }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
