import { LEVELS } from '@/game/config/levels'
import { getLevelDisplayName, getThemeDefinition } from '@/game/config/theme'
import { useGameStore } from '@/store/gameStore'
import { trackGameStarted, trackLevelSelected, trackNavigationClick } from '@/analytics/events'
import { rem } from '@/ui/typography'

export default function LevelSelect() {
  const theme = useGameStore((s) => s.theme)
  const setLevel = useGameStore((s) => s.setLevel)
  const setPhase = useGameStore((s) => s.setPhase)
  const reset = useGameStore((s) => s.reset)
  const bumpRunId = useGameStore((s) => s.bumpRunId)
  const themeDef = getThemeDefinition(theme)
  const { ui, copy } = themeDef

  function handleSelect(id: number) {
    const config = LEVELS.find((level) => level.id === id)
    reset()
    bumpRunId()
    setLevel(id)
    trackLevelSelected({ level: id, source: 'level-select', mode: 'coop' })
    trackGameStarted({ level: id, mode: 'coop', entryPoint: 'level-select' })
    setPhase(config?.isBoss ? 'boss' : 'playing')
  }

  return (
    <div
      style={{
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        alignItems: 'center',
        width: 'min(560px, 94vw)',
        padding: '1.9rem',
        border: `2px solid ${ui.panelBorder}`,
        borderRadius: 24,
        background: `linear-gradient(180deg, ${alpha(ui.secondary, 0.1)} 0%, transparent 24%), ${ui.panelBackground}`,
        boxShadow: ui.panelShadow,
      }}
    >
      <h2 style={{ color: ui.accent, marginBottom: '1.2rem', fontSize: rem(0.8), fontFamily: '"Press Start 2P", monospace' }}>
        {copy.levelSelectTitle}
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>
        {LEVELS.map((level) => (
          <button
            key={level.id}
            onClick={() => handleSelect(level.id)}
            style={{
              background: level.isBoss
                ? `linear-gradient(180deg, ${alpha(ui.danger, 0.2)} 0%, ${alpha(ui.controlBg, 0.94)} 100%)`
                : `linear-gradient(180deg, ${alpha(ui.accent, 0.16)} 0%, ${alpha(ui.controlBg, 0.94)} 100%)`,
              border: `2px solid ${level.isBoss ? ui.danger : ui.accent}`,
              color: level.isBoss ? ui.danger : ui.accent,
              padding: '0.72rem 1.5rem',
              fontSize: rem(0.5),
              fontFamily: '"Press Start 2P", monospace',
              cursor: 'pointer',
              borderRadius: 18,
              width: '100%',
              lineHeight: 1.6,
              boxShadow: level.isBoss
                ? `0 12px 22px ${alpha(ui.danger, 0.16)}`
                : `0 12px 22px ${alpha(ui.accent, 0.16)}`,
            }}
          >
            {getLevelDisplayName(theme, level.id)}
          </button>
        ))}
      </div>

      <button
        onClick={() => {
          trackNavigationClick({ cta: 'back', source: 'level-select', targetPhase: 'menu' })
          setPhase('menu')
        }}
        style={backBtnStyle(ui)}
      >
        BACK
      </button>
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

function backBtnStyle(ui: ReturnType<typeof getThemeDefinition>['ui']): React.CSSProperties {
  return {
    background: `linear-gradient(180deg, ${alpha(ui.controlBg, 0.92)} 0%, ${alpha('#000000', 0.18)} 100%)`,
    border: `2px solid ${ui.inactiveButtonBorder}`,
    color: ui.inactiveButtonColor,
    padding: '0.55rem 1.3rem',
    fontSize: rem(0.5),
    fontFamily: '"Press Start 2P", monospace',
    cursor: 'pointer',
    borderRadius: 16,
  }
}
