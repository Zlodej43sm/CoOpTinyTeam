import { LEVELS } from '@/game/config/levels'
import { getLevelDisplayName, getThemeDefinition } from '@/game/config/theme'
import { useGameStore } from '@/store/gameStore'
import { trackGameStarted } from '@/analytics/events'

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
    trackGameStarted({ level: id, mode: 'coop' })
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
        width: 'min(520px, 94vw)',
        padding: '1.7rem',
        border: `2px solid ${ui.panelBorder}`,
        background: ui.panelBackground,
        boxShadow: ui.panelShadow,
      }}
    >
      <h2 style={{ color: ui.accent, marginBottom: '1.2rem', fontSize: '0.8rem', fontFamily: '"Press Start 2P", monospace' }}>
        {copy.levelSelectTitle}
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {LEVELS.map((level) => (
          <button
            key={level.id}
            onClick={() => handleSelect(level.id)}
            style={{
              background: 'transparent',
              border: `2px solid ${level.isBoss ? ui.danger : ui.accent}`,
              color: level.isBoss ? ui.danger : ui.accent,
              padding: '0.5rem 1.5rem',
              fontSize: '0.5rem',
              fontFamily: '"Press Start 2P", monospace',
              cursor: 'pointer',
              boxShadow: level.isBoss
                ? `0 0 12px ${alpha(ui.danger, 0.14)}`
                : `0 0 12px ${alpha(ui.accent, 0.16)}`,
            }}
          >
            {getLevelDisplayName(theme, level.id)}
          </button>
        ))}
      </div>

      <button onClick={() => setPhase('menu')} style={backBtnStyle(ui)}>BACK</button>
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

function backBtnStyle(ui: ReturnType<typeof getThemeDefinition>['ui']): React.CSSProperties {
  return {
    background: 'transparent',
    border: `2px solid ${ui.inactiveButtonBorder}`,
    color: ui.inactiveButtonColor,
    padding: '0.55rem 1.3rem',
    fontSize: '0.5rem',
    fontFamily: '"Press Start 2P", monospace',
    cursor: 'pointer',
  }
}
