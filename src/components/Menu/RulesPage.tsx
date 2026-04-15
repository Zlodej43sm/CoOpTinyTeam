import { getThemeDefinition } from '@/game/config/theme'
import { useGameStore } from '@/store/gameStore'
import { trackNavigationClick } from '@/analytics/events'
import { rem } from '@/ui/typography'

export default function RulesPage() {
  const theme = useGameStore((s) => s.theme)
  const setPhase = useGameStore((s) => s.setPhase)
  const themeDef = getThemeDefinition(theme)
  const { ui, copy } = themeDef
  const sections = [copy.scoreRules, copy.dangerRules, copy.coopRules]

  return (
    <div style={wrapperStyle}>
      <div style={panelStyle(ui)}>
        <div style={{ fontSize: rem(0.95), color: ui.accent }}>{copy.rulesTitle}</div>
        <div style={subtitleStyle(ui)}>{copy.rulesSubtitle}</div>

        {sections.map((section) => (
          <div key={section.heading} style={sectionStyle(ui)}>
            <div style={headingStyle(ui)}>{section.heading}</div>
            <div style={bodyStyle(ui)}>{section.lines[0]}</div>
            <div style={bodyStyle(ui)}>{section.lines[1]}</div>
          </div>
        ))}

        <div style={buttonRowStyle}>
          <button
            onClick={() => {
              trackNavigationClick({ cta: 'back', source: 'rules', targetPhase: 'menu' })
              setPhase('menu')
            }}
            style={backButtonStyle(ui)}
          >
            BACK
          </button>
          <button
            onClick={() => {
              trackNavigationClick({ cta: 'choose-level', source: 'rules', targetPhase: 'level-select' })
              setPhase('level-select')
            }}
            style={playButtonStyle(ui)}
          >
            {copy.chooseLevelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

const wrapperStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  padding: '2rem 1rem',
}

function panelStyle(ui: ReturnType<typeof getThemeDefinition>['ui']): React.CSSProperties {
  return {
    width: 'min(760px, 96vw)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.15rem',
    padding: '2rem',
    border: `2px solid ${ui.panelBorder}`,
    borderRadius: 24,
    background: `linear-gradient(180deg, ${alpha(ui.secondary, 0.1)} 0%, transparent 24%), ${ui.panelBackground}`,
    boxShadow: ui.panelShadow,
    fontFamily: '"Press Start 2P", monospace',
  }
}

function subtitleStyle(ui: ReturnType<typeof getThemeDefinition>['ui']): React.CSSProperties {
  return {
    fontSize: rem(0.42),
    color: ui.muted,
    lineHeight: 1.9,
  }
}

function sectionStyle(ui: ReturnType<typeof getThemeDefinition>['ui']): React.CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.62rem',
    padding: '1rem',
    border: `1px solid ${ui.subtleBorder}`,
    borderRadius: 20,
    background: `linear-gradient(180deg, ${alpha(ui.warning, 0.08)} 0%, transparent 100%), ${ui.selectorBackground}`,
    boxShadow: `0 8px 22px ${alpha('#000000', 0.12)}`,
  }
}

function headingStyle(ui: ReturnType<typeof getThemeDefinition>['ui']): React.CSSProperties {
  return {
    fontSize: rem(0.46),
    color: ui.danger,
  }
}

function bodyStyle(ui: ReturnType<typeof getThemeDefinition>['ui']): React.CSSProperties {
  return {
    fontSize: rem(0.4),
    color: ui.text,
    lineHeight: 1.9,
  }
}

const buttonRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '0.8rem',
  marginTop: '0.6rem',
  flexWrap: 'wrap',
}

function backButtonStyle(ui: ReturnType<typeof getThemeDefinition>['ui']): React.CSSProperties {
  return {
    background: `linear-gradient(180deg, ${alpha(ui.controlBg, 0.94)} 0%, ${alpha('#000000', 0.18)} 100%)`,
    border: `2px solid ${ui.inactiveButtonBorder}`,
    color: ui.inactiveButtonColor,
    padding: '0.7rem 1.3rem',
    fontSize: rem(0.45),
    fontFamily: '"Press Start 2P", monospace',
    cursor: 'pointer',
    borderRadius: 16,
  }
}

function playButtonStyle(ui: ReturnType<typeof getThemeDefinition>['ui']): React.CSSProperties {
  return {
    background: `linear-gradient(180deg, ${alpha(ui.accent, 0.16)} 0%, ${alpha(ui.controlBg, 0.94)} 100%)`,
    border: `2px solid ${ui.accent}`,
    color: ui.accent,
    padding: '0.7rem 1.3rem',
    fontSize: rem(0.45),
    fontFamily: '"Press Start 2P", monospace',
    cursor: 'pointer',
    borderRadius: 16,
    boxShadow: `0 0 16px ${ui.accent}33`,
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
