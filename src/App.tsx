import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { getThemeDefinition } from '@/game/config/theme'
import { trackAppLoaded, trackPhaseViewed } from '@/analytics/events'
import GameHub from '@/components/Hub/GameHub'
import MainMenu from '@/components/Menu/MainMenu'
import RulesPage from '@/components/Menu/RulesPage'
import LevelSelect from '@/components/Menu/LevelSelect'
import GameCanvas from '@/components/GameCanvas/GameCanvas'
import LevelComplete from '@/components/LevelComplete/LevelComplete'
import Leaderboard from '@/components/Leaderboard/Leaderboard'
import NameEntry from '@/components/NameEntry/NameEntry'
import PauseOverlay from '@/components/PauseOverlay/PauseOverlay'
import TouchControls from '@/components/TouchControls/TouchControls'
import BottomGameHud from '@/components/HUD/BottomGameHud'

export default function App() {
  const phase = useGameStore((s) => s.phase)
  const paused = useGameStore((s) => s.paused)
  const runId = useGameStore((s) => s.runId)
  const theme = useGameStore((s) => s.theme)
  const themeDef = getThemeDefinition(theme)

  const gameplayPhase = phase === 'playing' || phase === 'boss' || phase === 'kids-arcade'
  const typingGameplayPhase = phase === 'playing' || phase === 'boss'
  const showCanvas = gameplayPhase || phase === 'level-complete'
  const showLeaderboard = phase === 'gameover' || phase === 'victory'

  useEffect(() => {
    trackAppLoaded()
  }, [])

  useEffect(() => {
    trackPhaseViewed(phase)
  }, [phase, runId])

  return (
    <div
      className="app"
      style={{
        background: themeDef.ui.appBackground,
        color: themeDef.ui.text,
        transition: 'background 160ms ease, color 160ms ease',
      }}
    >
      {phase === 'hub' && <GameHub />}
      {phase === 'menu' && <MainMenu />}
      {phase === 'rules' && <RulesPage />}
      {phase === 'level-select' && <LevelSelect />}

      {/* Canvas stays mounted through level-complete so Pixi isn't destroyed */}
      {showCanvas && <GameCanvas key={runId} />}
      {gameplayPhase && <BottomGameHud />}

      {/* Level-complete overlay sits on top of the frozen canvas */}
      {phase === 'level-complete' && <LevelComplete />}
      {typingGameplayPhase && !paused && <TouchControls />}
      {gameplayPhase && paused && <PauseOverlay />}

      {phase === 'name-entry' && <NameEntry />}
      {showLeaderboard && <Leaderboard />}
    </div>
  )
}
