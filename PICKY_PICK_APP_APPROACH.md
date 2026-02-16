# Phase 2 App (picky-mcpick) – Approach & Setup

## Why a separate app

- **Phase 1 (fetchy-mcfetch):** Nominations. Users submit nominees; you export CSV and run Layer 3/4 analysis; Reddit staff pick up to 6 finalists per award.
- **Phase 2 (picky-mcpick):** Voting. Users see up to 6 finalists (from staff selection), tap one to vote; winner by votes in a time window.

Two separate Devvit apps in the **same subreddit** keep concerns clean and let you deploy/iterate Phase 2 without touching Phase 1.

---

## Best way to do it

### Option chosen: **Same repo, sibling app folder**

- **Layout:** Repo root = fetchy-mcfetch (nominations). New folder `picky-mcpick/` = Phase 2 app (voting).
- **Pros:**
  - One repo, one clone; shared learnings in `LEARNINGS/` and docs at root.
  - Same tooling (Node, Devvit CLI); run/deploy from each app’s folder.
  - Easy to copy patterns (Redis, server, client) from fetchy-mcfetch.
- **Cons:** None critical. You run `cd picky-mcpick && npm run deploy` for Phase 2 and `npm run deploy` from root for Phase 1.

### What picky-mcpick reuses from fetchy-mcfetch

- **Learnings:** `../LEARNINGS/` (platform, mod check, WebView cache, etc.).
- **Event/categories:** Same award list (for labels and finalist slots); finalists themselves come from staff/config or CSV import, not from nomination Redis.
- **Stack:** React, Vite, Tailwind, Express server, Redis, Devvit (same `@devvit/web` patterns).
- **Assets:** Can reuse award headers/icons from internet-awards if you copy or symlink `public/images`; or start minimal and add later.
- **Subreddit:** Same subreddit; different menu item (e.g. “The Internet Awards – Vote” vs “The Internet Awards – Nominations”).

### Data flow (Phase 2)

- **Finalists:** Up to 6 per award, chosen by Reddit staff from Phase 1 CSV (Layer 4 analysis). Stored in Redis or config (e.g. `finalists:categoryId` → list of { id, title, description?, link? }).
- **Votes:** One vote per user per award (or per round) in a time window. Redis keys e.g. `vote:categoryId:username` → finalistId; or `votes:categoryId:finalistId` counter.
- **Time window:** Config or Redis for vote open/close times; client/server hide or disable voting outside the window.

---

## Repo layout after setup

```
internet-awards/                    # repo root = fetchy-mcfetch (Phase 1)
├── devvit.json
├── package.json
├── src/
├── LEARNINGS/
├── NOMINATION_LINK_FREE_PLAN.md
├── PICKY_PICK_APP_APPROACH.md      # this file
└── picky-mcpick/                   # Phase 2 app
    ├── devvit.json                 # name: picky-mcpick
    ├── package.json                # name: picky-mcpick
    ├── README.md                   # points to ../LEARNINGS, Phase 2 scope
    ├── src/
    │   ├── client/
    │   ├── server/
    │   └── shared/
    └── assets/
```

---

## Commands

| Action        | Phase 1 (nominations) | Phase 2 (voting)        |
|---------------|------------------------|-------------------------|
| Install deps  | `npm install` (root)   | `cd picky-mcpick && npm install` |
| Dev           | `npm run dev` (root)   | `cd picky-mcpick && npm run dev` |
| Deploy        | `npm run deploy` (root)| `cd picky-mcpick && npm run deploy` |
| Install to subreddit | `devvit install <sub> fetchy-mcfetch` | `devvit install <sub> picky-mcpick` |

Same subreddit can have both apps installed; mod menu shows both entries.
