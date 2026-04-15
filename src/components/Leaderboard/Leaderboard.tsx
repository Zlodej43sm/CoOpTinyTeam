import { useEffect, useState } from 'react'
import { getThemeDefinition } from '@/game/config/theme'
import { useGameStore } from '@/store/gameStore'
import { trackGameStarted, trackLeaderboardAction, trackNavigationClick } from '@/analytics/events'
import { loadTopScores } from '@/services/scores'
import type { ScoreEntry } from '@/types'
import { rem } from '@/ui/typography'
import TipButton from '@/components/TipButton/TipButton'

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
    trackLeaderboardAction({ cta: 'retry', outcome: isVictory ? 'victory' : 'gameover' })
    reset()
    bumpRunId()
    trackGameStarted({ level: 1, mode: 'coop', entryPoint: 'leaderboard-retry' })
    setPhase('playing')
  }

  function handleMenu() {
    trackLeaderboardAction({ cta: 'menu', outcome: isVictory ? 'victory' : 'gameover' })
    trackNavigationClick({ cta: 'menu', source: 'leaderboard', targetPhase: 'menu' })
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
        padding: '1.8rem',
        maxWidth: 520,
        width: '100%',
        border: `2px solid ${ui.panelBorder}`,
        borderRadius: 26,
        background: `linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 20%), ${ui.panelBackground}`,
        boxShadow: ui.panelShadow,
      }}
    >
      <img
        src="/assets/logo.mini.webp"
        alt="CoOp Tiny Team"
        style={{ width: 56, height: 56, objectFit: 'contain', filter: ui.logoGlow }}
      />

      <h2 style={{ color: isVictory ? ui.accent : ui.danger, fontSize: rem(1) }}>
        {isVictory ? copy.leaderboardVictory : copy.leaderboardDefeat}
      </h2>

      <div style={{ fontSize: rem(0.55), color: ui.muted, lineHeight: 2 }}>
        <span style={{ color: ui.accent }}>{score.toString().padStart(7, '0')}</span>
        {' '}pts &nbsp;|&nbsp; {copy.levelWord.toLowerCase()}{' '}
        <span style={{ color: ui.secondary }}>{level}</span>
      </div>

      {/* Top scores */}
      {topScores.length > 0 && (
        <div style={{ width: '100%', marginTop: '0.5rem' }}>
          <div style={{ fontSize: rem(0.4), color: ui.muted, marginBottom: '0.5rem' }}>
            - {copy.highScoresLabel} -
          </div>
          {topScores.slice(0, 5).map((entry, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: rem(0.4),
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

      <TipButton />
    </div>
  )
}

function btnStyle(ui: ReturnType<typeof getThemeDefinition>['ui']): React.CSSProperties {
  return {
    background: `linear-gradient(180deg, ${ui.controlBg} 0%, rgba(255,255,255,0.04) 100%)`,
    border: `2px solid ${ui.accent}`,
    color: ui.accent,
    padding: '0.5rem 1.5rem',
    fontSize: rem(0.55),
    fontFamily: '"Press Start 2P", monospace',
    cursor: 'pointer',
    borderRadius: 16,
    boxShadow: `0 0 8px ${ui.accent}55`,
  }
}
