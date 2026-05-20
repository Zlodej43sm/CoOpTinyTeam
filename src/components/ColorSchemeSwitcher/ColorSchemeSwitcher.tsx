import type { CSSProperties } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/hooks/useTranslation'
import { useResolvedColorScheme } from '@/hooks/useResolvedColorScheme'
import type { ThemeUi } from '@/game/config/theme'
import { useThemeDefinition } from '@/hooks/useThemeDefinition'

export default function ColorSchemeSwitcher() {
  const phase = useGameStore((s) => s.phase)
  const preference = useGameStore((s) => s.colorSchemePreference)
  const setColorSchemePreference = useGameStore((s) => s.setColorSchemePreference)
  const resolvedScheme = useResolvedColorScheme()
  const { messages } = useTranslation()
  const { ui } = useThemeDefinition()

  const gameplayPhase = phase === 'playing' || phase === 'boss' || phase === 'kids-arcade'
  if (gameplayPhase) return null

  const options = [
    { value: 'system' as const, label: messages.colorScheme.auto },
    { value: 'light' as const, label: messages.colorScheme.light },
    { value: 'dark' as const, label: messages.colorScheme.dark },
  ]

  return (
    <div style={shellStyle(ui)} role="group" aria-label={messages.colorScheme.ariaLabel} data-no-global-tap="true">
      {options.map((option) => {
        const active = preference === option.value

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            title={
              option.value === 'system'
                ? `${messages.colorScheme.auto} (${resolvedScheme})`
                : option.label
            }
            onClick={() => setColorSchemePreference(option.value)}
            style={optionStyle(ui, active)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function shellStyle(ui: ThemeUi): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.2rem',
    padding: '0.18rem',
    borderRadius: 999,
    border: `1px solid ${ui.subtleBorder}`,
    background: alpha(ui.controlBg, 0.94),
    boxShadow: `0 8px 22px ${alpha('#000000', 0.16)}`,
    backdropFilter: 'blur(8px)',
  }
}

function optionStyle(
  ui: ThemeUi,
  active: boolean,
): CSSProperties {
  return {
    minHeight: 28,
    background: active ? alpha(ui.accent, 0.14) : 'transparent',
    border: `1px solid ${active ? ui.accent : 'transparent'}`,
    color: active ? ui.accent : ui.inactiveButtonColor,
    padding: '0.24rem 0.48rem',
    fontSize: '0.68rem',
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontWeight: 600,
    lineHeight: 1,
    cursor: 'pointer',
    letterSpacing: '0.01em',
    borderRadius: 999,
    whiteSpace: 'nowrap',
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
