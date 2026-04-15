import { useEffect, useState } from 'react'
import { getThemeDefinition } from '@/game/config/theme'
import { useGameStore } from '@/store/gameStore'
import { loadTopScores } from '@/services/scores'
import type { ScoreEntry } from '@/types'

export default function Leaderboard() {
  const score = useGameStore((s) => s.score)
  const level = useGameStore((s) => s.level)
  const phase = useGameStore((s) => s.phase)
  const theme = useGameStore((s) => s.theme)
  const setPhase = useGameStore((s) => s.setPhase)
  const reset = useGameStore((s) => s.reset)
  const bumpRunId = useGameStore((s) => s.bumpRunId)

  const [topScores, setTopScores] = useState<ScoreEntry[]>([])
  const isVictory = phase === 'victory'
  const themeDef = getThemeDefinition(theme)
  const { ui, copy } = themeDef

  useEffect(() => {
    let cancelled = false

    void loadTopScores().then((scores) => {
      if (!cancelled) setTopScores(scores)
    })

    return () => {
      cancelled = true
    }
  }, [])

  function handleRestart() {
    reset()
    bumpRunId()
    setPhase('playing')
  }

  function handleMenu() {
    reset()
    setPhase('menu')
  }

  return (
    <div
      style={{
        textAlign: 'center',
        fontFamily: '"Press Start 2P", monospace',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '1.5rem',
        maxWidth: 480,
        width: '100%',
        border: `2px solid ${ui.panelBorder}`,
        background: ui.panelBackground,
        boxShadow: ui.panelShadow,
      }}
    >
      <img
        src="/assets/logo.mini.webp"
        alt="CoOp Tiny Team"
        style={{ width: 56, height: 56, objectFit: 'contain', filter: ui.logoGlow }}
      />

      <h2 style={{ color: isVictory ? ui.accent : ui.danger, fontSize: '1rem' }}>
        {isVictory ? copy.leaderboardVictory : copy.leaderboardDefeat}
      </h2>

      <div style={{ fontSize: '0.55rem', color: ui.muted, lineHeight: 2 }}>
        <span style={{ color: ui.accent }}>{score.toString().padStart(7, '0')}</span>
        {' '}pts &nbsp;|&nbsp; {copy.levelWord.toLowerCase()}{' '}
        <span style={{ color: ui.secondary }}>{level}</span>
      </div>

      {/* Top scores */}
      {topScores.length > 0 && (
        <div style={{ width: '100%', marginTop: '0.5rem' }}>
          <div style={{ fontSize: '0.4rem', color: ui.muted, marginBottom: '0.5rem' }}>
            - {copy.highScoresLabel} -
          </div>
          {topScores.slice(0, 5).map((entry, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.4rem',
                color: i === 0 ? ui.warning : ui.inactiveButtonColor,
                padding: '3px 0',
                borderBottom: `1px solid ${ui.subtleBorder}`,
              }}
            >
              <span>{i + 1}. {entry.playerName}</span>
              <span>{entry.score.toString().padStart(7, '0')}</span>
              <span style={{ color: ui.secondary }}>{copy.levelWordShort} {entry.levelReached}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
        <button onClick={handleRestart} style={btnStyle(ui)}>RETRY</button>
        <button onClick={handleMenu} style={btnStyle(ui)}>MENU</button>
      </div>
    </div>
  )
}

function btnStyle(ui: ReturnType<typeof getThemeDefinition>['ui']): React.CSSProperties {
  return {
    background: 'transparent',
    border: `2px solid ${ui.accent}`,
    color: ui.accent,
    padding: '0.5rem 1.5rem',
    fontSize: '0.55rem',
    fontFamily: '"Press Start 2P", monospace',
    cursor: 'pointer',
    boxShadow: `0 0 8px ${ui.accent}55`,
  }
}
