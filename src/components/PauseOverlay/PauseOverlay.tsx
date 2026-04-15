import { getThemeDefinition } from '@/game/config/theme'
import { useGameStore } from '@/store/gameStore'
import GameControls from '@/components/HUD/GameControls'
import { rem } from '@/ui/typography'

export default function PauseOverlay() {
  const theme = useGameStore((s) => s.theme)
  const themeDef = getThemeDefinition(theme)

  return (
    <div style={overlayStyle}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          padding: '1.8rem 2rem',
          borderRadius: 28,
          border: `2px solid ${themeDef.ui.panelBorder}`,
          background: `linear-gradient(180deg, rgba(255,255,255,0.05) 0%, ${themeDef.ui.controlBg} 100%)`,
          boxShadow: themeDef.ui.panelShadow,
        }}
      >
        <div style={{ fontSize: rem(1), color: themeDef.ui.accent, textShadow: `0 0 18px ${themeDef.ui.accent}` }}>
          {themeDef.copy.pauseTitle}
        </div>
        <div style={{ fontSize: rem(0.42), color: themeDef.ui.muted, lineHeight: 1.8, textAlign: 'center' }}>
          {themeDef.copy.pauseHint}
        </div>
        <GameControls direction="column" size="large" surface="pause-overlay" />
      </div>
    </div>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 30,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'radial-gradient(circle at center, rgba(24, 44, 68, 0.42) 0%, rgba(0, 0, 0, 0.86) 62%)',
  fontFamily: '"Press Start 2P", monospace',
}
