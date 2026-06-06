import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App as CapApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import './index.css'
import App from './App'

if (Capacitor.isNativePlatform()) {
  CapApp.addListener('appUrlOpen', async ({ url }: { url: string }) => {
    if (!url.startsWith('com.peretarrida.fittracker://')) return

    const parsed = new URL(url)
    const hashParams = new URLSearchParams(parsed.hash.slice(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')

    if (accessToken && refreshToken) {
      const { supabase } = await import('@/lib/supabase')
      await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
    }
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
