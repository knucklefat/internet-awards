# Agent Handoff: Internet Awards – Current State (Feb 2026)

Quick summary for the next agent to pick up the repo.

---

## Repo layout

- **Root** – Product-level docs, LEARNINGS, and app folders.
- **fetchy-mcfetch/** – Phase 1: **nominations** (submit and view nominations for The Internet Awards). Production-ready.
- **ballot-box/** – Phase 2: **voting** (mod creates voting post, adds up to 6 finalists, users vote). Working; mod check fixed.
- **picky-mcpick/** – Archived; replaced by ballot-box.

---

## ballot-box (voting app)

**Purpose:** Let mods create voting posts per award, set up to 6 finalists (name + hero image), and let users vote. One award per post.

**Status:** Working. Deployed as **v0.0.13**. Mods see “Manage finalists” and “Create voting post” when the mod check succeeds.

**Important details:**

1. **Mod check** – Must follow Reddit admin pattern or mod buttons disappear:
   - Use `reddit.getModerators({ subredditName }).all()` (not `.children`, not skipping `.all()`).
   - Use `req.context?.username` / `req.context?.subredditName` first, then `context.*`.
   - Cache the mod list (e.g. `cache(..., { key: 'ballot:moderators_${subredditName}', ttl: 300 })`).
   - Requires **@devvit/web ^0.12.8** (exports `cache` and has platform fix). See `LEARNINGS/BALLOT_BOX_MOD_CHECK_FIX_FEB_2026.md`.

2. **Client API base** – WebView can be served from:
   - **Devvit host** (`*.devvit.net`): use origin-relative URLs, e.g. `/api/awards`.
   - **reddit.com**: use path-relative URLs (prefix with `window.location.pathname`) so requests go under the app path. See `api()` in `ballot-box/src/client/App.tsx`.

3. **Loading state** – If APIs return HTML or throw, the app must still leave loading (use safe JSON parsing + try/catch and set view to e.g. `no-finalists` with a message). See `parseJson()` and the initial `useEffect` in `App.tsx`.

**Paths:** `ballot-box/src/client/App.tsx`, `ballot-box/src/server/index.ts`, `ballot-box/devvit.json`.

---

## fetchy-mcfetch (nominations app)

**Purpose:** Nominations for The Internet Awards: categories, submit nomination, admin panel (mod-only), CSV export, create nomination posts from mod menu.

**Status:** Production. Mod check uses the same pattern as ballot-box (getModerators().all(), cache, req.context first). Uses @devvit/web ^0.12.8.

**Paths:** `fetchy-mcfetch/src/client/App.tsx`, `fetchy-mcfetch/src/server/index.ts`, `fetchy-mcfetch/README.md`.

---

## Shared / cross-app

- **Awards config** – ballot-box has its own `ballot-box/src/shared/config/awards.ts` (award list for voting). fetchy has event/category config in `fetchy-mcfetch/src/shared/config/`.
- **Build/deploy** – From each app folder: `npm run build`, `npx devvit upload`. User authorized build + deploy from the repo.
- **Dev subreddit** – ballot-box: `ballot_box_dev` in devvit.json; fetchy: `internetawards_dev`.

---

## Key LEARNINGS files

- **BALLOT_BOX_MOD_CHECK_FIX_FEB_2026.md** – Why mod check failed and exact fix (getModerators().all(), cache, req.context, 0.12.8).
- **SESSION_FEB_4_2026_SPLASH_ANIMATIONS_MOD_CHECK.md** – getModerators(), caching, context in WebViews (fetchy).
- **DEVVIT_REDIS_AND_DEPLOYMENT.md** – Permissions, entry points, deploy workflow.
- **README.md** (root) – Product overview; **fetchy-mcfetch/README.md** and **ballot-box/README.md** for per-app details.

---

## If something breaks

- **Mod buttons missing in ballot-box** – Check server mod check matches `BALLOT_BOX_MOD_CHECK_FIX_FEB_2026.md` and @devvit/web is ^0.12.8.
- **404 on /api/* in ballot-box** – Check `api()` in client: use `/api/...` on *.devvit.net, path-relative on reddit.com.
- **Stuck on loading** – Check initial fetch error handling and `parseJson()` fallbacks so view always updates from loading.
- **Build fails (e.g. cache not exported)** – Ensure @devvit/web is at least 0.12.8 in that app’s package.json.
