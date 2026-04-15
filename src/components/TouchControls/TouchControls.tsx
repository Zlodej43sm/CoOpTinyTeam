import { useEffect, useRef, useState } from 'react'
import { TOUCH_CONTROLS_BOTTOM } from '@/game/config/layout'
import { useGameStore } from '@/store/gameStore'
import { rem } from '@/ui/typography'

function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // Vibration API not supported — silently ignore
  }
}

export default function TouchControls() {
  const activeChar = useGameStore((s) => s.activeChar)
  const [enabled, setEnabled] = useState(false)
  const [pressed, setPressed] = useState(false)
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches
    setEnabled(window.navigator.maxTouchPoints > 0 || coarsePointer)
  }, [])

  if (!enabled) return null

  function dispatchExactMatch(): void {
    if (!activeChar) return
    window.dispatchEvent(new CustomEvent<string>('vkey', { detail: activeChar }))
  }

  function handlePointerDown(e: React.PointerEvent) {
    e.preventDefault()
    if (!activeChar) {
      vibrate(40) // short buzz — nothing to match
      return
    }
    setPressed(true)
    vibrate(18) // crisp tap confirmation
    dispatchExactMatch()
    pressTimer.current = setTimeout(() => setPressed(false), 120)
  }

  function handlePointerUp() {
    setPressed(false)
    if (pressTimer.current) clearTimeout(pressTimer.current)
  }

  return (
    <div data-no-global-tap="true" style={wrapperStyle}>
      <div style={{ fontSize: rem(0.34), color: '#d6ecff' }}>Tap screen for +10</div>
      <button
        type="button"
        data-no-global-tap="true"
        disabled={!activeChar}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          ...buttonStyle,
          opacity: activeChar ? 1 : 0.45,
          transform: pressed ? 'scale(0.94)' : 'scale(1)',
          boxShadow: pressed
            ? '0 4px 10px rgba(86, 156, 214, 0.18)'
            : '0 10px 22px rgba(86, 156, 214, 0.28)',
          background: pressed
            ? 'linear-gradient(180deg, #253548 0%, #0b1118 100%)'
            : 'linear-gradient(180deg, #1a2632 0%, #0b1118 100%)',
          transition: 'transform 0.08s ease, box-shadow 0.08s ease, background 0.08s ease',
        }}
      >
        {activeChar ? `MATCH ${activeChar}` : 'WAIT...'}
      </button>
    </div>
  )
}

const wrapperStyle: React.CSSProperties = {
  position: 'absolute',
  left: '50%',
  bottom: TOUCH_CONTROLS_BOTTOM,
  transform: 'translateX(-50%)',
  zIndex: 16,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.45rem',
  padding: '0.7rem 0.9rem',
  borderRadius: 18,
  background: 'linear-gradient(180deg, rgba(64, 124, 255, 0.22) 0%, rgba(11, 19, 33, 0.88) 100%)',
  border: '2px solid rgba(109, 220, 255, 0.36)',
  boxShadow: '0 12px 28px rgba(0, 0, 0, 0.35)',
  pointerEvents: 'auto',
  fontFamily: '"Press Start 2P", monospace',
}

const buttonStyle: React.CSSProperties = {
  minWidth: 132,
  background: 'linear-gradient(180deg, #1a2632 0%, #0b1118 100%)',
  border: '2px solid #569cd6',
  color: '#dff3ff',
  padding: '0.75rem 1rem',
  fontSize: rem(0.42),
  fontFamily: '"Press Start 2P", monospace',
  cursor: 'pointer',
  borderRadius: 16,
  boxShadow: '0 10px 22px rgba(86, 156, 214, 0.28)',
}
