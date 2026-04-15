import { useGameStore } from '@/store/gameStore'
import { saveScore } from '@/services/scores'
import { LEVELS } from '@/game/config/levels'
import { getThemeDefinition } from '@/game/config/theme'

const MAX_NAME_LEN = 8

function normalizeName(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, MAX_NAME_LEN)
}

export default function NameEntry() {
  const playerName = useGameStore((s) => s.playerName)
  const score = useGameStore((s) => s.score)
  const level = useGameStore((s) => s.level)
  const lives = useGameStore((s) => s.lives)
  const theme = useGameStore((s) => s.theme)
  const setPhase = useGameStore((s) => s.setPhase)
  const setPlayerName = useGameStore((s) => s.setPlayerName)

  const isVictory = lives > 0 && level >= LEVELS.length
  const themeDef = getThemeDefinition(theme)
  const { ui, copy } = themeDef

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const finalName = normalizeName(playerName) || 'PLAYER'
    setPlayerName(finalName)
    saveScore({ playerName: finalName, score, levelReached: level })
    setPhase(isVictory ? 'victory' : 'gameover')
  }

  return (
    <form onSubmit={handleSubmit} style={wrapperStyle(ui)}>
      <div style={{ fontSize: '0.85rem', color: isVictory ? ui.accent : ui.danger }}>
        {isVictory ? copy.victoryTitle : copy.defeatTitle}
      </div>
      <div style={{ fontSize: '0.42rem', color: ui.muted, lineHeight: 1.8 }}>
        {copy.namePrompt}
      </div>
      <input
        autoFocus
        maxLength={MAX_NAME_LEN}
        value={playerName}
        onChange={(e) => setPlayerName(normalizeName(e.target.value))}
        style={inputStyle(ui)}
      />
      <div style={{ fontSize: '0.42rem', color: ui.muted, lineHeight: 1.8 }}>
        SCORE {score.toString().padStart(7, '0')} | {copy.levelWord} {level}
      </div>
      <button type="submit" style={submitStyle(ui)}>
        SAVE SCORE
      </button>
    </form>
  )
}

function wrapperStyle(ui: ReturnType<typeof getThemeDefinition>['ui']): React.CSSProperties {
  return {
    width: 'min(420px, 92vw)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    padding: '1.75rem',
    textAlign: 'center',
    border: `2px solid ${ui.panelBorder}`,
    boxShadow: ui.panelShadow,
    background: ui.panelBackground,
    fontFamily: '"Press Start 2P", monospace',
  }
}

function inputStyle(ui: ReturnType<typeof getThemeDefinition>['ui']): React.CSSProperties {
  return {
    width: '100%',
    padding: '0.9rem',
    background: '#060606',
    border: `2px solid ${ui.accent}`,
    color: ui.accent,
    textAlign: 'center',
    textTransform: 'uppercase',
    fontSize: '0.8rem',
    fontFamily: '"Press Start 2P", monospace',
    outline: 'none',
  }
}

function submitStyle(ui: ReturnType<typeof getThemeDefinition>['ui']): React.CSSProperties {
  return {
    background: 'transparent',
    border: `2px solid ${ui.secondary}`,
    color: ui.secondary,
    padding: '0.65rem 1.4rem',
    fontSize: '0.5rem',
    fontFamily: '"Press Start 2P", monospace',
    cursor: 'pointer',
  }
}
