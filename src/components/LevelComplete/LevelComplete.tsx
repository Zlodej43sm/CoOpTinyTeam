import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { LEVELS } from '@/game/config/levels'
import { getLevelDisplayName, getThemeDefinition } from '@/game/config/theme'

export default function LevelComplete() {
  const level = useGameStore((s) => s.level)
  const theme = useGameStore((s) => s.theme)
  const setPhase = useGameStore((s) => s.setPhase)
  const config = LEVELS[(level - 1) % LEVELS.length]
  const themeDef = getThemeDefinition(theme)

  useEffect(() => {
    const nextPhase = config?.isBoss ? 'boss' : 'playing'
    const t = setTimeout(() => setPhase(nextPhase), 2200)
    return () => clearTimeout(t)
  }, [config, setPhase])

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.82)',
        zIndex: 20,
        gap: '1.2rem',
        fontFamily: '"Press Start 2P", monospace',
      }}
    >
      <div style={{ fontSize: '1.1rem', color: themeDef.ui.accent, textShadow: `0 0 20px ${themeDef.ui.accent}` }}>
        {themeDef.copy.levelCompleteTitle}
      </div>
      <div style={{ fontSize: '0.55rem', color: themeDef.ui.secondary }}>
        {getLevelDisplayName(theme, level)}
      </div>
      <div style={{ fontSize: '0.45rem', color: themeDef.ui.muted, marginTop: '0.5rem' }}>
        {config?.isBoss ? themeDef.copy.levelCompleteBossLoading : themeDef.copy.levelCompleteNextLoading}
      </div>
    </div>
  )
}
