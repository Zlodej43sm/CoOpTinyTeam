import type { ColorScheme, ColorSchemePreference } from '@/types'

const COLOR_SCHEME_KEY = 'coop-tiny-team-color-scheme'
const LEGACY_WISHLIST_COLOR_SCHEME_KEY = 'coop-tiny-team-wishlist-color-scheme'

export function getSystemColorScheme(): ColorScheme {
  if (typeof window === 'undefined') return 'dark'

  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'dark'
  }
}

export function getStoredColorSchemePreference(): ColorSchemePreference {
  if (typeof window === 'undefined') return 'system'

  try {
    const stored = window.localStorage.getItem(COLOR_SCHEME_KEY)
    if (stored === 'dark' || stored === 'light' || stored === 'system') {
      return stored
    }

    const legacy = window.localStorage.getItem(LEGACY_WISHLIST_COLOR_SCHEME_KEY)
    if (legacy === 'dark' || legacy === 'light' || legacy === 'system') {
      return legacy
    }
  } catch {
    // ignore storage failures and fall back to system preference
  }

  return 'system'
}

export function saveColorSchemePreference(preference: ColorSchemePreference): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(COLOR_SCHEME_KEY, preference)
  } catch {
    // ignore storage failures and keep the in-memory value
  }
}

export function resolveColorScheme(
  preference: ColorSchemePreference,
  systemScheme: ColorScheme = getSystemColorScheme(),
): ColorScheme {
  return preference === 'system' ? systemScheme : preference
}

export const COLOR_SCHEME_OPTIONS: ReadonlyArray<{
  value: ColorSchemePreference
  label: string
}> = [
  { value: 'system', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]
