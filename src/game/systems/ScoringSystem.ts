import { useGameStore } from '@/store/gameStore'
import { trackCharAction, trackLevelFailed } from '@/analytics/events'

export class ScoringSystem {
  private challengeStartMs = 0

  startChallenge(): void {
    this.challengeStartMs = performance.now()
  }

  recordHit(char: string, exact: boolean): void {
    const pts = exact ? 100 : 10
    const responseTimeMs = Math.round(performance.now() - this.challengeStartMs)
    const { addScore, recordAction } = useGameStore.getState()
    addScore(pts)
    recordAction(exact ? 'match' : 'any')
    trackCharAction({ char, correct: exact, responseTimeMs })
  }

  recordMiss(char: string): void {
    const { lives, score, level, setLives, setPaused, setPhase, recordAction } = useGameStore.getState()
    trackCharAction({ char, correct: false, responseTimeMs: -1 })
    recordAction('miss')
    if (lives <= 1) {
      setLives(0)
      setPaused(false)
      trackLevelFailed({ level, score, reason: 'bugs_reached' })
      setPhase('name-entry')
    } else {
      setLives(lives - 1)
    }
  }
}
