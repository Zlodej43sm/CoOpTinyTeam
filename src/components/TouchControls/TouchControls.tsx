import { useEffect, useState } from 'react'
import { TOUCH_CONTROLS_BOTTOM } from '@/game/config/layout'
import { useGameStore } from '@/store/gameStore'

export default function TouchControls() {
  const activeChar = useGameStore((s) => s.activeChar)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches
    setEnabled(window.navigator.maxTouchPoints > 0 || coarsePointer)
  }, [])

  if (!enabled) return null

  function dispatchExactMatch(): void {
    if (!activeChar) return
    window.dispatchEvent(new CustomEvent<string>('vkey', { detail: activeChar }))
  }

  return (
    <div data-no-global-tap="true" style={wrapperStyle}>
      <div style={{ fontSize: '0.34rem', color: '#7f8fa6' }}>Tap screen for +10</div>
      <button
        type="button"
        data-no-global-tap="true"
        disabled={!activeChar}
        onPointerDown={(e) => {
          e.preventDefault()
          dispatchExactMatch()
        }}
        style={{
          ...buttonStyle,
          opacity: activeChar ? 1 : 0.45,
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
  padding: '0.55rem 0.7rem',
  borderRadius: 12,
  background: 'rgba(6, 12, 18, 0.78)',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
  pointerEvents: 'auto',
  fontFamily: '"Press Start 2P", monospace',
}

const buttonStyle: React.CSSProperties = {
  minWidth: 132,
  background: 'linear-gradient(180deg, #1a2632 0%, #0b1118 100%)',
  border: '2px solid #569cd6',
  color: '#dff3ff',
  padding: '0.75rem 1rem',
  fontSize: '0.42rem',
  fontFamily: '"Press Start 2P", monospace',
  cursor: 'pointer',
  boxShadow: '0 0 14px rgba(86, 156, 214, 0.24)',
}
