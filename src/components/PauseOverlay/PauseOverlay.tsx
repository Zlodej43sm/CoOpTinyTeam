import { getThemeDefinition } from '@/game/config/theme'
import { useGameStore } from '@/store/gameStore'
import GameControls from '@/components/HUD/GameControls'

export default function PauseOverlay() {
  const theme = useGameStore((s) => s.theme)
  const themeDef = getThemeDefinition(theme)

  return (
    <div style={overlayStyle}>
      <div style={{ fontSize: '1rem', color: themeDef.ui.accent, textShadow: `0 0 18px ${themeDef.ui.accent}` }}>
        {themeDef.copy.pauseTitle}
      </div>
      <div style={{ fontSize: '0.42rem', color: themeDef.ui.muted, lineHeight: 1.8, textAlign: 'center' }}>
        {themeDef.copy.pauseHint}
      </div>
      <GameControls direction="column" size="large" />
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
  gap: '1rem',
  background: 'rgba(0, 0, 0, 0.8)',
  fontFamily: '"Press Start 2P", monospace',
}
