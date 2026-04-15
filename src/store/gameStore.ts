import { create } from 'zustand'
import type { GamePhase, GameTheme, PlayerAction } from '@/types'

interface GameState {
  phase: GamePhase
  theme: GameTheme
  score: number
  level: number
  lives: number
  runId: number
  soundEnabled: boolean
  paused: boolean
  playerName: string
  activeChar: string | null
  lastAction: PlayerAction
  footerChallengeProgress: number
  footerLevelProgress: number
  footerLevelGoal: number

  setPhase: (phase: GamePhase) => void
  setTheme: (theme: GameTheme) => void
  addScore: (pts: number) => void
  setLevel: (level: number) => void
  setLives: (lives: number) => void
  bumpRunId: () => void
  setSoundEnabled: (enabled: boolean) => void
  setPaused: (paused: boolean) => void
  setPlayerName: (name: string) => void
  setActiveChar: (char: string | null) => void
  recordAction: (action: PlayerAction) => void
  setFooterChallengeProgress: (progress: number) => void
  setFooterLevelStats: (progress: number, goal: number) => void
  resetFooterHud: () => void
  reset: () => void
}

const DEFAULT_LIVES = 3
const SOUND_PREF_KEY = 'coop-tiny-team-sound-enabled'
const LEGACY_MUSIC_PREF_KEY = 'coop-tiny-team-music-enabled'
const THEME_PREF_KEY = 'coop-tiny-team-theme'

function readInitialSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true

  try {
    const raw =
      window.localStorage.getItem(SOUND_PREF_KEY) ??
      window.localStorage.getItem(LEGACY_MUSIC_PREF_KEY)
    if (raw === null) return true
    return raw !== 'false'
  } catch {
    return true
  }
}

function persistSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(SOUND_PREF_KEY, String(enabled))
  } catch {
    // ignore storage failures and keep the in-memory preference
  }
}

function readInitialTheme(): GameTheme {
  if (typeof window === 'undefined') return 'dev'

  try {
    return window.localStorage.getItem(THEME_PREF_KEY) === 'trading'
      ? 'trading'
      : 'dev'
  } catch {
    return 'dev'
  }
}

function persistTheme(theme: GameTheme): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(THEME_PREF_KEY, theme)
  } catch {
    // ignore storage failures and keep the in-memory preference
  }
}

export const useGameStore = create<GameState>((set) => ({
  phase: 'hub',
  theme: readInitialTheme(),
  score: 0,
  level: 1,
  lives: DEFAULT_LIVES,
  runId: 0,
  soundEnabled: readInitialSoundEnabled(),
  paused: false,
  playerName: 'PLAYER',
  activeChar: null,
  lastAction: null,
  footerChallengeProgress: 0,
  footerLevelProgress: 0,
  footerLevelGoal: 0,

  setPhase: (phase) => set({ phase }),
  setTheme: (theme) => {
    persistTheme(theme)
    set({ theme })
  },
  addScore: (pts) => set((s) => ({ score: s.score + pts })),
  setLevel: (level) => set({ level }),
  setLives: (lives) => set({ lives }),
  bumpRunId: () => set((state) => ({ runId: state.runId + 1 })),
  setSoundEnabled: (soundEnabled) => {
    persistSoundEnabled(soundEnabled)
    set({ soundEnabled })
  },
  setPaused: (paused) => set({ paused }),
  setPlayerName: (playerName) => set({ playerName }),
  setActiveChar: (char) => set({ activeChar: char }),
  recordAction: (action) => set({ lastAction: action }),
  setFooterChallengeProgress: (footerChallengeProgress) => set({ footerChallengeProgress }),
  setFooterLevelStats: (footerLevelProgress, footerLevelGoal) => set({
    footerLevelProgress,
    footerLevelGoal,
  }),
  resetFooterHud: () => set({
    footerChallengeProgress: 0,
    footerLevelProgress: 0,
    footerLevelGoal: 0,
  }),
  reset: () => set((state) => ({
    score: 0,
    level: 1,
    lives: DEFAULT_LIVES,
    paused: false,
    activeChar: null,
    lastAction: null,
    footerChallengeProgress: 0,
    footerLevelProgress: 0,
    footerLevelGoal: 0,
    theme: state.theme,
    soundEnabled: state.soundEnabled,
    playerName: state.playerName || 'PLAYER',
  })),
}))
