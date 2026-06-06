import { Capacitor } from '@capacitor/core'

export const isNative = () => Capacitor.isNativePlatform()
export const APP_SCHEME = 'com.peretarrida.fittracker'
export const ANDROID_REDIRECT_URI = 'https://pere-meal-prep.netlify.app/auth/callback'
export const WEB_REDIRECT_URI = typeof window !== 'undefined' ? window.location.origin : ''
