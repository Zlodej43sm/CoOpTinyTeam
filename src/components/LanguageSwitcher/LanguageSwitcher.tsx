import type { CSSProperties } from 'react'
import { APP_LOCALES } from '@/i18n'
import type { AppLocale } from '@/i18n/types'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/hooks/useTranslation'
import type { ThemeUi } from '@/game/config/theme'
import { useThemeDefinition } from '@/hooks/useThemeDefinition'

export default function LanguageSwitcher() {
  const phase = useGameStore((s) => s.phase)
  const locale = useGameStore((s) => s.locale)
  const setLocale = useGameStore((s) => s.setLocale)
  const { messages } = useTranslation()
  const { ui } = useThemeDefinition()

  const gameplayPhase = phase === 'playing' || phase === 'boss' || phase === 'kids-arcade'
  if (gameplayPhase) return null

  return (
    <label style={shellStyle(ui)} data-no-global-tap="true">
      <span style={labelStyle(ui)}>{messages.language.ariaLabel}</span>
      <select
        aria-label={messages.language.ariaLabel}
        value={locale}
        onChange={(event) => setLocale(event.target.value as AppLocale)}
        style={selectStyle(ui)}
      >
        {APP_LOCALES.map((code) => (
          <option key={code} value={code}>
            {messages.localeNames[code]}
          </option>
        ))}
      </select>
    </label>
  )
}

function shellStyle(ui: ThemeUi): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.18rem 0.42rem',
    borderRadius: 999,
    border: `1px solid ${ui.subtleBorder}`,
    background: alpha(ui.controlBg, 0.94),
    boxShadow: `0 8px 22px ${alpha('#000000', 0.16)}`,
    backdropFilter: 'blur(8px)',
  }
}

function labelStyle(ui: ThemeUi): CSSProperties {
  return {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0,
    color: ui.muted,
  }
}

function selectStyle(ui: ThemeUi): CSSProperties {
  return {
    minHeight: 28,
    background: 'transparent',
    border: 'none',
    color: ui.text,
    padding: '0.18rem 0.1rem',
    fontSize: '0.68rem',
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontWeight: 600,
    cursor: 'pointer',
    outline: 'none',
  }
}

function alpha(color: string, opacity: number): string {
  if (color.startsWith('rgba(') || color.startsWith('rgb(')) {
    const parts = color.match(/[\d.]+/g)
    if (parts && parts.length >= 3) {
      const [red, green, blue] = parts
      return `rgba(${red}, ${green}, ${blue}, ${opacity})`
    }
  }

  const normalized = color.replace('#', '')
  const step = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized
  const red = parseInt(step.slice(0, 2), 16)
  const green = parseInt(step.slice(2, 4), 16)
  const blue = parseInt(step.slice(4, 6), 16)
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`
}
