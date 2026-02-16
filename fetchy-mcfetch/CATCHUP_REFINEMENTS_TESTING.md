# fetchy-mcfetch – Catch-up for Refinements & Testing

**Focus:** We are working exclusively on refinements and testing of this app (nomination phase only). Use this doc to get up to speed.

---

## What this app is

- **Name:** fetchy-mcfetch (The Internet Awards – Nominations).
- **Purpose:** Reddit Devvit app for **Phase 1 only**: users nominate posts (or link-free entries) to award categories; mods manage the event, export CSV, and create nomination posts from the mod menu. Voting is a separate app (ballot-box).
- **Status:** Production-ready (v0.0.88 per README). Dev sub: **r/internetawards_dev**. Single event, 24 awards in 6 categories.

---

## Tech stack

| Layer      | Tech |
|-----------|------|
| Platform  | Reddit Devvit |
| Client    | React 19, TypeScript, Vite, Tailwind-style CSS |
| Server    | Express 5, Node (serverless via Devvit) |
| Data      | Redis (sorted sets + hashes) |
| Deploy    | `devvit upload` (client + server bundled) |

- **@devvit/web:** ^0.12.8 (required for mod check and cache).
- **Entrypoints:** Default = `splash.html` (inline); main app = `index.html`. Mod menu creates posts using the default entry.

---

## Repo layout (what to touch)

```
fetchy-mcfetch/
├── src/
│   ├── client/
│   │   ├── App.tsx              # Main nomination UI (categories, list, submit, preview)
│   │   ├── main.tsx, index.html # Entry
│   │   ├── splash.html, splash/ # Splash screen
│   │   ├── index.css            # Global styles
│   │   ├── components/
│   │   │   └── AdminPanel.tsx   # Mod-only: stats, export CSV, clear all
│   │   ├── hooks/useCounter.ts  # (if used)
│   │   ├── game/                # Separate game entry (game.html) – confirm if in use
│   │   └── public/images/      # Award headers, banners, icons
│   ├── server/
│   │   ├── index.ts             # All API + internal routes, Redis, Reddit API, mod check
│   │   └── core/post.ts         # createPost (submitCustomPost)
│   └── shared/
│       ├── config/event-config.ts  # Categories, groups, event copy
│       └── types/event.ts, api.ts  # Types
├── assets/                      # Splash/media for Devvit
├── scripts/
│   └── add-resolved-thing.js   # CSV script: add "Resolved Thing" (optional LLM)
├── devvit.json                  # App config, menu, entrypoints, triggers
├── DESIGN_DOC_NOMINATION_PHASE.md  # Design doc for Reddit eng
├── README.md                    # Full overview, API, troubleshooting
└── CATCHUP_REFINEMENTS_TESTING.md  # This file
```

---

## Features to refine/test

1. **Nomination flow**
   - Pick category → see list of nominations → submit with **Reddit URL** and/or **link-free** (name/description).
   - Link-free uses `thingSlug` (normalized slug) for identity; "Nominate too" increments `voteCount` for same slug in same category.
   - Post preview: server fetches post by URL (`getPostById`); design doc says **all Reddit API calls cached** (ensure preview/post fetch is cached if not already).

2. **Mod experience**
   - Mod check: `getModerators({ subredditName }).all()` + cache + `req.context` first (see `LEARNINGS/BALLOT_BOX_MOD_CHECK_FIX_FEB_2026.md`).
   - Admin: type "admin" or use admin button → AdminPanel (stats, export CSV, clear all). Export can be clipboard or CSV download; 401 on some export paths is a known limitation (see README).

3. **Data**
   - Redis: sorted set for order; hash per nomination (`nomination:category:postId` or `nomination:category:free:thingSlug`). Fields include voteCount, thingSlug for link-free.
   - CSV export: includes category, title, author, URL, reason, thingSlug, voteCount, etc. Optional script `scripts/add-resolved-thing.js` for "Resolved Thing" column (optional LLM).

4. **UX**
   - Splash → main app; categories and awards list from `event-config.ts`; banners/GIFs from `public/images/banners` and category-headers.

---

## Nomination cards (next focus)

**Where they appear**
- **Submit form (after submit):** After you submit a nomination, “Current Nominees in [category]” shows up to **5** cards (`.nominations-grid` inside `.nominees-section`). Below that is “Nominate for other awards in this category” (related-awards grid).
- **List view (“View All Nominations & Stats”):** “All Nominations” screen shows **all** nomination cards in one scrollable list (same `.nominations-grid`), with list header + event stats (total nominations, nominators, categories).

