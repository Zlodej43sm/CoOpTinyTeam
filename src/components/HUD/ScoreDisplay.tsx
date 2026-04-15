import { getThemeDefinition } from '@/game/config/theme'
import { useGameStore } from '@/store/gameStore'
import { rem } from '@/ui/typography'

export default function ScoreDisplay() {
  const score = useGameStore((s) => s.score)
  const theme = useGameStore((s) => s.theme)
  const themeDef = getThemeDefinition(theme)

  return (
    <div
      style={{
        color: themeDef.ui.score,
        fontSize: rem(0.55),
        fontFamily: '"Press Start 2P", monospace',
        letterSpacing: '0.05em',
        textShadow: themeDef.ui.scoreShadow,
        padding: '0.38rem 0.72rem',
        background: `linear-gradient(180deg, rgba(255,255,255,0.08) 0%, ${themeDef.ui.controlBg} 100%)`,
        border: `2px solid ${themeDef.ui.accent}44`,
        borderRadius: 999,
        boxShadow: '0 10px 22px rgba(0, 0, 0, 0.18)',
      }}
    >
      {score.toString().padStart(7, '0')}
    </div>
  )
}
