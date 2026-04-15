import posthog from 'posthog-js'
import type { StorageMode } from '@/types'

export function trackGameStarted(payload: { level: number; mode: 'solo' | 'coop' | 'kids' }) {
  posthog.capture('game_started', payload)
}

export function trackCharAction(payload: {
  char: string
  correct: boolean
  responseTimeMs: number
}) {
  posthog.capture('char_action', payload)
}

export function trackLevelCompleted(payload: {
  level: number
  score: number
  durationSec: number
}) {
  posthog.capture('level_completed', payload)
}

export function trackLevelFailed(payload: {
  level: number
  score: number
  reason: 'timeout' | 'bugs_reached'
}) {
  posthog.capture('level_failed', payload)
}

export function trackScoreSaved(payload: {
  score: number
  level: number
  storage: StorageMode
}) {
  posthog.capture('score_saved', payload)
}
