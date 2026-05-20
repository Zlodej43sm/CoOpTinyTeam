import { getMessages, formatMessage } from '@/i18n'
import type { AppLocale, Messages } from '@/i18n/types'
import { useGameStore } from '@/store/gameStore'

export function useTranslation() {
  const locale = useGameStore((state) => state.locale)
  const setLocale = useGameStore((state) => state.setLocale)
  const messages = getMessages(locale)

  function t(template: string, values?: Record<string, string | number>): string {
    if (!values) return template
    return formatMessage(template, values)
  }

  return {
    locale,
    setLocale,
    messages,
    t,
  } satisfies {
    locale: AppLocale
    setLocale: (locale: AppLocale) => void
    messages: Messages
    t: (template: string, values?: Record<string, string | number>) => string
  }
}

export function getCurrentMessages(): Messages {
  return getMessages(useGameStore.getState().locale)
}