**Structure (each card)**
- **Root:** `<div className="nomination-card">`.
- **Thumbnail (optional):** `<img className="nomination-thumbnail">` – only if `nom.thumbnail`; click opens `nom.url` in new tab when `hasLink`.
- **Content:** `<div className="nomination-content">`
  - Category badge: `.category-badge-small` (category icon/emoji + name + “Nominee” label).
  - Title: `<h4 className="nomination-title">` – truncated to 100 chars; clickable when `hasLink` (opens post).
- **Actions:** `<div className="nomination-actions">`
  - “🔗 VIEW POST” link when `hasLink`.
  - “⬆️ +1 Nominate too” button when `hasLink || nom.thingSlug`; shows `(nom.voteCount)` when > 1.

**Data (Nomination type)** – `src/shared/types/event.ts`
- `title`, `category`, `url?`, `thumbnail?`, `voteCount?`, `thingSlug?`; optional `author`, `subreddit`, `karma`, `nominatedBy`, `nominationReason`, etc.

**Layout (CSS)**
- **Desktop:** `.nomination-card` is a grid: `grid-template-columns: 80px 1fr auto`; thumbnail left (80px), content middle, actions right. `.nominations-grid` is a single column of cards with `gap: 8px`.
- **Mobile (max-width: 768px):** Card becomes `60px 1fr`; `.nomination-actions` moves to full-width row below (row 3); `.nominate-text` (“Nominate too”) is hidden so only “⬆️ +1” shows.
- **Styles:** Card has gradient background, 2px border, 8px radius; hover border/glow; thumbnail 70×50 (60×45 on mobile); `.category-badge-small`, `.view-post-link`, `.nominate-too-button` (teal gradient).

**Files to touch for card refinements**
- **App.tsx:** Two blocks – ~line 536 (submit form: `nominations.slice(0, 5).map`) and ~line 704 (list view: `nominations.map`). Same card markup; only context (section title, related awards) differs.
- **index.css:** `.nomination-card`, `.nominations-grid`, `.nomination-thumbnail`, `.nomination-content`, `.nomination-title`, `.nomination-actions`, `.view-post-link`, `.nominate-too-button`, `.category-badge-small`, `.nominee-label`; responsive block around 1292–1323 (`.nomination-card` mobile layout).

**Behavior notes**
- Link-free entries: no thumbnail, no “VIEW POST”; “Nominate too” still works via `thingSlug`.
- `nominateThisToo()` is called with category + `postUrl` and/or `thingSlug`; submit form passes `selectedCategory?.id` as third arg; list view does not (reloads all + stats).

---

## Commands (run from `fetchy-mcfetch/`)

| Command | Purpose |
|--------|--------|
| `npm install` | Install deps (postinstall runs build) |
| `npm run dev` | Client + server watch + devvit playtest (uses r/internetawards_dev) |
| `npm run build` | Build client + server → dist/ |
| `npm run deploy` | Build + devvit upload |
| `npm run check` | Type-check, lint, prettier |
| `devvit logs internetawards_dev` | View server logs |
| `devvit install internetawards_dev fetchy-mcfetch` | Install on dev sub |

---

## Testing (current state)

- **No automated tests in repo** (no `*.test.*` files). Vitest is in devDependencies; good candidate for unit tests (e.g. slug normalization, API response shapes).
- **Manual testing:** Use `npm run dev`, open playtest URL, create a nomination post via mod menu, submit nominations (with and without link), open admin panel as mod, export CSV, test link-free "Nominate too" and voteCount.
- **WebView cache:** Devvit caches aggressively; use a new post or versioned assets if UI changes don’t appear after deploy.

---

## Design doc & constraints

- **DESIGN_DOC_NOMINATION_PHASE.md** – States all Reddit API calls are cached; mod check pattern; no new content type; subreddit-scoped. Keep implementation aligned when refining.
- **LEARNINGS/** (repo root) – Mod check fix, agent handoff, Redis/deploy notes. Useful for regression checks (e.g. after dependency bumps).

---

## Quick checklist for a refinement

- [ ] Change in `src/client/` or `src/server/`?
- [ ] If server: any new or changed Reddit API usage? → add/fix caching.
- [ ] If mod-only UI: mod check still correct (getModerators().all(), cache, req.context)?
- [ ] Run `npm run check` before committing.
- [ ] Test on r/internetawards_dev (new post if UI changed).
- [ ] Update README or this catchup doc if behavior or commands change.

---

## Related docs

- **README.md** – Full feature list, API, Redis schema, troubleshooting, install.
- **DESIGN_DOC_NOMINATION_PHASE.md** – For Reddit core eng; caching and mod check stated there.
- **../LEARNINGS/AGENT_HANDOFF_INTERNET_AWARDS.md** – Overall product state (both apps).
- **../NOMINATION_LINK_FREE_PLAN.md** – Product layers (link-optional, thing identity, CSV).
