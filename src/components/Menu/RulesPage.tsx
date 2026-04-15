import { getThemeDefinition } from '@/game/config/theme'
import { useGameStore } from '@/store/gameStore'

export default function RulesPage() {
  const theme = useGameStore((s) => s.theme)
  const setPhase = useGameStore((s) => s.setPhase)
  const themeDef = getThemeDefinition(theme)
  const { ui, copy } = themeDef
  const sections = [copy.scoreRules, copy.dangerRules, copy.coopRules]

  return (
    <div style={wrapperStyle}>
      <div style={panelStyle(ui)}>
        <div style={{ fontSize: '0.95rem', color: ui.accent }}>{copy.rulesTitle}</div>
        <div style={subtitleStyle(ui)}>{copy.rulesSubtitle}</div>

        {sections.map((section) => (
          <div key={section.heading} style={sectionStyle(ui)}>
            <div style={headingStyle(ui)}>{section.heading}</div>
            <div style={bodyStyle(ui)}>{section.lines[0]}</div>
            <div style={bodyStyle(ui)}>{section.lines[1]}</div>
          </div>
        ))}

        <div style={buttonRowStyle}>
          <button onClick={() => setPhase('menu')} style={backButtonStyle(ui)}>BACK</button>
          <button onClick={() => setPhase('level-select')} style={playButtonStyle(ui)}>
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
    gap: '1rem',
    padding: '1.8rem',
    border: `2px solid ${ui.panelBorder}`,
    background: ui.panelBackground,
    boxShadow: ui.panelShadow,
    fontFamily: '"Press Start 2P", monospace',
  }
}

function subtitleStyle(ui: ReturnType<typeof getThemeDefinition>['ui']): React.CSSProperties {
  return {
    fontSize: '0.42rem',
    color: ui.muted,
    lineHeight: 1.9,
  }
}

function sectionStyle(ui: ReturnType<typeof getThemeDefinition>['ui']): React.CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.55rem',
    padding: '0.9rem',
    border: `1px solid ${ui.subtleBorder}`,
    background: ui.selectorBackground,
  }
}

function headingStyle(ui: ReturnType<typeof getThemeDefinition>['ui']): React.CSSProperties {
  return {
    fontSize: '0.46rem',
    color: ui.danger,
  }
}

function bodyStyle(ui: ReturnType<typeof getThemeDefinition>['ui']): React.CSSProperties {
  return {
    fontSize: '0.4rem',
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
    background: 'transparent',
    border: `2px solid ${ui.inactiveButtonBorder}`,
    color: ui.inactiveButtonColor,
    padding: '0.7rem 1.3rem',
    fontSize: '0.45rem',
    fontFamily: '"Press Start 2P", monospace',
    cursor: 'pointer',
  }
}

function playButtonStyle(ui: ReturnType<typeof getThemeDefinition>['ui']): React.CSSProperties {
  return {
    background: 'transparent',
    border: `2px solid ${ui.accent}`,
    color: ui.accent,
    padding: '0.7rem 1.3rem',
    fontSize: '0.45rem',
    fontFamily: '"Press Start 2P", monospace',
    cursor: 'pointer',
    boxShadow: `0 0 16px ${ui.accent}33`,
  }
}
