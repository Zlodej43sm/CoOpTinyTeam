import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { LEVELS } from '@/game/config/levels'
import { getLevelDisplayName, getThemeDefinition } from '@/game/config/theme'
import { rem } from '@/ui/typography'

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
        background: 'radial-gradient(circle at center, rgba(109, 220, 255, 0.14) 0%, rgba(0, 0, 0, 0.88) 62%)',
        zIndex: 20,
        fontFamily: '"Press Start 2P", monospace',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          padding: '2rem 2.2rem',
          borderRadius: 28,
          border: `2px solid ${themeDef.ui.panelBorder}`,
          background: `linear-gradient(180deg, rgba(255,255,255,0.06) 0%, ${themeDef.ui.controlBg} 100%)`,
          boxShadow: themeDef.ui.panelShadow,
        }}
      >
        <div style={{ fontSize: rem(1.1), color: themeDef.ui.accent, textShadow: `0 0 20px ${themeDef.ui.accent}` }}>
          {themeDef.copy.levelCompleteTitle}
        </div>
        <div style={{ fontSize: rem(0.55), color: themeDef.ui.secondary }}>
          {getLevelDisplayName(theme, level)}
        </div>
        <div style={{ fontSize: rem(0.45), color: themeDef.ui.muted, marginTop: '0.5rem' }}>
          {config?.isBoss ? themeDef.copy.levelCompleteBossLoading : themeDef.copy.levelCompleteNextLoading}
        </div>
      </div>
    </div>
  )
}
