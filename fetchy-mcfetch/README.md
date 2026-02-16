# Fetch

**A Reddit Devvit app for fetching Reddit content and returning it to a single sub.** Fetch allows members of your community to gather Reddit content by inputting a Name, Description, or reddit url. Currently powering Reddit Run multi-category “nominate and second” flows (awards, polls, crowdsourcing) inside a subreddit. Configure categories, rate limits, and branding; moderate via an in-app admin panel and CSV export.

This repo can be forked and customized for your own event (awards, “best of,” community picks, etc.). It is also used as **The Internet Awards** nomination app; that usage is documented in [INTERNET_AWARDS_USAGE.md](INTERNET_AWARDS_USAGE.md).

---

## What it is

- **Platform:** [Reddit Devvit](https://developers.reddit.com/) (WebView client + serverless Node server + Redis).
- **Purpose:** Let subreddit members fetch and submit **nominations** into multiple **categories**, optionally attach a **Reddit post** (or link-free text), and **second** (support) existing nominations. Moderators manage content and export data.
- **Entry:** Splash screen → “Submit” opens the main WebView: category picker → award/category → submit form → list of other nominees with second buttons.

All commands below are run from the **`fetchy-mcfetch/`** directory.

---

## Capabilities

| Capability | Description |
|------------|-------------|
| **Multi-category events** | One event with many categories; categories can be grouped (e.g. “Games”, “Creators”). Config-driven (no code change for new categories). |
| **Link or link-free nominations** | Nominate with a Reddit post URL (title/thumbnail fetched) or with name/description only (no link). |
| **Seconding (“Nominate too”)** | Users can second existing nominees; count is tracked; one second per user per nomination. |
| **Per-user rate limit** | Configurable cap on **new** nominations per user (e.g. 30); seconding does not count. Enforced server-side; 429 when over limit. **Moderators are exempt** (no limit). |
| **Post preview** | Pasting a Reddit URL (including short links) fetches title/thumbnail for the form. Uses Devvit HTTP fetch for `reddit.com`, `www.reddit.com`, `redd.it`. |
| **Mod-only post creation** | Menu item for moderators creates a custom post that opens the app (splash or main view). |
| **In-App Moderation** | Mod-only panel: stats, nominations list, hide/unhide nominees from lists, flag bad actors, data export, delete all (with confirmation). |
| **Data Dump** | Export all (or filtered) nominations for judging or external processing. |
| **Mobile-first UI** | Responsive layout, toasts, skeleton loading, touch-friendly controls. Nominee list: double-stroke dividers, LOAD MORE for pagination, “JUMP TO OTHER AWARD IN THIS CATEGORY” quick-switch, footer (RULES \| HELP \| REPORT, ©2026 Reddit, Inc.). |

---

## Configuration and options

### Event and categories

- **Source:** `src/shared/config/event-config.ts` (and shared types in `src/shared/types/event.ts`).
- **Exposed via:** `GET /api/event/config` (used by the client).
- **You define:**
  - **Categories** (the 6) – e.g. “Gaming & Hobbies”, “Knowledge” (id, name, tagline, emoji, accentColor, header image path).
  - **Awards** (the 24) – id, name, description, emoji, `category` (id of one of the 6), optional `iconPath`, `headerImage`, `cardColor`, etc.
- **Assets:** Header images and icons are referenced by path (e.g. under `src/client/public/images/`); main banner and splash assets in `assets/` or `src/client/public/` as needed.

### Splash and branding

- **Splash:** `src/client/splash.html` + `src/client/splash.tsx` (logic, e.g. “Submit Nominee” → `requestExpandedMode(..., 'main')`). Copy, logo, and background image are in the HTML/CSS.
- **Post creation (mod menu):** When a mod creates a post, the app uses `src/server/core/post.ts` (splash config, heading, button label, assets). Adjust for your event name and assets.

### Rate limit

- **Default:** 30 new nominations per user per event (seconding does not count).
- **Mod bypass:** Subreddit moderators are exempt from the limit (server and client treat mods as unlimited via `isModeratorUser` and `GET /api/user/nomination-count` → `unlimited: true`).
- **Where:** Server-side in `src/server/index.ts` (`NOMINATION_LIMIT_PER_USER`, `user_nomination_count:*`, `reserveNominationSlot()`). Change the constant to change the limit; delete-all (or delete by category) resets counts for affected users.

### Menu and display name

- **Menu label and description:** `devvit.json` → `menu.items[].label` and `description`. Update to your event name (e.g. “My Awards - Nominations”).
- **App name:** `devvit.json` → `name` (slug, e.g. `fetchy-mcfetch`). Display name in Reddit is often the menu label or splash title.

---

## Moderation

| Feature | Description |
|---------|-------------|
| **Admin panel** | Mod-only; open by hotkey (e.g. type “admin”). Views: nominations list, nominators, categories, awards; sort and filter. |
| **Hide / unhide** | Hide a nomination from public “Other Nominees” lists; hidden entries still visible in admin with “Unhide.” |
| **Shadow ban** | Banned users cannot submit or second; no visible error (treated as failed). Managed in admin. |
| **Export CSV** | Download all nominations (or by category) for judging or scripts. |
| **Delete all** | Clear all nominations (and reset user counts) with confirmation. |

Moderator check uses Reddit’s moderator list for the subreddit (`getModerators().all()`, cached); identity from request context or `devvit-user` header.

---

## Tech stack and structure

- **Client:** React 19, TypeScript, Vite, custom CSS.
- **Server:** Express 5, Node, TypeScript, Vite build.
- **Data:** Redis (Devvit): sorted set for nomination order, hashes per nomination, keys for user counts, seconded state, hidden list, shadow ban list.
- **Reddit:** `getPostById` (preview), `getModerators` (mod check), `submitCustomPost` (mod menu “create post”). HTTP fetch only for public Reddit URLs (short-link resolution).

```
fetchy-mcfetch/
├── src/
│   ├── client/           # WebView app
│   │   ├── App.tsx       # Main UI, views, form, list
│   │   ├── splash.html   # Splash entry
│   │   ├── splash.tsx    # Splash logic
│   │   └── components/  # e.g. AdminPanel
│   ├── server/
│   │   ├── index.ts     # API, Redis, mod checks
│   │   └── core/
│   │       └── post.ts  # Custom post creation
│   └── shared/
│       ├── config/
│       │   └── event-config.ts   # Categories & groups
│       └── types/
│           └── event.ts          # Event/category types
├── assets/               # Splash/media for Devvit
├── devvit.json          # App config, permissions, menu
└── package.json
```

---

## Getting started

### Prerequisites

- Node.js 22+
- [Devvit CLI](https://developers.reddit.com/docs/devvit): `npm install -g devvit`
- Reddit developer account and app linked for Devvit

### Install and run

```bash
cd fetchy-mcfetch
npm install
npm run dev
```

- **`npm run dev`** – Builds client and server, runs Devvit playtest (default test subreddit in `devvit.json`).
- **`npm run build`** – Production build.
- **`npm run deploy`** – Build and upload to Devvit (`devvit upload`).

### Install on a subreddit

- **CLI (immediate):** `devvit install <subreddit> fetchy-mcfetch` (from this directory or with app name).
- **Mod panel:** Publish the app (`devvit publish fetchy-mcfetch@<version>`). Apps that create custom posts may require Reddit review before they appear in “Installed Apps.”

### Create a nomination post

As a moderator: Mod Tools → Create Post → choose the menu item you configured (e.g. “The Internet Awards - Nominations”). The app creates a custom post that opens the nomination experience.

---

## API overview

| Method + path | Purpose |
|---------------|---------|
| `GET /api/event/config` | Event, categories (6), and awards (24) config (for client). |
| `GET /api/nominations` | List nominations; optional `?category=<id>`. |
| `POST /api/submit-nomination` | Create nomination or second (body: category, title, postUrl, reason, etc.). |
| `GET /api/user/nomination-count` | Current user’s used/limit (and `unlimited: true` for moderators) for rate limit UI. |
| `GET /api/preview-post` | Preview data for a Reddit URL (`?url=...`). |
| `GET /api/user/is-moderator` | Whether current user is subreddit mod. |
| `GET /api/stats/event` | Event-level stats (e.g. for admin). |
| `GET /api/export-csv` | CSV export (intended for mod use). |
| `POST /api/admin/hide-nomination` | Hide nomination (mod). |
| `POST /api/admin/unhide-nomination` | Unhide (mod). |
| `POST /api/admin/shadow-ban` | Shadow-ban user (mod). |
| `POST /api/delete` | Delete all nominations (mod, with confirmation). |

Internal: `POST /internal/menu/post-create` (mod menu → create post), `POST /internal/on-app-install` (optional install hook).

---

## Customization checklist

1. **Event, categories, and awards** – Edit `src/shared/config/event-config.ts`: categories (the 6), awards (the 24), names, ids, images, colors.
2. **Splash and copy** – Edit `src/client/splash.html` (and assets) for logo, headline, button text.
3. **Post creation copy** – Edit `src/server/core/post.ts` for the post created by the mod menu (splash/heading/button).
4. **Menu label** – Edit `devvit.json` → `menu.items[].label` and `description`.
5. **Banners and icons** – Add images under `src/client/public/images/` and reference them in event-config (header images, icons, main banner).
6. **Rate limit** – In `src/server/index.ts`, change `NOMINATION_LIMIT_PER_USER` if needed.

---

## Documentation in this repo

| Doc | Purpose |
|-----|---------|
| **README.md** (this file) | Tool overview, capabilities, options, moderation, API, getting started. |
| **INTERNET_AWARDS_USAGE.md** | Usage and deployment of this app as “The Internet Awards” nomination system (categories, workflow, history). |
| **DESIGN_DOC_NOMINATION_PHASE.md** | Design and constraints for the nomination phase. |
| **UI_PERFORMANCE_POLISH.md** | Performance notes for the client UI. |
| **AGENT_CATCHUP_FEB_5_2026.md** | Snapshot of behavior and key paths for development. |

Shared learnings and deployment notes often live in the repo root (e.g. `../LEARNINGS/`).

---

## Troubleshooting (short)

- **WebView not updating after deploy** – Devvit caches assets; create a **new** post to load the new bundle.
- **Nominations 500 / not saving** – Ensure `devvit.json` has `permissions.redis: true` and server stores only string values in Redis hashes.
- **Mod menu / post creation fails** – Ensure `/internal/menu/post-create` is on the router and returns `{ navigateTo: "https://reddit.com/r/..." }`; moderator check must pass.
- **Preview or short links fail** – Ensure `devvit.json` has `permissions.http.domains` including `reddit.com`, `www.reddit.com`, `redd.it` if you use those.

---

**License:** MIT · **Platform:** Reddit Devvit
