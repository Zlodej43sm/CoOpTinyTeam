import { getThemeDefinition } from '@/game/config/theme'
import { useGameStore } from '@/store/gameStore'
import { trackGameStarted } from '@/analytics/events'

export default function MainMenu() {
  const theme = useGameStore((s) => s.theme)
  const setTheme = useGameStore((s) => s.setTheme)
  const setPhase = useGameStore((s) => s.setPhase)
  const reset = useGameStore((s) => s.reset)
  const bumpRunId = useGameStore((s) => s.bumpRunId)
  const themeDef = getThemeDefinition(theme)
  const { ui, copy } = themeDef

  function handleStart() {
    reset()
    bumpRunId()
    trackGameStarted({ level: 1, mode: 'coop' })
    setPhase('playing')
  }

  function handleKidsArcadeStart() {
    reset()
    bumpRunId()
    trackGameStarted({ level: 1, mode: 'kids' })
    setPhase('kids-arcade')
  }

  return (
    <div
      style={{
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.15rem',
        width: 'min(620px, 96vw)',
        padding: '1.8rem 1rem',
        border: `2px solid ${ui.panelBorder}`,
        background: ui.panelBackground,
        boxShadow: ui.panelShadow,
      }}
    >
      <img
        src="/assets/logo.webp"
        alt="CoOp Tiny Team"
        style={{
          width: 'min(320px, 72vw)',
          height: 'auto',
          filter: ui.logoGlow,
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.55rem',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <div style={{ fontSize: '0.4rem', color: ui.muted, letterSpacing: '0.14em' }}>THEME MODE</div>
        <div
          style={{
            display: 'flex',
            gap: '0.65rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
            padding: '0.55rem',
            width: 'min(460px, 100%)',
            background: ui.selectorBackground,
            border: `1px solid ${ui.subtleBorder}`,
          }}
        >
          {(['dev', 'trading'] as const).map((option) => {
            const optionDef = getThemeDefinition(option)
            const active = option === theme

            return (
              <button
                key={option}
                type="button"
                onClick={() => setTheme(option)}
                style={themeOptionStyle(ui, active)}
              >
                {optionDef.copy.themeChip}
              </button>
            )
          })}
        </div>
      </div>

      <p
        style={{
          fontSize: '0.5rem',
          color: ui.muted,
          fontFamily: '"Press Start 2P", monospace',
          lineHeight: 1.8,
          whiteSpace: 'pre-line',
        }}
      >
        {copy.tagline}
      </p>

      <button
        onClick={handleStart}
        style={primaryBtnStyle(ui)}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = `0 0 28px ${alpha(ui.accent, 0.52)}`
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = `0 0 14px ${alpha(ui.accent, 0.28)}`
        }}
      >
        START GAME
      </button>

      <button onClick={handleKidsArcadeStart} style={kidsBtnStyle(ui)}>
        KIDS ARCADE
      </button>

      <button onClick={() => setPhase('level-select')} style={secondaryBtnStyle(ui)}>
        {copy.levelSelectTitle}
      </button>

      <button onClick={() => setPhase('rules')} style={tertiaryBtnStyle(ui)}>
        {copy.rulesTitle}
      </button>

      <button onClick={() => setPhase('hub')} style={backBtnStyle(ui)}>
        ← ALL GAMES
      </button>
    </div>
  )
}

function alpha(color: string, opacity: number): string {
  const normalized = color.replace('#', '')
  const step = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized
  const red = parseInt(step.slice(0, 2), 16)
  const green = parseInt(step.slice(2, 4), 16)
  const blue = parseInt(step.slice(4, 6), 16)
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`
}

function themeOptionStyle(
  ui: ReturnType<typeof getThemeDefinition>['ui'],
  active: boolean,
): React.CSSProperties {
  return {
    minWidth: 172,
    background: active ? alpha(ui.secondary, 0.12) : 'transparent',
    border: `2px solid ${active ? ui.secondary : ui.inactiveButtonBorder}`,
    color: active ? ui.secondary : ui.inactiveButtonColor,
    padding: '0.6rem 0.9rem',
    fontSize: '0.42rem',
    fontFamily: '"Press Start 2P", monospace',
    cursor: 'pointer',
    boxShadow: active ? `0 0 14px ${alpha(ui.secondary, 0.2)}` : 'none',
  }
}

function primaryBtnStyle(ui: ReturnType<typeof getThemeDefinition>['ui']): React.CSSProperties {
  return {
    background: 'transparent',
    border: `2px solid ${ui.accent}`,
    color: ui.accent,
    padding: '0.75rem 2.5rem',
    fontSize: '0.65rem',
    fontFamily: '"Press Start 2P", monospace',
    cursor: 'pointer',
    letterSpacing: '0.1em',
    boxShadow: `0 0 14px ${alpha(ui.accent, 0.28)}`,
    transition: 'box-shadow 0.2s',
  }
}

function secondaryBtnStyle(ui: ReturnType<typeof getThemeDefinition>['ui']): React.CSSProperties {
  return {
    background: 'transparent',
    border: `2px solid ${ui.secondary}`,
    color: ui.secondary,
    padding: '0.65rem 2rem',
    fontSize: '0.55rem',
    fontFamily: '"Press Start 2P", monospace',
    cursor: 'pointer',
    letterSpacing: '0.08em',
    boxShadow: `0 0 12px ${alpha(ui.secondary, 0.22)}`,
  }
}

function kidsBtnStyle(ui: ReturnType<typeof getThemeDefinition>['ui']): React.CSSProperties {
  return {
    background: `linear-gradient(180deg, ${alpha(ui.warning, 0.22)} 0%, ${alpha(ui.danger, 0.12)} 100%)`,
    border: `2px solid ${ui.warning}`,
    color: '#fff2b2',
    padding: '0.75rem 2.1rem',
    fontSize: '0.58rem',
    fontFamily: '"Press Start 2P", monospace',
    cursor: 'pointer',
    letterSpacing: '0.08em',
    boxShadow: `0 0 18px ${alpha(ui.warning, 0.24)}`,
  }
}

function tertiaryBtnStyle(ui: ReturnType<typeof getThemeDefinition>['ui']): React.CSSProperties {
  return {
    background: 'transparent',
    border: `2px solid ${ui.danger}`,
    color: ui.danger,
    padding: '0.65rem 1.8rem',
    fontSize: '0.5rem',
    fontFamily: '"Press Start 2P", monospace',
    cursor: 'pointer',
    letterSpacing: '0.08em',
    boxShadow: `0 0 12px ${alpha(ui.danger, 0.18)}`,
  }
}

function backBtnStyle(ui: ReturnType<typeof getThemeDefinition>['ui']): React.CSSProperties {
  return {
    background: 'transparent',
    border: 'none',
    color: ui.muted,
    padding: '0.4rem 1rem',
    fontSize: '0.38rem',
    fontFamily: '"Press Start 2P", monospace',
    cursor: 'pointer',
    letterSpacing: '0.08em',
    marginTop: '0.3rem',
  }
}
