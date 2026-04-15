# PLAN.md

## CoOp Tiny Team — Web Game Plan

### Concept

A parent-developer and their tiny coder are trapped inside a haunted IDE. Bugs (literal cartoon bugs) have infected the codebase. The only way to defeat them: type the code correctly as it streams by.

---

## Plot / Narrative

- **Setting**: Inside a glowing, retro terminal styled like VS Code / JetBrains — pixelated and 16-bit
- **Characters**: A ninja coder (parent) + a tiny sidekick coder (kid) — TMNT / Contra pixel art aesthetic
- **Enemies**: Bugs that crawl across the code waves — squash them by typing the matching character
- **Story**: Each level = one "file" to debug. Clear the file → deploy the code → unlock next level

---

## Gameplay Loop

Code streams scroll left-to-right in waves (Matrix-style but colorful like an IDE with syntax highlighting).
A random character lights up with a glow/pulse effect — player has 2–3 seconds to react.
Co-op score is pooled — encourages parent to guide the kid.

| Action | Points | Who |
|---|---|---|
| Press any key when a char is highlighted | 10 pts | Kid (0–6, just mash!) |
| Press the **exact** matching character | 100 pts | Parent |
| Miss / timeout | Bug advances toward cursor | Both lose |

---

## Levels / Progression

1. `hello_world.js` — slow waves, big characters, A–Z only
2. `bug_fix.py` — medium speed, adds numbers 0–9
3. `deploy.sh` — faster, adds symbols `{}`, `[]`, `;`
4. **BOSS**: `production.ts` — rapid fire, screen shakes, Contra-style chaos

---

## Target Audience

Parents who are software developers, playing together with kids aged 0–6.
- Kid can participate by mashing any key and earning points
- Parent earns more by matching exact characters
- Both feel like they're contributing

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | React + Vite | Fast dev, component model fits game UI |
| Game rendering | Pixi.js (WebGL) | Smooth 60fps sprite animation, particle effects |
| Language | TypeScript | Safer, good for game state management |
| Audio | Howler.js | Retro 8-bit sound effects, simple API |
| Styling | CSS Modules | Scoped styles for UI chrome |
| Scores | localStorage + optional Supabase | Local-first, optional cloud leaderboard |
| Assets | Pixel art sprites (Aseprite or free 16-bit packs) | TMNT / Contra aesthetic |
| Deployment | Vercel | One-click deploy |

---

## Analytics

**Privacy note**: audience includes kids under 13 — avoid Google Analytics (COPPA risk). Use cookieless, privacy-first tools.

### Recommended: Posthog (free tier)

- Free up to 1M events/mo — more than enough to start
- Cookieless mode available (no consent banner needed)
- Tracks custom game events, funnels, session replays
- Self-hostable if needed later
- Open source

### Key events to track

| Event | Properties |
|---|---|
| `game_started` | level, player_mode (solo/coop) |
| `char_matched` | correct: true/false, char, response_time_ms |
| `level_completed` | level, score, duration_sec |
| `level_failed` | level, score, reason |
| `boss_reached` | score_at_entry |
| `score_saved` | score, level_reached, local/cloud |
| `session_ended` | total_score, levels_cleared |

### Alternatives

| Tool | Price | Notes |
|---|---|---|
| **Posthog** | Free / $0 | Best for games, event funnels, replays |
| **Umami** | Free (self-host) | Minimal, page-level only, no game events |
| **Plausible** | $9/mo | Beautiful but no custom events on free tier |
| Google Analytics 4 | Free | Avoid — COPPA risk, heavy, cookie-dependent |

---

## Domain & Hosting

### Recommended combo: Cloudflare Pages + Cloudflare Registrar

**Best price/quality ratio** — both free/at-cost, same dashboard, fastest global CDN.

#### Domain options (estimated annual cost via Cloudflare Registrar — at-cost, no markup)

| Domain | Est. Price/yr | Vibe |
|---|---|---|
| `cooptinyteam.com` | ~$10 | Matches project name exactly |
| `cooptinyteam.dev` | ~$12 | Developer audience signal |
| `tinycodebusters.com` | ~$10 | Fun, kid-friendly |
| `codebugs.io` | ~$32 | Catchy but .io is pricey |
| `cooptinyteam.app` | ~$14 | Mobile-friendly signal |

**Suggestion**: `cooptinyteam.dev` — speaks directly to the dev parent audience, memorable, affordable.

#### Hosting comparison

| Host | Free Tier | Paid | Best for |
|---|---|---|---|
| **Cloudflare Pages** | Unlimited deploys, global CDN | $0 (free forever for static) | Best choice — fastest, free |
| **Vercel** | 100GB bandwidth/mo | $20/mo pro | Great DX, easy, slightly slower globally |
| **Netlify** | 100GB bandwidth/mo | $19/mo pro | Similar to Vercel, slightly older DX |
| **GitHub Pages** | Unlimited static | Free | Simple but no edge CDN |

**Recommendation**: Start on **Cloudflare Pages** (free) + buy domain via **Cloudflare Registrar** (~$10–12/yr total cost). Zero markup on domains, automatic SSL, global edge network. Upgrade path to Cloudflare Workers if you add a backend later.

---

## Score Storage

- Local: `localStorage` — no account needed, instant
- Optional cloud: Supabase table with player name + score + level reached
- Leaderboard screen after each game session

---

## Original Ideas (preserved)

- Running funny code lines/waves (PHP Storm / VS Code style)
- Each wave up or down → random letter/number appears
- Click any btn = 10 points, click same as shown = 100 points
- Effects and style of Ninja Tortoise or Contra (Sega/Dendy)
- Base auditory: parents who are software developers with kids 0–6 y.o.
- Ability to store result
