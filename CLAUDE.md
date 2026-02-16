# CLAUDE.md – The Internet Awards (internet-awards repo)

This file is the **single source of truth** for any agent (Claude or other) working on this repository. Use it for goal, context, style, stack, and conventions so all changes stay consistent.

---

## Goal & context

- **Product:** The Internet Awards – a **Reddit-native nomination platform** for community-driven awards. Users nominate posts or link-free entries to award categories; moderators manage the event and export data (CSV) for judging.
- **Phase 1 scope:** Nominations only. Voting/ballot is a separate app (ballot-box); do not implement voting or finalist logic here.
- **Primary app:** `fetchy-mcfetch/` – Devvit Web app (React client + Express server). All commands and paths below assume you are in `fetchy-mcfetch/` unless stated otherwise.
- **Run entirely on Reddit’s Devvit platform:** WebView + serverless backend + Redis. No external hosting. Client talks to server only via `fetch('/api/...')`.

---

## WebView & client (user-facing technologies)

**Users interact almost entirely with the WebView.** All of the following apply to the client in `fetchy-mcfetch/src/client/`. Agents must consider these when changing UI, styling, or behavior.

### Runtime & delivery

- **Reddit WebView:** The app is rendered inside Reddit’s in-app WebView (iOS/Android and web). There is no separate website; the client bundle is served by Devvit as the content of a custom post. Design for this embedded, often mobile-first context.
- **Entry points** (from `devvit.json`): `splash.html` (default/tall), `main` → `index.html` (tall). Built output lives in `dist/client/`; Devvit serves it. Cache can be aggressive; use versioned assets or deploy to see UI changes.

### Client stack (what the WebView runs)

- **React 19** – UI components. Entry: `main.tsx` (mounts `<App />`), main tree in `App.tsx` and `components/` (e.g. `AdminPanel.tsx`).
- **React DOM** – React 19 renderer. No React Native; this is DOM-only.
- **TypeScript** – All client code is TypeScript; types from `src/shared/` where shared with server.
- **Vite 6** – Bundler for the client. Config: `src/client/vite.config.ts` (React plugin, Tailwind plugin). Build: `npm run build:client` or `cd src/client && vite build`; watch: `npm run dev:client`.
- **Tailwind CSS 4** – Via `@tailwindcss/vite` in the Vite config. Use Tailwind utilities where possible; project also has a large `index.css` for custom components (nomination cards, toasts, admin, etc.). Prettier uses `prettier-plugin-tailwindcss`.
- **HTML/CSS/JS only** – Devvit WebView supports standard web: HTML5, CSS3, ES modules. No Node APIs in the client; no direct Redis or Reddit SDK in the client. Data comes only from `fetch('/api/...')`.

### Client files and structure

- **Entry:** `src/client/index.html` (shell), `main.tsx` (imports `App.tsx` and `index.css`).
- **Styles:** `src/client/index.css` – global and component styles; Tailwind + custom (e.g. `.nomination-card`, `.second-nominee-button`, `.toast`). Single large CSS file; keep naming consistent (kebab-case).
- **Assets:** `src/client/public/` – static assets (e.g. `images/icons/`, `images/banners/`). Referenced by path like `/images/icons/nominee/nominee-arrow.png`. Splash assets in `assets/` (see `devvit.json` → `media.dir`).
- **Shared types:** `src/shared/types/event.ts` (and elsewhere) – `Nomination`, `AwardCategory`, `EventStats`, etc. Used by both client and server.

### Network & fetch (client)

- **Same-origin only:** The client may only call the same origin. All server access is via `fetch('/api/...')` (e.g. `GET /api/nominations`, `POST /api/submit-nomination`, `GET /api/preview-post`). Do not fetch external URLs from the client; the server can do that when HTTP fetch domains are allowlisted.

### UX & layout constraints

- **Mobile-first:** Many users are on Reddit mobile. Use responsive layout and touch-friendly targets; test in playtest (including resize/narrow viewport).
- **Reddit-like cards:** Nominee list cards follow Reddit post layout (see `DESIGN_NOMINEE_CARDS.md`): category pill, title, second line, thumbnail top-right, action bar. Divider between cards; no heavy box.
- **Toasts:** Transient feedback (e.g. “YOU HAVE SECONDED THIS NOMINATION!”). Implemented in React state; styled in `index.css` (e.g. `.toast`, `.toast-success`).
- **No vote count in UI:** “Second” shows arrow + “+1” / “Seconded!” only. Vote counts are stored and exported in CSV, not rendered in the WebView.

### Tooling & quality (client)

- **ESLint** – Includes React hooks and React refresh plugins. Run `npm run lint` or `npm run lint:fix` from repo root.
- **Prettier** – Formatting; Tailwind plugin for class sorting. Run `npm run prettier`.
- **Vitest** – Available for unit tests (Vite-based). Optional for client components.

When making changes that affect what users see or tap, consider: WebView runtime, mobile layout, Tailwind + `index.css`, and fetch-only data access.

---

## Repository structure

