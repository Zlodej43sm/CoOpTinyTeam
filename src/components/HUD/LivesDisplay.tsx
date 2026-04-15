import { getThemeDefinition } from '@/game/config/theme'
import { useGameStore } from '@/store/gameStore'
import { rem } from '@/ui/typography'

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
        fontSize: rem(0.95),
        fontFamily: '"Press Start 2P", monospace',
        textShadow: themeDef.ui.livesShadow,
        letterSpacing: '0.15em',
        lineHeight: 1,
        padding: '0.26rem 0.42rem',
        background: themeDef.ui.livesBackground,
        border: `2px solid ${themeDef.ui.livesBorder}`,
        borderRadius: 14,
        boxShadow: '0 10px 22px rgba(0, 0, 0, 0.2)',
      }}
    >
      {themeDef.livesGlyph.repeat(Math.max(0, lives))}
    </div>
  )
}
