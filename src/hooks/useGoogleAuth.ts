import { Browser } from '@capacitor/browser'
import { App as CapApp } from '@capacitor/app'
import { useCallback } from 'react'

const GOOGLE_NONCE_KEY = 'jarvis-google-oauth-nonce'
const APP_DEEP_LINK = 'com.peretarrida.fittracker://oauth/google'

function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export function useGoogleAuthAndroid(onToken: (token: string) => void) {
  return useCallback(async () => {
    const redirectUri = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-oauth-callback`
    // Web client — has the Supabase redirect URI registered in Google Cloud Console
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

    // CSRF nonce stored in localStorage (survives app backgrounding)
    const nonce = crypto.randomUUID()
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = await generateCodeChallenge(codeVerifier)
    localStorage.setItem(GOOGLE_NONCE_KEY, nonce)

    // Embed the codeVerifier in state so the Edge Function can do the
    // PKCE token exchange server-side (avoids needing client_secret in the app)
    const state = btoa(JSON.stringify({ nonce, codeVerifier }))

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar.events.readonly',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      access_type: 'online',
    })

    // Listen for the deep link the Edge Function returns after exchanging the code
    const listener = await CapApp.addListener('appUrlOpen', ({ url }: { url: string }) => {
      listener.remove()
      if (!url.startsWith(APP_DEEP_LINK)) return

      const urlObj = new URL(url)
      const accessToken = urlObj.searchParams.get('access_token')
      const returnedNonce = urlObj.searchParams.get('nonce')
      const savedNonce = localStorage.getItem(GOOGLE_NONCE_KEY)
      localStorage.removeItem(GOOGLE_NONCE_KEY)

      if (returnedNonce !== savedNonce || !accessToken) return
      onToken(accessToken)
    })

    await Browser.open({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` })
  }, [onToken])
}
