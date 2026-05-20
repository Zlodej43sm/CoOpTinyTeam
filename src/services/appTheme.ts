import { getThemeDefinition } from '@/game/config/theme'
import { resolveColorScheme } from '@/services/colorScheme'
import { useGameStore } from '@/store/gameStore'
import type { GameTheme } from '@/types'

export function getAppThemeDefinition(theme?: GameTheme) {
  const state = useGameStore.getState()
  const resolvedTheme = theme ?? state.theme

  return getThemeDefinition(
    resolvedTheme,
    resolveColorScheme(state.colorSchemePreference),
  )
}
