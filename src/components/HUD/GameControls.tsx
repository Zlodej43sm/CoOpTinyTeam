import { useEffect, useState } from 'react'
import { LEVELS } from '@/game/config/levels'
import type { ThemeUi } from '@/game/config/theme'
import { useGameStore } from '@/store/gameStore'
import { trackControlUsed, trackGameStarted, trackNavigationClick } from '@/analytics/events'
import { useThemeDefinition } from '@/hooks/useThemeDefinition'
import { useResolvedColorScheme } from '@/hooks/useResolvedColorScheme'
import { getControlButtonTextColor } from '@/game/config/theme'
import { isCoarsePointerDevice } from '@/game/utils/touch'
import { useTranslation } from '@/hooks/useTranslation'
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
  const { ui } = useThemeDefinition()
  const colorScheme = useResolvedColorScheme()
  const { messages } = useTranslation()
  const c = messages.common
  const ctrl = messages.controls
  const touchFriendly = isCoarsePointerDevice()

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
          ...buttonStyle(compact, ui, touchFriendly),
          borderColor: soundEnabled ? ui.warning : ui.inactiveButtonBorder,
          color: soundEnabled
            ? getControlButtonTextColor(ui, colorScheme, 'warning')
            : ui.inactiveButtonColor,
        }}
      >
        {soundEnabled ? ctrl.soundOn : ctrl.soundOff}
      </button>
      {supportsFullscreen && (
        <button
          type="button"
          data-no-global-tap="true"
          onClick={() => {
            void handleFullscreenToggle()
          }}
          style={{
            ...buttonStyle(compact, ui, touchFriendly),
            borderColor: ui.warning,
            color: getControlButtonTextColor(ui, colorScheme, 'warning'),
          }}
        >
          {isFullscreen ? ctrl.windowed : ctrl.fullscreen}
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
        style={{
          ...buttonStyle(compact, ui, touchFriendly),
          borderColor: ui.secondary,
          color: getControlButtonTextColor(ui, colorScheme, 'secondary'),
        }}
      >
        {paused ? ctrl.resume : ctrl.pause}
      </button>
      <button
        type="button"
        data-no-global-tap="true"
        onClick={handleReplay}
        style={{
          ...buttonStyle(compact, ui, touchFriendly),
          borderColor: ui.accent,
          color: getControlButtonTextColor(ui, colorScheme, 'accent'),
        }}
      >
        {c.replay}
      </button>
      <button
        type="button"
        data-no-global-tap="true"
        onClick={handleExit}
        style={{
          ...buttonStyle(compact, ui, touchFriendly),
          borderColor: ui.danger,
          color: getControlButtonTextColor(ui, colorScheme, 'danger'),
        }}
      >
        {c.exit}
      </button>
    </div>
  )
}

function buttonStyle(
  compact: boolean,
  ui: ThemeUi,
  touchFriendly: boolean,
): React.CSSProperties {
  const minTouch = touchFriendly ? 44 : undefined

  return {
    background: `linear-gradient(180deg, rgba(255,255,255,0.06) 0%, ${ui.controlBg} 100%)`,
    border: '2px solid',
    padding: compact ? '0.38rem 0.55rem' : '0.7rem 1rem',
    minHeight: minTouch,
    minWidth: minTouch,
    fontSize: compact ? rem(0.34) : rem(0.48),
    fontFamily: '"Press Start 2P", monospace',
    cursor: 'pointer',
    borderRadius: compact ? 12 : 16,
    letterSpacing: '0.08em',
    boxShadow: '0 10px 18px rgba(0, 0, 0, 0.22)',
  }
}
