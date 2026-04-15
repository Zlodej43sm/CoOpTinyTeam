import type { ScoreEntry } from '@/types'
import {
  trackLeaderboardLoaded,
  trackScoreSaveFailed,
  trackScoreSaved,
} from '@/analytics/events'
import { supabase } from './supabase'

const KEY = 'coop-tiny-team-scores'
const MAX = 10

export function saveScore(entry: Omit<ScoreEntry, 'createdAt'>): void {
  const scores = loadScores()
  const full: ScoreEntry = { ...entry, createdAt: new Date().toISOString() }
  scores.push(full)
  scores.sort((a, b) => b.score - a.score)

  try {
    localStorage.setItem(KEY, JSON.stringify(scores.slice(0, MAX)))
    trackScoreSaved({ score: entry.score, level: entry.levelReached, storage: 'local' })
  } catch {
    trackScoreSaveFailed({
      score: entry.score,
      level: entry.levelReached,
      storage: 'local',
      reason: 'local_write_failed',
    })
  }

  void saveScoreCloud(entry)
}

export function loadScores(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as ScoreEntry[]) : []
  } catch {
    return []
  }
}

export async function saveScoreCloud(entry: Omit<ScoreEntry, 'createdAt'>): Promise<void> {
  if (!supabase) return

  try {
    const { error } = await supabase.from('scores').insert({
      player_name: entry.playerName,
      score: entry.score,
      level_reached: entry.levelReached,
    })

    if (error) throw error
    trackScoreSaved({ score: entry.score, level: entry.levelReached, storage: 'cloud' })
  } catch {
    trackScoreSaveFailed({
      score: entry.score,
      level: entry.levelReached,
      storage: 'cloud',
      reason: 'cloud_write_failed',
    })
  }
}

export async function loadScoresCloud(): Promise<ScoreEntry[]> {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .order('score', { ascending: false })
      .limit(MAX)

    if (error) throw error

    return (data ?? []).map((row) => ({
      playerName: String(row.player_name ?? 'PLAYER'),
      score: Number(row.score ?? 0),
      levelReached: Number(row.level_reached ?? 1),
      createdAt: String(row.created_at ?? new Date(0).toISOString()),
    }))
  } catch {
    return []
  }
}

export async function loadTopScores(): Promise<ScoreEntry[]> {
  const localScores = loadScores()
  const cloudScores = await loadScoresCloud()

  if (cloudScores.length === 0) {
    const topLocalScores = localScores.slice(0, MAX)
    trackLeaderboardLoaded({
      localEntries: localScores.length,
      cloudEntries: 0,
      mergedEntries: topLocalScores.length,
    })
    return topLocalScores
  }

  const merged = new Map<string, ScoreEntry>()
  for (const entry of [...cloudScores, ...localScores]) {
    const key = `${entry.playerName}:${entry.score}:${entry.levelReached}`
    if (!merged.has(key)) {
      merged.set(key, entry)
    }
  }

  const mergedScores = [...merged.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX)

  trackLeaderboardLoaded({
    localEntries: localScores.length,
    cloudEntries: cloudScores.length,
    mergedEntries: mergedScores.length,
  })

  return mergedScores
}
