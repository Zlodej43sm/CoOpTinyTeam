# 🕹️ CoOp Tiny Team Arcade

> **Welcome to CoOp Tiny Team** — a browser arcade platform for dev parents and their tiny coders (ages 0–6).
> Play co-op typing games together, and share a family gift wishlist for birthdays, holidays, and surprises.

---

## ✨ Platform highlights

- **Co-op gameplay** — parents and kids play at different skill levels in the same session
- **8 languages** — English, Spanish, German, French, Chinese, Ukrainian, Russian, Indonesian
- **Light / dark UI** — color scheme switcher (top-left) with readable light mode across menus and the game canvas
- **Touch-friendly** — tap-to-play on phones and tablets with larger HUD targets
- **Two game themes** — **Dev Desk** (haunted IDE) and **Trading Floor** (market tape)
- **Privacy-minded analytics** — optional PostHog with session-scoped memory persistence (no cookies by default)
- **Optional cloud scores** — Supabase leaderboard when env keys are set; local scores always work offline

---

## 🎮 Games

### ✅ Code Busters _(playable now)_

A co-op typing game set inside a haunted IDE. Bugs have infected the codebase — squash them by typing the highlighted characters before the timer runs out.

- Parent earns **100 pts** by matching the exact character
- Kid earns **10 pts** by pressing any key
- Smash a crawling bug for **+75**
- 4 levels + a boss fight (`production.ts`)
- **Kids Arcade mode** for pure mash-and-celebrate play

### 🔜 Debug Dash _(coming soon)_

Side-scrolling platformer — run, jump, and dodge runtime errors through procedurally generated code corridors.

### 🔜 Git Rumble _(coming soon)_

Merge-conflict puzzle — resolve conflicts before the deadline and race your teammate to merge branches first.

### 🔜 Deploy Defender _(coming soon)_

Tower defense — protect your production server from waves of breaking changes and rogue midnight deploys.

---

## 🎁 Shared gift wishlist

Family gift lists live at **`/wishlist`**. Open one from the hub or share a direct link with relatives and friends.

### What you can do

- Create and manage multiple wishlists (stored in the browser; synced to cloud when available)
- Add gift items with **name**, optional **product link**, and **notes**
- Share a **view link** so others can see the list and pick a gift
- Share an **owner edit link** (`?edit=…`) to rename the list, edit items, upload a logo, or delete the list
- Let each person **select one gift** so everyone else knows it is taken
- Download a **QR code** for easy sharing
- Upload a custom **wishlist logo** (PNG/JPG/WebP/GIF, up to 300 KB)

### How it works

| Mode | Description |
|---|---|
| **Local only** | Data stays in `localStorage` when the API is unavailable |
| **Cloud saved** | Lists sync to **Cloudflare D1** via the Worker API at `/api/wishlists` |

**URLs**

- Hub entry: `/wishlist`
- Shared list: `/wishlist/{id}`
- Owner edit: `/wishlist/{id}?edit={token}`

Shared list pages are **noindex** for SEO; the public landing page at `/wishlist` stays indexable.

### Safety & limits

Text fields are sanitized on input and on the server (control characters and HTML-like tags stripped). Product links must be valid `http`/`https` URLs to display as clickable links.

| Field | Max length |
|---|---|
| Your name | 40 |
| Wishlist name | 80 |
| Item name | 120 |
| Product link | 2048 |
| Notes | 500 |

Inactive wishlists and items are removed automatically after **365 days** without use (daily cron on Cloudflare).

---

## 🚀 Run locally

```bash
npm install
cp .env.example .env   # optional: PostHog, Supabase, Stripe tip link
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

```bash
npm run build          # typecheck + production build
npm run test           # unit tests (Vitest)
npm run lint           # ESLint
npm run preview        # build + Wrangler dev (Worker + D1 + SPA)
```

**Requirements:** Node 18+, npm 9+.

### Wishlist database (local)

The wishlist API uses **Cloudflare D1**. For full cloud sync while developing:

```bash
# once per Cloudflare account (creates the remote D1 database)
npm run db:create

# apply migrations locally for wrangler dev
npm run db:migrate:local

# apply migrations to production D1
npm run db:migrate:remote
```

Migrations live in [`migrations/`](./migrations/).

Without D1, the wishlist UI still works in **local-only** mode via `localStorage`.

---

## 🌐 Deploy

Production deploys to **Cloudflare Workers + Assets** (SPA + API in one Worker):

```bash
npm run deploy
```

Configure `wrangler.jsonc` with your D1 `database_id` binding before the first deploy.

---

## 📦 Tech stack

| Layer | Choice |
|---|---|
| Framework | React 19 + Vite |
| Language | TypeScript |
| Game rendering | Pixi.js 8 (WebGL) |
| Audio | Howler.js |
| State | Zustand |
| i18n | Custom message bundles (`src/i18n/`) |
| Wishlist API | Cloudflare Worker + D1 |
| QR codes | `react-qr-code` |
| Analytics | PostHog (optional, cookieless) |
| Scores | localStorage + optional Supabase |
| Tips | Optional Stripe Payment Link |
| Deployment | Cloudflare Workers (primary) |

---

## 🗂️ Project layout

```
src/
├── components/          # React UI (hub, menu, wishlist, HUD, …)
├── game/                # Pixi.js game engine, scenes, entities
├── i18n/                # Locale messages (en, es, de, fr, zh, uk, ru, id)
├── services/            # Wishlist, navigation, locale, color scheme, …
├── store/               # Zustand game store
├── worker.ts            # Cloudflare Worker (SPA shell + wishlist API + cron)
└── types/               # Shared TypeScript types

migrations/              # D1 SQL migrations for wishlists
wrangler.jsonc           # Cloudflare Worker + D1 + cron config
```

---

## 🤝 Contributing

Want to add a new game to the platform? See **[CONTRIBUTING.md](./CONTRIBUTING.md)** for the full step-by-step guide.

Contributions are welcome — pull requests are reviewed and merged at the maintainer's discretion.
All contributions become part of the project under the terms of the [LICENSE](./LICENSE.md).

---

## 📄 License

Copyright © 2026 CoOpTinyTeam. All rights reserved.
See [LICENSE](./LICENSE.md) for details.
