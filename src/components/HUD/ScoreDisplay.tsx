import { getThemeDefinition } from '@/game/config/theme'
import { useGameStore } from '@/store/gameStore'

export default function ScoreDisplay() {
  const score = useGameStore((s) => s.score)
  const theme = useGameStore((s) => s.theme)
  const themeDef = getThemeDefinition(theme)

  return (
    <div
      style={{
        color: themeDef.ui.score,
        fontSize: '0.55rem',
        fontFamily: '"Press Start 2P", monospace',
        letterSpacing: '0.05em',
        textShadow: themeDef.ui.scoreShadow,
      }}
    >
      {score.toString().padStart(7, '0')}
    </div>
  )
}
