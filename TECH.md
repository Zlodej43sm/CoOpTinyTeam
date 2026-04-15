# TECH.md — CoOp Tiny Team

## Architecture Overview

```
Browser
  └── React (UI shell — menus, HUD, leaderboard)
        └── GameCanvas component
              └── Pixi.js Application (WebGL game loop)
                    ├── Scenes (Menu / Level / Boss / GameOver)
                    ├── Entities (Coder, Bug, CharToken)
                    └── Systems (Input, Scoring, WaveGen, Audio)
```

React owns routing and UI chrome. Pixi.js owns everything inside the canvas.
They communicate through a shared Zustand store — React reads it for HUD, Pixi writes it on game events.

---

## Tech Stack

### Core

| Package | Version | Purpose |
|---|---|---|
| `react` | ^19 | UI shell, menus, HUD |
| `vite` | ^6 | Dev server, bundler |
| `typescript` | ^5 | Type safety |
| `pixi.js` | ^8 | WebGL game rendering, sprites, particles |
| `@pixi/react` | ^8 | Pixi canvas as a React component |
| `zustand` | ^5 | Shared game state (React ↔ Pixi) |
| `howler` | ^2 | 8-bit sound effects and music |

### Backend / Storage

| Package | Version | Purpose |
|---|---|---|
| `@supabase/supabase-js` | ^2 | Optional cloud leaderboard |

### Analytics

| Package | Version | Purpose |
|---|---|---|
| `posthog-js` | ^1 | Event analytics, cookieless mode |

### Dev / Tooling

| Package | Version | Purpose |
|---|---|---|
| `eslint` | ^9 | Linting |
| `prettier` | ^3 | Formatting |
| `vitest` | ^2 | Unit tests |
| `@testing-library/react` | ^16 | Component tests |

---

## Project Structure

```
CoOpTinyTeam/
├── public/
│   └── assets/
│       ├── sprites/            # Pixel art .png spritesheets
│       │   ├── coder.png       # Parent character sprite
│       │   ├── sidekick.png    # Kid character sprite
│       │   └── bugs/           # Enemy bug sprites
│       ├── sounds/             # .mp3 / .ogg 8-bit audio
│       │   ├── match.mp3       # Correct character matched
│       │   ├── miss.mp3        # Wrong key / timeout
│       │   ├── levelup.mp3
│       │   └── bgm/            # Background music per level
│       └── fonts/
│           └── press-start-2p.woff2   # Retro pixel font
│
├── src/
│   ├── game/                   # All Pixi.js game logic
│   │   ├── Game.ts             # Pixi Application bootstrap
│   │   ├── scenes/
│   │   │   ├── MenuScene.ts
│   │   │   ├── LevelScene.ts   # Core gameplay scene
│   │   │   ├── BossScene.ts
│   │   │   └── GameOverScene.ts
│   │   ├── entities/
│   │   │   ├── CharToken.ts    # A single scrolling character/token
│   │   │   ├── CodeWave.ts     # Row of CharTokens (one wave)
│   │   │   ├── Bug.ts          # Enemy that advances on miss
│   │   │   └── Coder.ts        # Player character sprite
│   │   ├── systems/
│   │   │   ├── InputSystem.ts  # Keypress → action mapping
│   │   │   ├── WaveSystem.ts   # Spawns and scrolls code waves
│   │   │   ├── ScoringSystem.ts
│   │   │   └── AudioSystem.ts  # Howler wrapper
│   │   └── config/
│   │       ├── levels.ts       # Level definitions (speed, charset, etc.)
│   │       └── theme.ts        # Color palette, IDE syntax colors
│   │
│   ├── components/             # React UI components
│   │   ├── GameCanvas/
│   │   │   └── GameCanvas.tsx  # Mounts Pixi app, passes ref to game
│   │   ├── HUD/
│   │   │   ├── ScoreDisplay.tsx
│   │   │   ├── LivesDisplay.tsx
│   │   │   └── LevelBadge.tsx
│   │   ├── Menu/
│   │   │   ├── MainMenu.tsx
│   │   │   └── LevelSelect.tsx
│   │   └── Leaderboard/
│   │       └── Leaderboard.tsx
│   │
│   ├── hooks/
│   │   ├── useKeypress.ts      # Global keypress listener
│   │   └── useScore.ts         # Read/write score to store + storage
│   │
│   ├── store/
│   │   └── gameStore.ts        # Zustand store — single source of truth
│   │
│   ├── analytics/
│   │   └── events.ts           # Posthog event helpers (typed)
│   │
│   ├── services/
│   │   ├── scores.ts           # Save/load scores (localStorage + Supabase)
│   │   └── supabase.ts         # Supabase client init
│   │
│   ├── types/
│   │   └── index.ts            # Shared TS types & interfaces
│   │
│   ├── App.tsx                 # Top-level routing (menu / game / leaderboard)
│   └── main.tsx                # Vite entry point, Posthog init
│
├── PLAN.md
├── TECH.md
├── .env.example
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

---

## State Management

Zustand store is the bridge between React and Pixi:

```ts
// store/gameStore.ts
interface GameState {
  phase: 'menu' | 'playing' | 'boss' | 'gameover'
  score: number
  level: number
  lives: number
  activeChar: string | null       // currently highlighted char
  lastAction: 'match' | 'miss' | 'any' | null

