import type { AppLocale } from '@/i18n/types'
import { APP_LOCALES } from '@/i18n'

const LOCALE_KEY = 'coop-tiny-team-locale'

const BROWSER_LOCALE_MAP: Record<string, AppLocale> = {
  en: 'en',
  es: 'es',
  de: 'de',
  fr: 'fr',
  zh: 'zh',
  uk: 'uk',
  ua: 'uk',
  ru: 'ru',
  id: 'id',
}

export function resolveBrowserLocale(): AppLocale {
  if (typeof window === 'undefined') return 'en'

  const candidates = [
    ...navigator.languages,
    navigator.language,
  ].filter(Boolean)

  for (const tag of candidates) {
    const normalized = tag.toLowerCase()
    const direct = BROWSER_LOCALE_MAP[normalized]
    if (direct) return direct

    const base = normalized.split('-')[0]
    const mapped = BROWSER_LOCALE_MAP[base ?? '']
    if (mapped) return mapped
  }

  return 'en'
}

export function getStoredLocale(): AppLocale {
  if (typeof window === 'undefined') return 'en'

  try {
    const stored = window.localStorage.getItem(LOCALE_KEY)
    if (stored && (APP_LOCALES as readonly string[]).includes(stored)) {
      return stored as AppLocale
    }
  } catch {
    // ignore storage failures
  }

  return resolveBrowserLocale()
}

export function saveLocale(locale: AppLocale): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(LOCALE_KEY, locale)
  } catch {
    // ignore storage failures
  }
}

export function isAppLocale(value: string): value is AppLocale {
  return (APP_LOCALES as readonly string[]).includes(value)
}
