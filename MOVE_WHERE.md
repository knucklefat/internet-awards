# Internet Awards: What to Move Where

**Context:** One product (Internet Awards) = two Devvit apps built in parallel:
- **fetchy-mcfetch** — Phase 1: nominations (link optional, CSV export, Layer 3/4).
- **picky-mcpick** — Phase 2: voting (finalists + 2×3 grid, one post per award).

This doc says what belongs at **repo root** (product), inside **fetchy-mcfetch/** (Phase 1 app), or inside **picky-mcpick/** (Phase 2 app), and what to move.

---

## 1. Root = Internet Awards (product only)

**Keep at root only:**

| Item | Why |
|------|-----|
| `LEARNINGS/` | Shared by both apps; platform and session notes. |
| `NOMINATION_LINK_FREE_PLAN.md` | Product/design doc for Phase 1 (used by both planning and fetchy). |
| `PICKY_PICK_APP_APPROACH.md` | Product/design doc for Phase 2 (used by both planning and picky). |
| `LICENSE` | Repo-wide. |
| `.cursor/`, `.cursorignore`, `.kiro/`, `.gitignore` | Repo/project config. |
| `fetchy-mcfetch/` | Phase 1 app folder. |
| `picky-mcpick/` | Phase 2 app folder. |
| `README.md` | **Replace** with a short product README (see below). |

**Do not put at root:** app code, app-specific env files, app-only scripts, or app-only docs (assets, CSV, backups).

---

## 2. fetchy-mcfetch (Phase 1 app)

**Already in the right place:**  
`src/`, `assets/`, `scripts/`, `csv-downloads/`, `BACKUPS/`, `tools/`, `devvit.json`, `package.json`, `package-lock.json`, `eslint.config.js`, `DESIGN_ASSET_MATRIX.html`, `auto-export.js`, and all fetchy docs: `ASSET_*.md`, `BANNER_SETUP.md`, `CSV_EXPORT_INSTRUCTIONS.md`, `CONVERSION_COMPLETE.md`, `DETAILED_IMPLEMENTATION_PLAN.md`, `MULTI_DAY_IMPLEMENTATION_GUIDE.md`.

**Move from root → `fetchy-mcfetch/`:**

| From (root) | To (fetchy-mcfetch) | Why |
|-------------|---------------------|-----|
| `.env.example` | `fetchy-mcfetch/.env.example` | App env template for nomination server. |
| `.env.template` | `fetchy-mcfetch/.env.template` | Same; keep one or the other if redundant. |

**Create in fetchy-mcfetch:**

| Create | Content |
|--------|---------|
| `fetchy-mcfetch/README.md` | Move the **current root README.md** content here. That README is entirely about the nomination app (features, API, Redis, troubleshooting, changelog). Root will get a new short README. |

**Optional cleanup in fetchy-mcfetch:**  
Remove or archive `src/server/index.ts.bak*` and `index.ts.backup` when no longer needed.

---

## 3. picky-mcpick (Phase 2 app)

**Already correct:**  
Self-contained: `src/`, `assets/`, `devvit.json`, `package.json`, `README.md`, `.gitignore`. No moves required.

**Optional (later):**  
Reuse award headers/icons from fetchy (e.g. copy or symlink `fetchy-mcfetch/src/client/public/images/` into picky) if you want shared visuals. Not a move — just a possible shared-asset strategy.

---

## 4. LEARNINGS (stay at root)

**Keep at root.**  
Content is mostly fetchy/session history and platform learnings; both apps benefit. No need to split unless you want `LEARNINGS/fetchy/` vs `LEARNINGS/shared/` later.

**Do not move** LEARNINGS files into `fetchy-mcfetch/` or `picky-mcpick/` — they stay product/repo-level.

---

## 5. Root README (replace, don’t move)

**Current state:**  
Root `README.md` is the long fetchy-mcfetch app readme (overview, API, Redis, troubleshooting, changelog).

**Do this:**

1. **Copy** current root `README.md` → `fetchy-mcfetch/README.md` (so the nomination app has its own full readme).
2. **Replace** root `README.md` with a short **product** README that:
   - States: "Internet Awards = one experience, two Devvit apps."
   - Lists: **fetchy-mcfetch** (Phase 1: nominations) and **picky-mcpick** (Phase 2: voting).
   - Points to: `fetchy-mcfetch/README.md`, `picky-mcpick/README.md`, `NOMINATION_LINK_FREE_PLAN.md`, `PICKY_PICK_APP_APPROACH.md`, and `LEARNINGS/`.
   - Gives one-line commands: e.g. `cd fetchy-mcfetch && npm run dev` / `cd picky-mcpick && npm run dev`, and `devvit install <sub> fetchy-mcfetch` / `devvit install <sub> picky-mcpick`.

---

## 6. Summary: moves to do

| # | Action |
|---|--------|
| 1 | Move ` .env.example` → `fetchy-mcfetch/.env.example` |
| 2 | Move `.env.template` → `fetchy-mcfetch/.env.template` (or delete if duplicate of .env.example) |
| 3 | Copy root `README.md` → `fetchy-mcfetch/README.md` |
| 4 | Replace root `README.md` with short product README (see section 5) |
| 5 | (Optional) Delete root `dist/` if it still exists — it’s leftover from when the app lived at root; build from `fetchy-mcfetch/` only. |

After this, root = product + shared learnings + two app folders; each app folder has everything needed to develop and deploy that app.
