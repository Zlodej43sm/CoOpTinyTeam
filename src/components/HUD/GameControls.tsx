import { useEffect, useState } from 'react'
import { LEVELS } from '@/game/config/levels'
import { getThemeDefinition } from '@/game/config/theme'
import { useGameStore } from '@/store/gameStore'
import { trackControlUsed, trackGameStarted, trackNavigationClick } from '@/analytics/events'
import { rem } from '@/ui/typography'

type GameControlsProps = {
  direction?: 'row' | 'column'
  size?: 'compact' | 'large'
  surface?: 'hud' | 'pause-overlay'
}

export default function GameControls({
  direction = 'row',
  size = 'compact',
  surface = 'hud',
}: GameControlsProps) {
  const [isFullscreen, setIsFullscreen] = useState(
    () => typeof document !== 'undefined' && Boolean(document.fullscreenElement),
  )
  const phase = useGameStore((s) => s.phase)
  const theme = useGameStore((s) => s.theme)
  const soundEnabled = useGameStore((s) => s.soundEnabled)
  const paused = useGameStore((s) => s.paused)
  const level = useGameStore((s) => s.level)
  const setLevel = useGameStore((s) => s.setLevel)
  const setSoundEnabled = useGameStore((s) => s.setSoundEnabled)
  const setPaused = useGameStore((s) => s.setPaused)
  const setPhase = useGameStore((s) => s.setPhase)
  const reset = useGameStore((s) => s.reset)
  const bumpRunId = useGameStore((s) => s.bumpRunId)
  const supportsFullscreen =
    typeof document !== 'undefined' &&
    typeof document.documentElement?.requestFullscreen === 'function'
  const { ui } = getThemeDefinition(theme)

  useEffect(() => {
    if (typeof document === 'undefined') return undefined

    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  function handleReplay(): void {
    trackControlUsed({ control: 'replay', source: surface })

    if (phase === 'kids-arcade') {
      reset()
      setLevel(1)
      setPaused(false)
      bumpRunId()
      trackGameStarted({ level: 1, mode: 'kids', entryPoint: `${surface}-replay` })
      setPhase('kids-arcade')
      return
    }

    const currentLevel = level
    const config = LEVELS[(currentLevel - 1) % LEVELS.length]

    reset()
    setLevel(currentLevel)
    setPaused(false)
    bumpRunId()
    trackGameStarted({ level: currentLevel, mode: 'coop', entryPoint: `${surface}-replay` })
    setPhase(config?.isBoss ? 'boss' : 'playing')
  }

  function handleExit(): void {
    trackControlUsed({ control: 'exit', source: surface })
    trackNavigationClick({ cta: 'exit', source: surface, targetPhase: 'menu' })
    setPaused(false)
    reset()
    setPhase('menu')
  }

  async function handleFullscreenToggle(): Promise<void> {
    if (!supportsFullscreen) return

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
        trackControlUsed({ control: 'fullscreen', source: surface, enabled: false })
      } else {
        await document.documentElement.requestFullscreen()
        trackControlUsed({ control: 'fullscreen', source: surface, enabled: true })
      }
    } catch {
      // ignore fullscreen failures triggered by browser policy
    }
  }

  const compact = size === 'compact'

  return (
    <div
      data-no-global-tap="true"
      style={{
        display: 'flex',
        flexDirection: direction,
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: compact ? '0.35rem' : '0.65rem',
      }}
    >
      <button
        type="button"
        data-no-global-tap="true"
        onClick={() => {
          const nextEnabled = !soundEnabled
          trackControlUsed({ control: 'sound', source: surface, enabled: nextEnabled })
          setSoundEnabled(nextEnabled)
        }}
        style={{
          ...buttonStyle(compact, ui),
          borderColor: soundEnabled ? ui.warning : ui.inactiveButtonBorder,
          color: soundEnabled ? '#fff0c2' : ui.inactiveButtonColor,
        }}
      >
        {soundEnabled ? 'SOUND ON' : 'SOUND OFF'}
      </button>
      {supportsFullscreen && (
        <button
          type="button"
          data-no-global-tap="true"
          onClick={() => {
            void handleFullscreenToggle()
          }}
          style={{ ...buttonStyle(compact, ui), borderColor: ui.warning, color: '#fff0c2' }}
        >
          {isFullscreen ? 'WINDOW' : 'FULLSCREEN'}
        </button>
      )}
      <button
        type="button"
        data-no-global-tap="true"
        onClick={() => {
          const nextPaused = !paused
          trackControlUsed({ control: 'pause', source: surface, enabled: nextPaused })
          setPaused(nextPaused)
        }}
        style={{ ...buttonStyle(compact, ui), borderColor: ui.secondary, color: '#d7eeff' }}
      >
        {paused ? 'RESUME' : 'PAUSE'}
      </button>
      <button
        type="button"
        data-no-global-tap="true"
        onClick={handleReplay}
        style={{ ...buttonStyle(compact, ui), borderColor: ui.accent, color: '#d7ffd0' }}
      >
        REPLAY
      </button>
      <button
        type="button"
        data-no-global-tap="true"
        onClick={handleExit}
        style={{ ...buttonStyle(compact, ui), borderColor: ui.danger, color: '#ffd8dc' }}
      >
        EXIT
      </button>
    </div>
  )
}

function buttonStyle(
  compact: boolean,
  ui: ReturnType<typeof getThemeDefinition>['ui'],
): React.CSSProperties {
  return {
    background: `linear-gradient(180deg, rgba(255,255,255,0.06) 0%, ${ui.controlBg} 100%)`,
    border: '2px solid',
    padding: compact ? '0.38rem 0.55rem' : '0.7rem 1rem',
    fontSize: compact ? rem(0.34) : rem(0.48),
    fontFamily: '"Press Start 2P", monospace',
    cursor: 'pointer',
    borderRadius: compact ? 12 : 16,
    letterSpacing: '0.08em',
    boxShadow: '0 10px 18px rgba(0, 0, 0, 0.22)',
  }
}