```
internet-awards/
├── CLAUDE.md                    # This file – read first
├── fetchy-mcfetch/              # Main app: nomination UI + API
│   ├── src/
│   │   ├── client/              # React WebView (UI)
│   │   ├── server/              # Express API, Redis, Reddit calls
│   │   └── shared/              # Types and shared code
│   ├── devvit.json              # Devvit config (permissions, menu, http domains)
│   ├── package.json
│   ├── DESIGN_DOC_NOMINATION_PHASE.md
│   ├── DESIGN_NOMINEE_CARDS.md  # Reddit-like card layout
│   └── README.md
└── .cursor/rules/               # global.mdc, client.mdc, server.mdc
```

---

## Stack & dependencies

- **Runtime:** Node.js 22 (build and server). The **user-facing runtime is the Reddit WebView** (see **WebView & client** section above for full client stack).
- **Client (WebView):** React 19, React DOM, TypeScript, Vite 6, Tailwind CSS 4, `index.css` – see **WebView & client** for entry points, assets, and fetch rules.
- **Server:** Express 5, TypeScript, Vite
- **Platform:** Devvit Web (`@devvit/web`, `devvit` – pin to version in package.json, e.g. 0.12.12)
- **Data:** Redis (via Devvit), Reddit API via Devvit (`getPostById`, `getModerators`, `submitCustomPost`)
- **Build:** `npm run build` = client + server; `npm run dev` = watch client + server + `devvit playtest`
- **Deploy:** `npm run deploy` = build + `devvit upload`

Shared types live in `src/shared/` (e.g. `Nomination`, `AwardCategory`). Client and server both use them.

---

## Code & style guidelines

1. **TypeScript:** Prefer **type aliases** over interfaces. Assume the existing tsconfig/Vite/ESLint/Prettier setup is correct; fix bugs in your code first.
2. **Paths:** Client code in `src/client/`; server in `src/server/`. Client calls only `/api/*` endpoints. No direct Redis or Reddit access from the client.
3. **.cursor rules:** Respect `global.mdc` (client/server/shared folders, type aliases) and any `client.mdc` / `server.mdc` for folder-specific conventions.
4. **Naming:** Keep existing naming (e.g. `nomination-card`, `second-nominee-button`, `getNominationSecondLine`). Add new names in the same style (kebab for CSS, camelCase for JS/TS).

---

## UI/UX conventions (fetchy-mcfetch)

- **Nominee cards:** Follow **Reddit-like layout** (see `DESIGN_NOMINEE_CARDS.md`): header row (category pill + “Nominee”), title, second line, thumbnail top-right, action bar with Second + Link. Use dividers between cards, not heavy boxes.
- **Second action:** Show **arrow + “+1”** by default; after the user seconds, show **orange arrow + “Seconded!”**. Do **not** show vote count in the UI; votes are stored and included in CSV export only.
- **Toasts:** Success for seconding: “YOU HAVE SECONDED THIS NOMINATION!”. Other toasts as in existing code (e.g. “Nominee submitted successfully”, error messages).
- **Preview:** Post preview can resolve short links (reddit.com/.../s/..., redd.it/...) when HTTP fetch domains are allowlisted in `devvit.json` under `permissions.http.domains` (reddit.com, www.reddit.com, redd.it).
- **Mobile-first:** Layout and touch targets should work on Reddit mobile; test in playtest.

---

## Data & API conventions

- **Redis:** Keys like `nominations:all`, `nomination:${memberKey}`, `user_nomination_count:${username}`, `user_seconded:${username}`. Identity: `category:postId` or `category:free:${thingSlug}`. Do not change key shapes without updating all readers/writers and export.
- **Vote count:** Stored in nomination hashes and in CSV (“Vote Count” column). Never displayed in the app UI.
- **Moderator check:** Use `getModerators({ subredditName }).all()` with caching; user/subreddit from request context first. Required for admin panel and mod-only menu.
- **HTTP fetch:** If the server calls external URLs (e.g. Reddit .json for short links), list domains in `devvit.json` under `permissions.http` (e.g. `"http": { "enable": true, "domains": ["reddit.com", "www.reddit.com", "redd.it"] }`).

---

## Documents to reference

- **DESIGN_DOC_NOMINATION_PHASE.md** – Goals, non-goals, data model, API, ratelimits, mod tooling.
- **DESIGN_NOMINEE_CARDS.md** – Reddit → nominee card mapping and layout rules.
- **README.md** (in fetchy-mcfetch) – Features, categories, dev commands, Fetch Domains section for HTTP allowlist.
- **Parent workspace:** `../CLAUDE.md` (Glass House) for universal Devvit commands and multi-app patterns.

---

## Do not break

- Moderator gating on admin and post-create menu.
- Redis key format and nomination hash fields (CSV and list views depend on them).
- Client-only use of `/api/*` (no external URLs from client).
- Per-user nomination limit (30) and its Redis counter.
- CSV export columns and content (including Vote Count); export is for judges/organizers.

---

## Quick commands (from `fetchy-mcfetch/`)

```bash
npm run dev        # Client + server watch + devvit playtest (see changes before deploy)
npm run build      # Production build
npm run deploy     # Build + upload to Devvit
npm run check      # Type-check, lint, prettier
```

Playtest subreddit: `r/internetawards_dev` (see `devvit.json` → `dev.subreddit`). Open the app via the subreddit menu or an existing custom post.
