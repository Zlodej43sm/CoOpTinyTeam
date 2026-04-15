import { BOTTOM_HUD_HEIGHT, FOOTER_PANEL_HEIGHT, FOOTER_PIPELINE_HEIGHT } from '@/game/config/layout'
import { LEVELS } from '@/game/config/levels'
import { getLevelDisplayName, getThemeDefinition } from '@/game/config/theme'
import { useGameStore } from '@/store/gameStore'
import { rem } from '@/ui/typography'

export default function BottomGameHud() {
  const phase = useGameStore((s) => s.phase)
  const theme = useGameStore((s) => s.theme)
  const level = useGameStore((s) => s.level)
  const activeChar = useGameStore((s) => s.activeChar)
  const footerChallengeProgress = useGameStore((s) => s.footerChallengeProgress)
  const footerLevelProgress = useGameStore((s) => s.footerLevelProgress)
  const footerLevelGoal = useGameStore((s) => s.footerLevelGoal)
  const themeDef = getThemeDefinition(theme)
  const { ui, copy, livesGlyph } = themeDef
  const isKidsArcade = phase === 'kids-arcade'
  const stageCount = LEVELS.length
  const currentStageIndex = Math.max(0, Math.min(stageCount - 1, level - 1))
  const levelDisplayName = getLevelDisplayName(theme, level)
  const pipelineLabel = isKidsArcade ? copy.kidsModeLabel : `${copy.progressLabel} FLOW`
  const levelProgressRatio = footerLevelGoal > 0 ? Math.min(1, footerLevelProgress / footerLevelGoal) : 0
  const timerPercent = Math.max(0, Math.min(1, footerChallengeProgress))
  const timerColor =
    timerPercent > 0.5 ? ui.accent
    : timerPercent > 0.25 ? ui.warning
    : ui.danger

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: BOTTOM_HUD_HEIGHT,
        pointerEvents: 'none',
        zIndex: 12,
        fontFamily: '"Press Start 2P", monospace',
      }}
    >
      <div
        style={{
          height: FOOTER_PIPELINE_HEIGHT,
          padding: '8px 18px 10px',
          display: 'grid',
          gridTemplateColumns: 'minmax(128px, 176px) minmax(0, 1fr) minmax(170px, 220px)',
          alignItems: 'center',
          gap: '0.8rem',
          background: `linear-gradient(180deg, ${alpha(ui.warning, 0.12)} 0%, ${alpha(ui.secondary, 0.08)} 40%, ${alpha(ui.controlBg, 0.9)} 100%)`,
          borderTop: `1px solid ${alpha(ui.subtleBorder, 0.95)}`,
          borderBottom: `1px solid ${alpha(ui.secondary, 0.24)}`,
          boxShadow: `0 -12px 28px ${alpha('#000000', 0.4)}`,
        }}
      >
        <div style={{ color: ui.muted, fontSize: rem(0.35), letterSpacing: '0.14em' }}>{pipelineLabel}</div>

        {isKidsArcade ? (
          <div
            style={{
              justifySelf: 'stretch',
              height: 20,
              border: `2px solid ${ui.warning}`,
              background: `linear-gradient(90deg, ${alpha(ui.warning, 0.3)} 0%, ${alpha(ui.danger, 0.2)} 100%)`,
              color: ui.text,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 999,
              boxShadow: `0 0 18px ${alpha(ui.warning, 0.18)}`,
              fontSize: rem(0.36),
              letterSpacing: '0.12em',
            }}
          >
            ENDLESS FUN
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stageCount}, minmax(0, 1fr))`, gap: '0.55rem' }}>
            {Array.from({ length: stageCount }, (_, index) => {
              const isPast = index < currentStageIndex
              const isCurrent = index === currentStageIndex
              const widthPercent = isPast ? 100 : isCurrent ? levelProgressRatio * 100 : 0

              return (
                <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '0.28rem' }}>
                  <div
                    style={{
                      position: 'relative',
                      height: 16,
                      border: `2px solid ${isPast ? ui.accent : isCurrent ? ui.danger : ui.secondary}`,
                      background: isCurrent ? alpha(ui.danger, 0.12) : alpha(ui.controlBg, 0.78),
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: `${widthPercent}%`,
                        background: isPast
                          ? `linear-gradient(90deg, ${ui.accent} 0%, ${ui.warning} 100%)`
                          : `linear-gradient(90deg, ${ui.warning} 0%, ${ui.danger} 100%)`,
                        boxShadow: isCurrent ? `0 0 18px ${alpha(ui.danger, 0.4)}` : 'none',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      textAlign: 'center',
                      color: index > currentStageIndex ? ui.muted : ui.text,
                      fontSize: rem(0.3),
                    }}
                  >
                    {index + 1}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div
          style={{
            color: ui.secondary,
            fontSize: rem(0.32),
            textAlign: 'right',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {levelDisplayName}
        </div>
      </div>

      <div
        style={{
          height: FOOTER_PANEL_HEIGHT,
          padding: '14px 22px 16px',
          display: 'grid',
          gridTemplateColumns: 'minmax(180px, 1fr) minmax(220px, 300px) minmax(180px, 1fr)',
          alignItems: 'center',
          gap: '1rem',
          background: `linear-gradient(180deg, ${alpha(ui.secondary, 0.08)} 0%, ${alpha(ui.controlBg, 0.96)} 34%, ${alpha('#06080b', 0.98)} 100%)`,
          borderTop: `1px solid ${alpha(ui.secondary, 0.16)}`,
        }}
      >
        <div style={infoCardStyle(ui, 'left')}>
          <div style={{ color: ui.badge, fontSize: rem(0.34), letterSpacing: '0.12em' }}>
            {isKidsArcade ? copy.kidsModeLabel : `${copy.levelWord} ${level}`}
          </div>
          <div
            style={{
              color: ui.text,
              fontSize: rem(0.42),
              lineHeight: 1.6,
              maxWidth: 260,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {levelDisplayName}
          </div>
          <div style={{ color: ui.muted, fontSize: rem(0.32), lineHeight: 1.8 }}>
            {isKidsArcade
              ? copy.kidsBanner
              : `${footerLevelProgress}/${footerLevelGoal || 0} cleared • ${copy.progressLabel.toLowerCase()} live`}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.7rem' }}>
          <div
            style={{
              width: 92,
              height: 92,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `4px solid ${ui.danger}`,
              borderRadius: 24,
              boxShadow: `0 0 0 4px ${alpha(ui.warning, 0.78)}, 0 0 28px ${alpha(ui.danger, 0.32)}`,
              background: `linear-gradient(180deg, ${alpha(ui.warning, 0.24)} 0%, ${alpha(ui.danger, 0.16)} 30%, ${alpha(ui.controlBg, 0.98)} 100%)`,
              color: ui.text,
              fontSize: activeChar ? rem(2.25) : rem(1.2),
              lineHeight: 1,
              transform: activeChar ? `scale(${1 + timerPercent * 0.06}) rotate(${(0.5 - timerPercent) * 2.2}deg)` : 'scale(1)',
            }}
          >
            {activeChar ?? '…'}
          </div>
          <div style={{ width: '100%', maxWidth: 280, display: 'flex', flexDirection: 'column', gap: '0.32rem' }}>
            <div style={{ color: ui.muted, fontSize: rem(0.3), textAlign: 'center' }}>
              {activeChar ? 'MATCH THE TARGET' : 'NEXT TARGET LOADING'}
            </div>
            <div
              style={{
                width: '100%',
                height: 12,
                border: `2px solid ${alpha(ui.secondary, 0.6)}`,
                background: alpha(ui.controlBg, 0.9),
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${timerPercent * 100}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${timerColor} 0%, ${ui.danger} 100%)`,
                  boxShadow: `0 0 16px ${alpha(timerColor, 0.38)}`,
                  transition: 'width 60ms linear',
                }}
              />
            </div>
          </div>
        </div>

        <div style={infoCardStyle(ui, 'right')}>
          <div style={{ color: ui.warning, fontSize: rem(0.32), letterSpacing: '0.12em' }}>
            {isKidsArcade ? 'FUN LOOP' : 'RUN STATUS'}
          </div>
          <div style={{ color: ui.text, fontSize: rem(0.42), lineHeight: 1.7, textAlign: 'right' }}>
            {isKidsArcade ? 'Tap, type, and pop the target.' : `Exact = 100 • Any = 10`}
          </div>
          <div
            style={{
              color: ui.livesColor,
              fontSize: rem(0.34),
              lineHeight: 1.8,
              textAlign: 'right',
            }}
          >
            {isKidsArcade ? 'No lives in arcade mode.' : `${livesGlyph} pressure stays at the top HUD`}
          </div>
        </div>
      </div>
    </div>
  )
}

function infoCardStyle(
  ui: ReturnType<typeof getThemeDefinition>['ui'],
  align: 'left' | 'right',
): React.CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.45rem',
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: align === 'right' ? 'flex-end' : 'flex-start',
    padding: '0.65rem 0.85rem',
    borderRadius: 18,
    border: `1px solid ${alpha(ui.subtleBorder, 0.9)}`,
    background: `linear-gradient(180deg, ${alpha('#ffffff', 0.05)} 0%, ${alpha(ui.controlBg, 0.82)} 100%)`,
    boxShadow: `0 8px 22px ${alpha('#000000', 0.16)}`,
  }
}

function alpha(color: string, opacity: number): string {
  if (color.startsWith('rgba(') || color.startsWith('rgb(')) {
    const parts = color.match(/[\d.]+/g)
    if (parts && parts.length >= 3) {
      const [red, green, blue] = parts
      return `rgba(${red}, ${green}, ${blue}, ${opacity})`
    }
  }
  const normalized = color.replace('#', '')
  const step = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized
  const red = parseInt(step.slice(0, 2), 16)
  const green = parseInt(step.slice(2, 4), 16)
  const blue = parseInt(step.slice(4, 6), 16)
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`
}
