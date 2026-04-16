import posthog from 'posthog-js'
import { isPostHogEnabled } from '@/analytics/config'
import { useGameStore } from '@/store/gameStore'
import type { GamePhase, GameTheme, StorageMode } from '@/types'

type GameMode = 'solo' | 'coop' | 'kids'
type EventProperties = Record<string, string | number | boolean | null | undefined>

const VIEW_EVENT_DEDUPE_MS = 800
const recentEventKeys = new Map<string, number>()

function sanitizeProperties(properties: EventProperties): EventProperties {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined),
  ) as EventProperties
}

function getSharedProperties(): EventProperties {
  const state = useGameStore.getState()

  return sanitizeProperties({
    app_name: 'CoOp Tiny Team',
    app_surface: 'code-busters',
    current_phase: state.phase,
    current_theme: state.theme,
    current_level: state.level,
    current_score: state.score,
    lives_remaining: state.lives,
    run_id: state.runId,
    sound_enabled: state.soundEnabled,
    paused: state.paused,
    active_char: state.activeChar,
    last_action: state.lastAction,
    footer_level_progress: state.footerLevelProgress,
    footer_level_goal: state.footerLevelGoal,
    has_custom_player_name: state.playerName.trim().length > 0 && state.playerName !== 'PLAYER',
    viewport_width: typeof window !== 'undefined' ? window.innerWidth : undefined,
    viewport_height: typeof window !== 'undefined' ? window.innerHeight : undefined,
    path: typeof window !== 'undefined' ? window.location.pathname : undefined,
  })
}

function captureEvent(event: string, properties: EventProperties = {}): void {
  if (!isPostHogEnabled()) return
  posthog.capture(event, {
    ...getSharedProperties(),
    ...sanitizeProperties(properties),
  })
}

function shouldCaptureEvent(key: string, dedupeWindowMs = VIEW_EVENT_DEDUPE_MS): boolean {
  const now = Date.now()
  const lastSentAt = recentEventKeys.get(key)

  if (lastSentAt && now - lastSentAt < dedupeWindowMs) {
    return false
  }

  recentEventKeys.set(key, now)
  return true
}

export function trackAppLoaded(): void {
  if (!shouldCaptureEvent('app_loaded')) return

  captureEvent('app_loaded', {
    document_title: typeof document !== 'undefined' ? document.title : undefined,
  })
}

export function trackPhaseViewed(phase: GamePhase): void {
  const { runId, level } = useGameStore.getState()
  const key = `phase_viewed:${phase}:${runId}:${level}`

  if (!shouldCaptureEvent(key)) return

  captureEvent('phase_viewed', {
    phase,
  })
}

export function trackThemeSelected(payload: {
  theme: GameTheme
  source: string
}): void {
  captureEvent('theme_selected', {
    theme: payload.theme,
    source: payload.source,
  })
}

export function trackNavigationClick(payload: {
  cta: string
  source: string
  targetPhase: GamePhase
}): void {
  captureEvent('navigation_clicked', {
    cta: payload.cta,
    source: payload.source,
    target_phase: payload.targetPhase,
  })
}

export function trackHubGameLaunched(payload: {
  gameId: string
  title: string
  targetPhase: GamePhase
}): void {
  captureEvent('hub_game_launched', {
    game_id: payload.gameId,
    game_title: payload.title,
    target_phase: payload.targetPhase,
  })
}

export function trackLevelSelected(payload: {
  level: number
  source: string
  mode: GameMode
}): void {
  captureEvent('level_selected', {
    level: payload.level,
    source: payload.source,
    mode: payload.mode,
  })
}

export function trackControlUsed(payload: {
  control: 'sound' | 'fullscreen' | 'pause' | 'replay' | 'exit'
  source: string
  enabled?: boolean
}): void {
  captureEvent('game_control_used', {
    control: payload.control,
    source: payload.source,
    enabled: payload.enabled,
  })
}

export function trackPlayerNamed(payload: {
  outcome: 'victory' | 'gameover'
  usedDefaultName: boolean
  nameLength: number
}): void {
  captureEvent('player_named', {
    outcome: payload.outcome,
    used_default_name: payload.usedDefaultName,
    name_length: payload.nameLength,
  })
}

export function trackLeaderboardLoaded(payload: {
  localEntries: number
  cloudEntries: number
  mergedEntries: number
}): void {
  const key = `leaderboard_loaded:${payload.localEntries}:${payload.cloudEntries}:${payload.mergedEntries}`
  if (!shouldCaptureEvent(key)) return

  captureEvent('leaderboard_loaded', {
    local_entries: payload.localEntries,
    cloud_entries: payload.cloudEntries,
    merged_entries: payload.mergedEntries,
  })
}

export function trackLeaderboardAction(payload: {
  cta: 'retry' | 'menu'
  outcome: 'victory' | 'gameover'
}): void {
  captureEvent('leaderboard_action_clicked', {
    cta: payload.cta,
    outcome: payload.outcome,
  })
}

export function trackTipClicked(payload: { source: string }): void {
  captureEvent('tip_clicked', {
    source: payload.source,
  })
}

export function trackScoreSaveFailed(payload: {
  score: number
  level: number
  storage: StorageMode
  reason: 'local_write_failed' | 'cloud_write_failed'
}): void {
  captureEvent('score_save_failed', {
    score: payload.score,
    level: payload.level,
    storage: payload.storage,
    reason: payload.reason,
  })
}

export function trackGameStarted(payload: {
  level: number
  mode: GameMode
  entryPoint?: string
}) {
  captureEvent('game_started', {
    level: payload.level,
    mode: payload.mode,
    entry_point: payload.entryPoint,
  })
}

export function trackCharAction(payload: {
  char: string
  correct: boolean
  responseTimeMs: number
}) {
  captureEvent('char_action', {
    char: payload.char,
    correct: payload.correct,
    response_time_ms: payload.responseTimeMs,
  })
}

export function trackLevelCompleted(payload: {
  level: number
  score: number
  durationSec: number
}) {
  captureEvent('level_completed', {
    level: payload.level,
    score: payload.score,
    duration_sec: payload.durationSec,
  })
}

export function trackLevelFailed(payload: {
  level: number
  score: number
  reason: 'timeout' | 'bugs_reached'
}) {
  captureEvent('level_failed', {
    level: payload.level,
    score: payload.score,
    reason: payload.reason,
  })
}

export function trackScoreSaved(payload: {
  score: number
  level: number
  storage: StorageMode
}) {
  captureEvent('score_saved', {
    score: payload.score,
    level: payload.level,
    storage: payload.storage,
  })
}

export function trackAmbientBugSquashed(payload: {
  level: number
  score: number
}) {
  captureEvent('ambient_bug_squashed', {
    level: payload.level,
    score: payload.score,
  })
}

export function trackBossStarted(payload: {
  level: number
  mode: GameMode
}) {
  captureEvent('boss_started', {
    level: payload.level,
    mode: payload.mode,
  })
}

export function trackBossCompleted(payload: {
  level: number
  score: number
  durationSec: number
}) {
  captureEvent('boss_completed', {
    level: payload.level,
    score: payload.score,
    duration_sec: payload.durationSec,
  })
}

export function trackChallengeTimedOut(payload: {
  char: string
  level: number
}) {
  captureEvent('challenge_timed_out', {
    char: payload.char,
    level: payload.level,
  })
}

export function trackGameInitFailed(payload: {
  error: string
}) {
  captureEvent('game_init_failed', {
    error: payload.error,
  })
}
