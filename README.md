# 🕹️ CoOp Tiny Team Arcade

> **Welcome to CoOp Tiny Team** — a growing arcade platform built for dev parents and their tiny coders.
> Every game here is designed so a parent and a kid aged 0–6 can play together, each at their own level.

---

## 🎮 Games

### ✅ Code Busters _(playable now)_
A co-op typing game set inside a haunted IDE. Bugs have infected the codebase — squash them by typing the highlighted characters before the timer runs out.

- Parent earns **100 pts** by matching the exact character
- Kid earns **10 pts** by pressing any key
- 4 levels + a boss fight (`production.ts`)
- Two themes: **Dev Desk** and **Trading Floor**
- Kids Arcade mode for pure mash-and-celebrate play

### 🔜 Debug Dash _(coming soon)_
Side-scrolling platformer — run, jump, and dodge runtime errors through procedurally generated code corridors.

### 🔜 Git Rumble _(coming soon)_
Merge-conflict puzzle — resolve conflicts before the deadline and race your teammate to merge branches first.

### 🔜 Deploy Defender _(coming soon)_
Tower defense — protect your production server from waves of breaking changes and rogue midnight deploys.

---

## 🚀 Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

```bash
npm run build   # production build
npm run test    # run unit tests
```

**Requirements:** Node 18+, npm 9+.

---

## 🤝 Contributing

Want to add a new game to the platform? See **[CONTRIBUTING.md](./CONTRIBUTING.md)** for the full step-by-step guide.

Contributions are welcome — pull requests are reviewed and merged at the maintainer's discretion.
All contributions become part of the project under the terms of the [LICENSE](./LICENSE).

---

## 📦 Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 + Vite |
| Language | TypeScript |
| Game rendering | Pixi.js (WebGL) |
| Audio | Howler.js |
| State | Zustand |
| Analytics | PostHog (cookieless, COPPA-safe) |
| Scores | localStorage + optional Supabase |
| Deployment | Cloudflare Pages / Vercel |

---

## 📄 License

Copyright © 2026 CoOpTinyTeam. All rights reserved.
CoOpTinyTeam is a brand and project by Oleksii Povolotskyi.
See [LICENSE](./LICENSE) for details.
