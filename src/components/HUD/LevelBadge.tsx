import { getLevelDisplayName, getThemeDefinition } from '@/game/config/theme'
import { useGameStore } from '@/store/gameStore'
import { LEVELS } from '@/game/config/levels'

const style: React.CSSProperties = {
  fontSize: '0.4rem',
  fontFamily: '"Press Start 2P", monospace',
  opacity: 0.85,
}

export default function LevelBadge() {
  const phase = useGameStore((s) => s.phase)
  const level = useGameStore((s) => s.level)
  const theme = useGameStore((s) => s.theme)
  const config = LEVELS[(level - 1) % LEVELS.length]
  const isKidsArcade = phase === 'kids-arcade'
  const themeDef = getThemeDefinition(theme)

  return (
    <div
      style={{
        ...style,
        color: isKidsArcade ? themeDef.ui.warning : themeDef.ui.badge,
        textShadow: isKidsArcade ? `0 0 10px ${themeDef.ui.warning}77` : themeDef.ui.badgeShadow,
      }}
    >
      {isKidsArcade
        ? themeDef.copy.kidsModeLabel
        : getLevelDisplayName(theme, config?.id ?? level)}
    </div>
  )
}
