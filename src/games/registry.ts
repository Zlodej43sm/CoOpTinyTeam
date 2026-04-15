/**
 * CoOp Tiny Team — Game Registry
 *
 * Add a new entry here to register your game on the hub landing page.
 * See CONTRIBUTING.md for the full step-by-step guide.
 *
 * Copyright © 2024 CoOpTinyTeam. All rights reserved.
 * CoOpTinyTeam is a brand and project by Oleksii Povolotskyi (a.povolotskiy@gmail.com).
 */

import type { GamePhase } from '@/types'

export interface GameEntry {
  /** Unique slug for the game, kebab-case (e.g. "code-busters") */
  id: string
  /** Short all-caps title shown on the tile */
  title: string
  /** Genre / one-liner shown below the title */
  subtitle: string
  /** 1–2 sentence description of the gameplay */
  description: string
  /** Emoji icon used as the tile thumbnail until a real asset is added */
  icon: string
  /**
   * 6-digit hex accent colour unique to this game.
   * Used for the tile border, glow, and CTA button.
   */
  accentColor: string
  /**
   * Optional badge text shown in the top-right corner (e.g. "NEW", "BETA").
   * Only shown for playable (non-comingSoon) entries.
   */
  badge?: string
  /** When true the tile is greyed-out and shows a "COMING SOON" label. */
  comingSoon?: boolean
  /**
   * The GamePhase to set when the player clicks "PLAY NOW".
   * Required for playable games; omit for comingSoon entries.
   */
  targetPhase?: GamePhase
}

export const GAMES_REGISTRY: GameEntry[] = [
  // ─── GAME 1 — Code Busters (the original CoOp Tiny Team game) ────────────
  {
    id: 'code-busters',
    title: 'CODE BUSTERS',
    subtitle: 'CO-OP TYPING GAME',
    description:
      'Squash bugs by typing highlighted characters. Co-op mode for parent + kid — 4 levels plus a boss fight.',
    icon: '🐛',
    accentColor: '#39ff14',
    badge: 'PLAY NOW',
    targetPhase: 'menu',
  },

  // ─── GAME 2 (coming soon) ─────────────────────────────────────────────────
  {
    id: 'debug-dash',
    title: 'DEBUG DASH',
    subtitle: 'SIDE-SCROLL PLATFORMER',
    description:
      'Run, jump, and dodge runtime errors through procedurally generated code corridors.',
    icon: '🏃',
    accentColor: '#ff6b77',
    comingSoon: true,
  },

  // ─── GAME 3 (coming soon) ─────────────────────────────────────────────────
  {
    id: 'git-rumble',
    title: 'GIT RUMBLE',
    subtitle: 'MERGE CONFLICT PUZZLE',
    description:
      'Resolve merge conflicts before the deadline. Race your teammate to merge branches first.',
    icon: '🔀',
    accentColor: '#c792ea',
    comingSoon: true,
  },

  // ─── GAME 4 (coming soon) ─────────────────────────────────────────────────
  {
    id: 'deploy-defender',
    title: 'DEPLOY DEFENDER',
    subtitle: 'TOWER DEFENSE',
    description:
      'Protect production from waves of breaking changes and rogue midnight deploys.',
    icon: '🚀',
    accentColor: '#ffcb6b',
    comingSoon: true,
  },
]
