import { getLevelDisplayName, getThemeDefinition } from '@/game/config/theme'
import { useGameStore } from '@/store/gameStore'
import { LEVELS } from '@/game/config/levels'
import { rem } from '@/ui/typography'

const style: React.CSSProperties = {
  fontSize: rem(0.4),
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
        padding: '0.4rem 0.72rem',
        borderRadius: 999,
        border: `2px solid ${isKidsArcade ? `${themeDef.ui.warning}55` : `${themeDef.ui.secondary}44`}`,
        background: `linear-gradient(180deg, rgba(255,255,255,0.07) 0%, ${themeDef.ui.controlBg} 100%)`,
        boxShadow: '0 8px 18px rgba(0, 0, 0, 0.16)',
      }}
    >
      {isKidsArcade
        ? themeDef.copy.kidsModeLabel
        : getLevelDisplayName(theme, config?.id ?? level)}
    </div>
  )
}
