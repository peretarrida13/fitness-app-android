import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GARMIN_ACCESS_TOKEN_URL = 'https://connectapi.garmin.com/oauth-service/oauth/access_token'

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
  const url = new URL(req.url)
  const oauthToken = url.searchParams.get('oauth_token')
  const oauthVerifier = url.searchParams.get('oauth_verifier')
  const state = url.searchParams.get('state') // base64-encoded user ID

  if (!oauthToken || !oauthVerifier || !state) {
    return new Response('Missing params', { status: 400 })
  }

  const userId = atob(state)
  const consumerKey = Deno.env.get('GARMIN_CONSUMER_KEY')!
  const consumerSecret = Deno.env.get('GARMIN_CONSUMER_SECRET')!
  const appUrl = Deno.env.get('APP_URL')!
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Exchange for access token
  const nonce = crypto.randomUUID().replace(/-/g, '')
  const timestamp = Math.floor(Date.now() / 1000).toString()

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: oauthToken,
    oauth_verifier: oauthVerifier,
    oauth_version: '1.0',
  }

  const sortedParams = Object.entries(oauthParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${pct(k)}=${pct(v)}`)
    .join('&')

  const baseString = `POST&${pct(GARMIN_ACCESS_TOKEN_URL)}&${pct(sortedParams)}`
  // Token secret unknown at this stage (not stored from request_token step — using empty)
  // In a production app, store the request token secret temporarily (e.g. in a short-lived DB row)
  const signingKey = `${pct(consumerSecret)}&`
  const signature = await hmacSha1(signingKey, baseString)

  const res = await fetch(GARMIN_ACCESS_TOKEN_URL, {
    method: 'POST',
    headers: { Authorization: buildOAuthHeader(oauthParams, signature) },
  })

  if (!res.ok) {
    return Response.redirect(`${appUrl}/calendar?garmin=error`, 302)
  }

  const body = await res.text()
  const parsed = Object.fromEntries(new URLSearchParams(body))
  const accessToken = parsed.oauth_token
  const tokenSecret = parsed.oauth_token_secret
  const garminUserId = parsed.userId ?? null

  // Store tokens in DB using service role key (bypasses RLS)
  const supabase = createClient(supabaseUrl, serviceRoleKey)
  await supabase.from('oauth_tokens').upsert({
    user_id: userId,
    provider: 'garmin',
    access_token: accessToken,
    token_secret: tokenSecret,
    garmin_user_id: garminUserId,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,provider' })

  return Response.redirect(`${appUrl}/calendar?garmin=connected`, 302)
})
