import { useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'
import { getThemeDefinition } from '@/game/config/theme'
import { useResolvedColorScheme } from '@/hooks/useResolvedColorScheme'

export function useThemeDefinition() {
  const theme = useGameStore((s) => s.theme)
  const locale = useGameStore((s) => s.locale)
  const colorScheme = useResolvedColorScheme()

  return useMemo(
    () => getThemeDefinition(theme, colorScheme),
    [theme, colorScheme, locale],
  )
}
