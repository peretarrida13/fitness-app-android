import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GARMIN_REQUEST_TOKEN_URL = 'https://connectapi.garmin.com/oauth-service/oauth/request_token'
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
    const consumerKey = Deno.env.get('GARMIN_CONSUMER_KEY')!
    const consumerSecret = Deno.env.get('GARMIN_CONSUMER_SECRET')!
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!

    // Reject oversized payloads
    const contentLength = Number(req.headers.get('content-length') ?? 0)
    if (contentLength > MAX_BODY_BYTES) {
      return new Response(JSON.stringify({ error: 'Payload too large' }), { status: 413 })
    }

    // Verify caller is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!)
    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authErr || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

    if (!checkRateLimit(user.id)) {
      return new Response(JSON.stringify({ error: 'Too many requests. Try again in 15 minutes.' }), {
        status: 429,
        headers: { 'Retry-After': '900' },
      })
    }

    const reqBody = await req.json()
    const platform = ['web', 'android'].includes(reqBody.platform) ? reqBody.platform : 'web'
    const statePayload = btoa(JSON.stringify({ userId: user.id, platform }))
    const callbackUrl = `${supabaseUrl}/functions/v1/garmin-oauth-callback?state=${statePayload}`

    const nonce = crypto.randomUUID().replace(/-/g, '')
    const timestamp = Math.floor(Date.now() / 1000).toString()

    const oauthParams: Record<string, string> = {
      oauth_callback: callbackUrl,
      oauth_consumer_key: consumerKey,
      oauth_nonce: nonce,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: timestamp,
      oauth_version: '1.0',
    }

    const sortedParams = Object.entries(oauthParams)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${pct(k)}=${pct(v)}`)
      .join('&')

    const baseString = `POST&${pct(GARMIN_REQUEST_TOKEN_URL)}&${pct(sortedParams)}`
    const signingKey = `${pct(consumerSecret)}&`
    const signature = await hmacSha1(signingKey, baseString)

    const res = await fetch(GARMIN_REQUEST_TOKEN_URL, {
      method: 'POST',
      headers: { Authorization: buildOAuthHeader(oauthParams, signature) },
    })

    if (!res.ok) {
      const text = await res.text()
      return new Response(JSON.stringify({ error: `Garmin error: ${text}` }), { status: 502 })
    }

    const body = await res.text()
    const parsed = Object.fromEntries(new URLSearchParams(body))

    return new Response(
      JSON.stringify({ oauth_token: parsed.oauth_token, oauth_token_secret: parsed.oauth_token_secret }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
