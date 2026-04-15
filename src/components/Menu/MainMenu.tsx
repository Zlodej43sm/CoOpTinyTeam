import { getThemeDefinition } from '@/game/config/theme'
import { useGameStore } from '@/store/gameStore'
import { trackGameStarted, trackNavigationClick, trackThemeSelected } from '@/analytics/events'
import { rem } from '@/ui/typography'
import TipButton from '@/components/TipButton/TipButton'

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
    trackGameStarted({ level: 1, mode: 'coop', entryPoint: 'main-menu-start' })
    setPhase('playing')
  }

  function handleKidsArcadeStart() {
    reset()
    bumpRunId()
    trackGameStarted({ level: 1, mode: 'kids', entryPoint: 'main-menu-kids-arcade' })
    setPhase('kids-arcade')
  }

  return (
    <div
      style={{
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        gap: '1.3rem',
        width: 'min(660px, 96vw)',
        padding: '2rem 1.2rem',
        border: `2px solid ${ui.panelBorder}`,
        borderRadius: 28,
        background: `linear-gradient(180deg, ${alpha(ui.secondary, 0.1)} 0%, transparent 26%), ${ui.panelBackground}`,
        boxShadow: `${ui.panelShadow}, inset 0 1px 0 ${alpha('#ffffff', 0.08)}`,
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
          padding: '0.45rem 0.9rem',
          borderRadius: 999,
          border: `2px solid ${alpha(ui.warning, 0.7)}`,
          background: `linear-gradient(90deg, ${alpha(ui.warning, 0.18)} 0%, ${alpha(ui.secondary, 0.14)} 100%)`,
          color: '#fff5d1',
          fontSize: rem(0.39),
          letterSpacing: '0.12em',
          boxShadow: `0 0 18px ${alpha(ui.warning, 0.18)}`,
        }}
      >
        BIG HELPERS + LITTLE PLAYERS
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.55rem',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <div style={{ fontSize: rem(0.43), color: ui.muted, letterSpacing: '0.14em' }}>THEME MODE</div>
        <div
          style={{
            display: 'flex',
            gap: '0.65rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
            padding: '0.65rem',
            width: 'min(460px, 100%)',
            background: ui.selectorBackground,
            border: `1px solid ${ui.subtleBorder}`,
            borderRadius: 18,
          }}
        >
          {(['dev', 'trading'] as const).map((option) => {
            const optionDef = getThemeDefinition(option)
            const active = option === theme

            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  trackThemeSelected({ theme: option, source: 'main-menu' })
                  setTheme(option)
                }}
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
          fontSize: rem(0.54),
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

      <button
        onClick={() => {
          trackNavigationClick({ cta: 'choose-level', source: 'main-menu', targetPhase: 'level-select' })
          setPhase('level-select')
        }}
        style={secondaryBtnStyle(ui)}
      >
        {copy.levelSelectTitle}
      </button>

      <button
        onClick={() => {
          trackNavigationClick({ cta: 'rules', source: 'main-menu', targetPhase: 'rules' })
          setPhase('rules')
        }}
        style={tertiaryBtnStyle(ui)}
      >
        {copy.rulesTitle}
      </button>

      <button
        onClick={() => {
          trackNavigationClick({ cta: 'all-games', source: 'main-menu', targetPhase: 'hub' })
          setPhase('hub')
        }}
        style={backBtnStyle(ui)}
      >
        ← ALL GAMES
      </button>

      <TipButton />
    </div>
  )
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

function themeOptionStyle(
  ui: ReturnType<typeof getThemeDefinition>['ui'],
  active: boolean,
): React.CSSProperties {
  return {
    minWidth: 184,
    background: active
      ? `linear-gradient(180deg, ${alpha(ui.secondary, 0.24)} 0%, ${alpha(ui.warning, 0.12)} 100%)`
      : alpha(ui.controlBg, 0.4),
    border: `2px solid ${active ? ui.secondary : ui.inactiveButtonBorder}`,
    color: active ? ui.secondary : ui.inactiveButtonColor,
    padding: '0.7rem 1rem',
    fontSize: rem(0.45),
    fontFamily: '"Press Start 2P", monospace',
    cursor: 'pointer',
    borderRadius: 18,
    letterSpacing: '0.08em',
    boxShadow: active ? `0 0 18px ${alpha(ui.secondary, 0.24)}` : `0 6px 16px ${alpha('#000000', 0.18)}`,
  }
}

function primaryBtnStyle(ui: ReturnType<typeof getThemeDefinition>['ui']): React.CSSProperties {
  return {
    background: `linear-gradient(180deg, ${alpha(ui.accent, 0.16)} 0%, ${alpha(ui.controlBg, 0.94)} 100%)`,
    border: `2px solid ${ui.accent}`,
    color: ui.accent,
    padding: '0.85rem 2.75rem',
    fontSize: rem(0.70),
    fontFamily: '"Press Start 2P", monospace',
    cursor: 'pointer',
    letterSpacing: '0.1em',
    borderRadius: 18,
    boxShadow: `0 12px 24px ${alpha(ui.accent, 0.18)}`,
    transition: 'box-shadow 0.2s, transform 0.2s',
  }
}

function secondaryBtnStyle(ui: ReturnType<typeof getThemeDefinition>['ui']): React.CSSProperties {
  return {
    background: `linear-gradient(180deg, ${alpha(ui.secondary, 0.14)} 0%, ${alpha(ui.controlBg, 0.94)} 100%)`,
    border: `2px solid ${ui.secondary}`,
    color: ui.secondary,
    padding: '0.72rem 2.2rem',
    fontSize: rem(0.59),
    fontFamily: '"Press Start 2P", monospace',
    cursor: 'pointer',
    letterSpacing: '0.08em',
    borderRadius: 18,
    boxShadow: `0 10px 20px ${alpha(ui.secondary, 0.18)}`,
  }
}

function kidsBtnStyle(ui: ReturnType<typeof getThemeDefinition>['ui']): React.CSSProperties {
  return {
    background: `linear-gradient(180deg, ${alpha(ui.warning, 0.34)} 0%, ${alpha(ui.danger, 0.18)} 100%)`,
    border: `2px solid ${ui.warning}`,
    color: '#fff2b2',
    padding: '0.86rem 2.3rem',
    fontSize: rem(0.63),
    fontFamily: '"Press Start 2P", monospace',
    cursor: 'pointer',
    letterSpacing: '0.08em',
    borderRadius: 20,
    boxShadow: `0 14px 28px ${alpha(ui.warning, 0.22)}`,
  }
}

function tertiaryBtnStyle(ui: ReturnType<typeof getThemeDefinition>['ui']): React.CSSProperties {
  return {
    background: `linear-gradient(180deg, ${alpha(ui.danger, 0.14)} 0%, ${alpha(ui.controlBg, 0.94)} 100%)`,
    border: `2px solid ${ui.danger}`,
    color: ui.danger,
    padding: '0.72rem 1.95rem',
    fontSize: rem(0.54),
    fontFamily: '"Press Start 2P", monospace',
    cursor: 'pointer',
    letterSpacing: '0.08em',
    borderRadius: 18,
    boxShadow: `0 10px 22px ${alpha(ui.danger, 0.16)}`,
  }
}

function backBtnStyle(ui: ReturnType<typeof getThemeDefinition>['ui']): React.CSSProperties {
  return {
    background: 'transparent',
    border: 'none',
    color: ui.muted,
    padding: '0.4rem 1rem',
    fontSize: rem(0.41),
    fontFamily: '"Press Start 2P", monospace',
    cursor: 'pointer',
    letterSpacing: '0.08em',
    marginTop: '0.3rem',
  }
}
