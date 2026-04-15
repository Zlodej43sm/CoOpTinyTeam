import { getThemeDefinition } from '@/game/config/theme'
import { useGameStore } from '@/store/gameStore'

export default function LivesDisplay() {
  const phase = useGameStore((s) => s.phase)
  const lives = useGameStore((s) => s.lives)
  const theme = useGameStore((s) => s.theme)

  if (phase === 'kids-arcade') return null

  const themeDef = getThemeDefinition(theme)

  return (
    <div
      style={{
        color: themeDef.ui.livesColor,
        fontSize: '0.95rem',
        fontFamily: '"Press Start 2P", monospace',
        textShadow: themeDef.ui.livesShadow,
        letterSpacing: '0.15em',
        lineHeight: 1,
        padding: '0.2rem 0.35rem',
        background: themeDef.ui.livesBackground,
        border: `2px solid ${themeDef.ui.livesBorder}`,
        borderRadius: 10,
      }}
    >
      {themeDef.livesGlyph.repeat(Math.max(0, lives))}
    </div>
  )
}
