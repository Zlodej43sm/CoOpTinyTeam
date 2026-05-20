import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { getSystemColorScheme, resolveColorScheme } from '@/services/colorScheme'
import type { ColorScheme } from '@/types'

export function useResolvedColorScheme(): ColorScheme {
  const preference = useGameStore((s) => s.colorSchemePreference)
  const [systemScheme, setSystemScheme] = useState<ColorScheme>(() => getSystemColorScheme())

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => setSystemScheme(media.matches ? 'dark' : 'light')

    handleChange()
    media.addEventListener('change', handleChange)

    return () => {
      media.removeEventListener('change', handleChange)
    }
  }, [])

  return resolveColorScheme(preference, systemScheme)
}
