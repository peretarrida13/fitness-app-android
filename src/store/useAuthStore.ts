import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { isNative, ANDROID_REDIRECT_URI, WEB_REDIRECT_URI } from '@/lib/platform'

// Client-side rate limit for magic link: 5 per 15 min
const magicLinkAttempts: number[] = []
function checkMagicLinkRateLimit(): boolean {
  const now = Date.now()
  const cutoff = now - 15 * 60 * 1000
  while (magicLinkAttempts.length && magicLinkAttempts[0] < cutoff) magicLinkAttempts.shift()
  if (magicLinkAttempts.length >= 5) return false
  magicLinkAttempts.push(now)
  return true
}

const EMAIL_REGEX = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  init: () => () => void
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,

  init: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, user: session?.user ?? null, loading: false })
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, loading: false })
    })
    return () => subscription.unsubscribe()
  },

  signInWithMagicLink: async (email) => {
    if (!checkMagicLinkRateLimit()) {
      return { error: 'Too many attempts. Please wait 15 minutes.' }
    }
    const trimmed = email.trim().toLowerCase()
    if (!EMAIL_REGEX.test(trimmed) || trimmed.length > 254) {
      return { error: 'Invalid email address' }
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: isNative() ? ANDROID_REDIRECT_URI : WEB_REDIRECT_URI },
    })
    return { error: error?.message ?? null }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },
}))
