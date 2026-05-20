import { useEffect, useRef } from 'react'
import { Game } from '@/game/Game'
import ScoreDisplay from '@/components/HUD/ScoreDisplay'
import LivesDisplay from '@/components/HUD/LivesDisplay'
import LevelBadge from '@/components/HUD/LevelBadge'
import GameControls from '@/components/HUD/GameControls'
import GameTapLayer from '@/components/GameTapLayer/GameTapLayer'
import { useThemeDefinition } from '@/hooks/useThemeDefinition'

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Game | null>(null)
  const themeDef = useThemeDefinition()

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const game = new Game()
    gameRef.current = game
    void game.init(el)

    return () => {
      game.destroy()
      gameRef.current = null
    }
  }, [])

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        touchAction: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      {/* Pixi canvas mounts here */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          touchAction: 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
      />

      <GameTapLayer onPointerTap={(clientX, clientY) => gameRef.current?.handlePointerTap(clientX, clientY)} />

      {/* React HUD overlay — above tap layer; controls stay clickable */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 18px',
          pointerEvents: 'none',
          background: themeDef.ui.hudGradient,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src="/assets/logo.mini.webp"
            alt="CoOp Tiny Team"
            style={{ width: 32, height: 32, objectFit: 'contain', filter: themeDef.ui.logoGlow }}
          />
          <LevelBadge />
        </div>
        <ScoreDisplay />
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', pointerEvents: 'auto' }}
          data-no-global-tap="true"
        >
          <LivesDisplay />
          <GameControls />
        </div>
      </div>
    </div>
  )
}
