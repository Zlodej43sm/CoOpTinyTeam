import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { useGameStore } from '@/store/gameStore'
import { isCoarsePointerDevice } from '@/game/utils/touch'

type GameTapLayerProps = {
  onPointerTap?: (clientX: number, clientY: number) => void
}

const TAP_DEBOUNCE_MS = 120

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false

  return Boolean(
    target.closest('[data-no-global-tap="true"]') ||
    target.closest('button, a, input, textarea, select, label'),
  )
}

export default function GameTapLayer({ onPointerTap }: GameTapLayerProps) {
  const phase = useGameStore((s) => s.phase)
  const paused = useGameStore((s) => s.paused)
  const layerRef = useRef<HTMLDivElement>(null)
  const lastTapRef = useRef<{ x: number; y: number; at: number } | null>(null)

  const gameplayPhase = phase === 'playing' || phase === 'boss' || phase === 'kids-arcade'
  const coarsePointer = isCoarsePointerDevice()

  useEffect(() => {
    const layer = layerRef.current
    if (!layer || !onPointerTap || !gameplayPhase || paused) return undefined

    const supportsPointer = typeof window !== 'undefined' && 'PointerEvent' in window
    if (supportsPointer) return undefined

    const onTouchEnd = (event: TouchEvent) => {
      if (event.changedTouches.length !== 1) return

      const touch = event.changedTouches[0]
      if (!touch) return

      const target = document.elementFromPoint(touch.clientX, touch.clientY)
      if (isInteractiveTarget(target)) return

      event.preventDefault()

      const now = Date.now()
      const lastTap = lastTapRef.current
      if (
        lastTap &&
        now - lastTap.at < TAP_DEBOUNCE_MS &&
        Math.hypot(touch.clientX - lastTap.x, touch.clientY - lastTap.y) < 12
      ) {
        return
      }

      lastTapRef.current = { x: touch.clientX, y: touch.clientY, at: now }
      onPointerTap(touch.clientX, touch.clientY)
    }

    layer.addEventListener('touchend', onTouchEnd, { passive: false })

    return () => {
      layer.removeEventListener('touchend', onTouchEnd)
    }
  }, [gameplayPhase, onPointerTap, paused])

  if (!gameplayPhase || paused || !onPointerTap) return null

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (isInteractiveTarget(event.target)) return

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)

    const now = Date.now()
    const lastTap = lastTapRef.current
    if (
      lastTap &&
      now - lastTap.at < TAP_DEBOUNCE_MS &&
      Math.hypot(event.clientX - lastTap.x, event.clientY - lastTap.y) < 12
    ) {
      return
    }

    lastTapRef.current = { x: event.clientX, y: event.clientY, at: now }
    onPointerTap?.(event.clientX, event.clientY)
  }

  return (
    <div
      ref={layerRef}
      aria-hidden="true"
      onPointerDown={handlePointerDown}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 8,
        touchAction: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        cursor: coarsePointer ? 'default' : 'pointer',
      }}
    />
  )
}
