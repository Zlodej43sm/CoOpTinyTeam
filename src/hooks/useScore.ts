import { useGameStore } from '@/store/gameStore'

export function useScore() {
  const score = useGameStore((s) => s.score)
  const addScore = useGameStore((s) => s.addScore)
  return { score, addScore }
}
