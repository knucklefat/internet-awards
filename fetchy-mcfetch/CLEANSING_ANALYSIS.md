# Fetchy-McFetch Cleansing Analysis

**Date:** 2026-02-05  
**Goal:** Lighten the app by removing dead code, unused assets, and unused dependencies.

---

## Summary

| Category              | Finding                                      | Action |
|-----------------------|----------------------------------------------|--------|
| Server backup files   | 6 old copies of `index.ts` in `src/server/` | Remove |
| Unused entry / game   | `game/` folder + `game.html` not in build    | Remove |
| Unused hook           | `useCounter` only used by removed game       | Remove |
| Unused splash variant | `splash/splash.tsx` (template, not used)     | Remove |
| Unused shared types   | `shared/types/api.ts` only used by game      | Remove |
| Unused dependencies   | `clsx`, `tailwind-merge` never imported      | Remove |
| BACKUPS folder        | Old version snapshots                        | Optional: delete or move out of repo |

---

## 1. Server backup files (removed)

- `src/server/index.ts.backup`
- `src/server/index.ts.bak`
- `src/server/index.ts.bak2`
- `src/server/index.ts.bak3`
- `src/server/index.ts.bak4`
- `src/server/index.ts.bak5`

These are old copies of the server; only `index.ts` is built and run. Removed to avoid confusion and keep the tree clean.

---

## 2. Unused “game” entry (removed)

- **`src/client/game/App.tsx`** – counter UI
- **`src/client/game/game.tsx`** – mounts game App
- **`src/client/game.html`** – not in `vite.config.ts` rollup `input`

`devvit.json` only defines `default` (splash) and `main` (index). The game entry is never built or used. Removed game folder and `game.html`.

---

## 3. Unused hook (removed)

- **`src/client/hooks/useCounter.ts`** – only used by `game/App.tsx`, calls `/api/init` and `/api/increment|decrement` (which do not exist on the current server). Removed with the game.

---

## 4. Unused splash variant (removed)

- **`src/client/splash/splash.tsx`** – template with “Edit … to get started” and Docs/r/Devvit/Discord.  
- **Actual splash:** `splash.html` loads `./splash.tsx` (root), which only calls `requestExpandedMode(…, 'main')`.  
So `splash/splash.tsx` is dead. Removed.

---

## 5. Unused shared types (removed)

- **`src/shared/types/api.ts`** – only imported by `useCounter.ts`. Server and main client use inline types or `event.ts`. Removed to avoid unused code and mismatch with current APIs.

---

## 6. Unused dependencies (removed)

- **`clsx`** – not imported anywhere in `src/`.
- **`tailwind-merge`** – not imported anywhere in `src/`.

Removed from `package.json` to reduce install size and dependency surface.

---

## 7. BACKUPS folder (optional)

- **`BACKUPS/v0.0.27/`** and **`BACKUPS/v0.0.86/`** – old App, server, config, and assets.

Not used by the build. Safe to delete for a lighter repo, or move outside the repo if you want to keep history.

---

## 8. Kept as-is

- **`src/client/global.ts`** – single line `declare module '*.css'`; supports CSS imports in TS.
- **`src/client/module.d.ts`** – declarations for `.png`/`.jpg`; supports asset imports.
- **`src/client/components/AdminPanel.tsx`** – used by main App (admin panel).
- **`src/shared/types/event.ts`** – used by App, server, and config.
- **`assets/`** – used by Devvit media.
- **`scripts/`** – e.g. resolve-csv; dev tooling only, low impact.

---

## After cleansing

- Fewer files and less noise in the tree.
- No unused npm packages for the app.
- Build and runtime behavior unchanged; only dead code and backups removed.

Run `npm run build` and `npm run deploy` to confirm. If you want BACKUPS removed or moved, say how you’d like it handled.
