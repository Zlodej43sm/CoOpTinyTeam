import type { AppLocale, Messages } from '@/i18n/types'
import { de } from '@/i18n/messages/de'
import { en } from '@/i18n/messages/en'
import { es } from '@/i18n/messages/es'
import { fr } from '@/i18n/messages/fr'
import { id } from '@/i18n/messages/id'
import { ru } from '@/i18n/messages/ru'
import { uk } from '@/i18n/messages/uk'
import { zh } from '@/i18n/messages/zh'

const MESSAGES: Record<AppLocale, Messages> = {
  en,
  es,
  de,
  fr,
  zh,
  uk,
  ru,
  id,
}

export const APP_LOCALES = Object.keys(MESSAGES) as AppLocale[]

export function getMessages(locale: AppLocale): Messages {
  return MESSAGES[locale] ?? en
}

export function formatMessage(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`))
}
