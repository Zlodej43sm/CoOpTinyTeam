import { useEffect, useState } from 'react'
import { TOUCH_CONTROLS_BOTTOM } from '@/game/config/layout'
import { useGameStore } from '@/store/gameStore'
import { useThemeDefinition } from '@/hooks/useThemeDefinition'
import { useTranslation } from '@/hooks/useTranslation'
import { rem } from '@/ui/typography'

function isTouchPreferredDevice(): boolean {
  if (typeof window === 'undefined') return false

  return window.matchMedia('(pointer: coarse)').matches || window.navigator.maxTouchPoints > 0
}

export default function TouchGameplayHint() {
  const phase = useGameStore((s) => s.phase)
  const [visible, setVisible] = useState(false)
  const { ui } = useThemeDefinition()
  const { messages } = useTranslation()
  const touch = messages.touch
  const isKidsArcade = phase === 'kids-arcade'

  useEffect(() => {
    setVisible(isTouchPreferredDevice())
  }, [])

  if (!visible) return null

  return (
    <div
      aria-hidden="true"
      style={{
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
        background: `linear-gradient(180deg, ${ui.selectorBackground} 0%, ${ui.controlBg} 100%)`,
        border: `2px solid ${ui.secondary}`,
        boxShadow: ui.panelShadow,
        pointerEvents: 'none',
        fontFamily: '"Press Start 2P", monospace',
        textAlign: 'center',
        maxWidth: 'min(92vw, 360px)',
      }}
    >
      <div style={{ fontSize: rem(0.34), color: ui.muted, lineHeight: 1.8 }}>
        {isKidsArcade ? touch.kidsTap : touch.tapHighlighted}
      </div>
      {!isKidsArcade && (
        <div style={{ fontSize: rem(0.3), color: ui.muted, lineHeight: 1.8 }}>
          {touch.tapBonus}
        </div>
      )}
    </div>
  )
}
