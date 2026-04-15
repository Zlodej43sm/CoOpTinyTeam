# Contributing to CoOp Tiny Team Arcade

Thank you for your interest in contributing!
This guide explains how to add a brand-new game to the platform.

> **All contributions are subject to the [LICENSE](./LICENSE).**
> By submitting a pull request you agree that your contribution is
> licensed under the same terms and that all intellectual-property
> rights remain with CoOpTinyTeam (Oleksii Povolotskyi).

---

## Table of Contents

1. [Before You Start](#before-you-start)
2. [Project Structure](#project-structure)
3. [Step-by-Step: Adding a New Game](#step-by-step-adding-a-new-game)
4. [Game Registry Reference](#game-registry-reference)
5. [Coding Standards](#coding-standards)
6. [Pull-Request Checklist](#pull-request-checklist)

---

## Before You Start

- Open an **Issue** first and describe your game idea. This avoids duplicate work and lets the maintainer give early feedback before you invest time.
- Make sure your game fits the platform's target audience: **co-op fun for dev parents and kids aged 0–6**. At least one mode must be accessible to very young players.
- Fork the repo, create a feature branch (`git checkout -b game/your-game-id`), and open a PR when ready.

---

## Project Structure

```
src/
├── games/
│   ├── registry.ts          ← register your game HERE (one entry)
│   └── your-game-id/        ← all game-specific code lives here
│       ├── index.tsx         ← root component (exported as default)
│       ├── store.ts          ← optional Zustand store for game state
│       ├── config.ts         ← level/difficulty/theming constants
│       └── components/       ← sub-components used only by this game
│
├── components/
│   └── Hub/
│       └── GameHub.tsx       ← platform landing page (don't touch)
│
└── types/
    └── index.ts              ← add your phase token here
```

---

## Step-by-Step: Adding a New Game

### 1 — Add a phase token

Open `src/types/index.ts` and add a new literal to `GamePhase`:

```typescript
export type GamePhase =
  | 'hub'
  | 'menu'
  // ... existing phases ...
  | 'my-game'          // ← add yours here
  | 'my-game-over'     // ← add sub-phases as needed
```

Keep names lowercase kebab-case and prefix them with your game id to avoid collisions (e.g. `debug-dash-playing`, `debug-dash-gameover`).

### 2 — Create your game folder

```
src/games/your-game-id/
```

Your root component must be `index.tsx` and export a default React component:

```tsx
// src/games/your-game-id/index.tsx
export default function YourGame() {
  // render your game
}
```

- Your game is responsible for all its own sub-phases and navigation.
- When the player wants to leave, call `useGameStore((s) => s.setPhase)('hub')` to return to the hub.
- Do **not** import from other games' folders.

### 3 — Wire it into App.tsx

Open `src/App.tsx` and import + render your root component:

```tsx
import YourGame from '@/games/your-game-id'

// inside the JSX:
{phase === 'my-game' && <YourGame />}
```

If your game has multiple sub-phases, handle them inside your component rather than multiplying top-level conditionals.

### 4 — Register in the hub

Open `src/games/registry.ts` and add an entry to `GAMES_REGISTRY`:

```typescript
{
  id: 'your-game-id',                  // unique kebab-case slug
  title: 'YOUR GAME TITLE',            // ALL CAPS, short
  subtitle: 'GENRE / ONE-LINER',       // e.g. "SIDE-SCROLL PLATFORMER"
  description:
    'One or two sentences describing the gameplay.',
  icon: '🎮',                          // emoji thumbnail (swap for a real asset later)
  accentColor: '#5ec8ff',              // unique 6-digit hex — pick something not used yet
  badge: 'NEW',                        // optional — shown top-right on the tile
  targetPhase: 'my-game',             // the phase to set on "PLAY NOW" click
},
```

The hub renders tiles in registry order. The first entry is always **Code Busters** — add yours after it.

### 5 — Add a thumbnail (optional but encouraged)

Drop a `thumbnail.webp` (256×256 px, pixel-art style) into `public/assets/games/your-game-id/` and update your registry entry with an `icon` field pointing to the asset path when the asset system is extended.

### 6 — Tests

Add at least a smoke test that renders your root component without crashing:

```tsx
// src/games/your-game-id/index.test.tsx
import { render } from '@testing-library/react'
import YourGame from '.'

test('renders without crashing', () => {
  render(<YourGame />)
})
```

Run `npm test` and make sure all existing tests still pass.

---

## Game Registry Reference

Full type definition for `GameEntry`:

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | ✅ | Unique kebab-case slug |
| `title` | `string` | ✅ | Short all-caps name |
| `subtitle` | `string` | ✅ | Genre / one-liner |
| `description` | `string` | ✅ | 1–2 sentence description |
| `icon` | `string` | ✅ | Emoji or asset path |
| `accentColor` | `string` | ✅ | 6-digit hex — **unique per game** |
| `badge` | `string` | — | Badge text (e.g. `"NEW"`, `"BETA"`) |
| `comingSoon` | `boolean` | — | Greys out tile, hides CTA |
| `targetPhase` | `GamePhase` | — | Required for playable games |

---

## Coding Standards

- **TypeScript** — no `any`, no implicit `any`. Strict mode is on.
- **React** — functional components only, hooks only. No class components.
- **Styles** — inline styles or CSS Modules. No global CSS from inside a game folder.
- **State** — use Zustand. Keep your store in `src/games/your-game-id/store.ts`.
- **Assets** — place under `public/assets/games/your-game-id/`. Max 2 MB per file.
- **No external runtime deps** without prior discussion in the issue.
- Follow the pixel-art / retro-terminal aesthetic: `"Press Start 2P"` font, dark backgrounds, neon accents.

---

## Pull-Request Checklist

Before opening a PR, verify:

- [ ] New phase token(s) added to `src/types/index.ts`
- [ ] Game folder created at `src/games/your-game-id/`
- [ ] Root component exported as default from `index.tsx`
- [ ] Game wired into `src/App.tsx`
- [ ] Registry entry added to `src/games/registry.ts` (after Code Busters)
- [ ] `npm run build` passes with zero TypeScript errors
- [ ] `npm test` passes — existing tests unbroken, smoke test added
- [ ] PR description explains the game concept and target age range
- [ ] No hardcoded API keys, tokens, or secrets

---

Questions? Open an issue or contact the maintainer at **a.povolotskiy@gmail.com**.
