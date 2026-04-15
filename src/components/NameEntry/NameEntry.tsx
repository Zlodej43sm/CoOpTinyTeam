import { useGameStore } from '@/store/gameStore'
import { trackPlayerNamed } from '@/analytics/events'
import { saveScore } from '@/services/scores'
import { LEVELS } from '@/game/config/levels'
import { getThemeDefinition } from '@/game/config/theme'
import { rem } from '@/ui/typography'

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
    trackPlayerNamed({
      outcome: isVictory ? 'victory' : 'gameover',
      usedDefaultName: finalName === 'PLAYER',
      nameLength: finalName.length,
    })
    saveScore({ playerName: finalName, score, levelReached: level })
    setPhase(isVictory ? 'victory' : 'gameover')
  }

  return (
    <form onSubmit={handleSubmit} style={wrapperStyle(ui)}>
      <div style={{ fontSize: rem(0.85), color: isVictory ? ui.accent : ui.danger }}>
        {isVictory ? copy.victoryTitle : copy.defeatTitle}
      </div>
      <div style={{ fontSize: rem(0.42), color: ui.muted, lineHeight: 1.8 }}>
        {copy.namePrompt}
      </div>
      <input
        autoFocus
        maxLength={MAX_NAME_LEN}
        value={playerName}
        onChange={(e) => setPlayerName(normalizeName(e.target.value))}
        style={inputStyle(ui)}
      />
      <div style={{ fontSize: rem(0.42), color: ui.muted, lineHeight: 1.8 }}>
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
    padding: '1.95rem',
    textAlign: 'center',
    border: `2px solid ${ui.panelBorder}`,
    borderRadius: 24,
    boxShadow: ui.panelShadow,
    background: `linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 20%), ${ui.panelBackground}`,
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
    fontSize: rem(0.8),
    fontFamily: '"Press Start 2P", monospace',
    borderRadius: 16,
    outline: 'none',
  }
}

function submitStyle(ui: ReturnType<typeof getThemeDefinition>['ui']): React.CSSProperties {
  return {
    background: `linear-gradient(180deg, ${ui.controlBg} 0%, rgba(255,255,255,0.04) 100%)`,
    border: `2px solid ${ui.secondary}`,
    color: ui.secondary,
    padding: '0.65rem 1.4rem',
    fontSize: rem(0.5),
    fontFamily: '"Press Start 2P", monospace',
    cursor: 'pointer',
    borderRadius: 16,
  }
}
