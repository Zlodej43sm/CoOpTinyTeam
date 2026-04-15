import { useEffect, useRef } from 'react'
import { Game } from '@/game/Game'
import { getThemeDefinition } from '@/game/config/theme'
import ScoreDisplay from '@/components/HUD/ScoreDisplay'
import LivesDisplay from '@/components/HUD/LivesDisplay'
import LevelBadge from '@/components/HUD/LevelBadge'
import GameControls from '@/components/HUD/GameControls'
import { useGameStore } from '@/store/gameStore'

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Game | null>(null)
  const theme = useGameStore((s) => s.theme)
  const themeDef = getThemeDefinition(theme)

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
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Pixi canvas mounts here */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* React HUD overlay — pointer-events none so clicks pass through to canvas */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', pointerEvents: 'auto' }}>
          <LivesDisplay />
          <GameControls />
        </div>
      </div>
    </div>
  )
}