  // actions
  setPhase: (phase: GameState['phase']) => void
  addScore: (pts: number) => void
  setActiveChar: (char: string | null) => void
  recordAction: (action: GameState['lastAction']) => void
}
```

- **Pixi writes**: `score`, `lives`, `activeChar`, `lastAction`, `phase`
- **React reads**: everything above for HUD and routing
- **React writes**: `phase` on menu button clicks

---

## Game Loop (LevelScene)

```
tick()
  ├── WaveSystem.update(delta)    → scroll waves, spawn new chars
  ├── InputSystem.flush()         → check pending keypresses vs activeChar
  │     ├── exact match  → +100pts, flash green, squash bug
  │     ├── any key      → +10pts, flash yellow
  │     └── timeout      → miss, bug advances
  ├── BugSystem.update(delta)     → move bugs toward cursor
  ├── ScoringSystem.sync()        → write to store
  └── render()                    → Pixi handles this automatically
```

---

## Level Config Shape

```ts
// game/config/levels.ts
interface LevelConfig {
  id: number
  filename: string            // e.g. 'hello_world.js'
  charset: string[]           // chars that can appear
  waveSpeed: number           // px/sec
  spawnRate: number           // waves per second
  highlightWindow: number     // ms player has to react
  bgmTrack: string            // path to audio file
  isBoss: boolean
}
```

---

## Analytics Events

All events are fired through `analytics/events.ts` — never call `posthog.capture` directly.

```ts
trackGameStarted({ level, mode: 'solo' | 'coop' })
trackCharAction({ char, correct: boolean, responseTimeMs: number })
trackLevelCompleted({ level, score, durationSec })
trackLevelFailed({ level, score, reason: 'timeout' | 'bugs_reached' })
trackScoreSaved({ score, level, storage: 'local' | 'cloud' })
```

Posthog is initialized in `main.tsx` with `persistence: 'memory'` (no cookies, no consent banner needed).

---

## Score Storage

```
Save flow:
  game ends
    → always save to localStorage (instant, no auth)
    → if VITE_SUPABASE_URL is set → also upsert to Supabase scores table

Load flow (leaderboard):
  → fetch from Supabase if available
  → fallback to localStorage
```

Supabase table: `scores (id, player_name, score, level_reached, created_at)`

---

## Environment Variables

```bash
# .env.example

# Supabase (optional — local scores work without this)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Posthog
VITE_POSTHOG_KEY=
VITE_POSTHOG_HOST=https://app.posthog.com

# Tip jar — Stripe Payment Link (Apple Pay / Google Pay / Card / BLIK)
# Leave empty to hide the button. Use test_ link locally, live link in prod.
VITE_TIP_URL=
```

---

## Dev Setup

```bash
npm install
cp .env.example .env.local
npm run dev        # http://localhost:5173
npm run test       # vitest
npm run build      # production build → dist/
```

---

## Deployment (Cloudflare Pages)

1. Push to GitHub
2. Connect repo in Cloudflare Pages dashboard
3. Build command: `npm run build`
4. Output dir: `dist`
5. Add env vars in Cloudflare Pages dashboard → Settings → Environment Variables:
   - `VITE_TIP_URL` — live Stripe Payment Link (`https://buy.stripe.com/…`)
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST`

**Or deploy via GitHub Actions** (`.github/workflows/deploy.yml`):
- Required secrets (Settings → Secrets → Actions):
  - `CLOUDFLARE_API_TOKEN` — token with Cloudflare Pages deploy permission
  - `CLOUDFLARE_ACCOUNT_ID`
  - `VITE_TIP_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST`
- Required variable: `CLOUDFLARE_PAGES_PROJECT` — your Pages project name

Custom domain: set in Cloudflare Pages → Custom Domains → `cooptinyteam.dev`
SSL is automatic.
