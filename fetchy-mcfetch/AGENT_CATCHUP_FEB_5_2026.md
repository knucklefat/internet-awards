# Agent catch-up: fetchy-mcfetch (Feb 5, 2026) — SAVE STATE

**Status:** Save state. Deploy completed; app is in a known-good state for the next session.

**Deployed version:** **0.0.251**

---

## What this app is

**fetchy-mcfetch** = **nominations** phase of The Internet Awards (Reddit/Devvit).

- **Entry:** Splash (`splash.html` + `splash.tsx`) → “Submit Nominee” opens main WebView (`index.html` → `App.tsx`).
- **Main flow:** Category select → pick award → submit form (nominee name, optional Reddit post or subreddit URL) → view nominees list.
- **Admin:** Mod-only panel (type “admin” to open); CSV export, delete, create post. Stats show total nominations and **unique nominators**.

---

## Current behavior (post–rate-limit & nomination-page updates)

### Rate limit (30 per user)
- **Limit:** 30 **new** nominations per user across the whole experience. “Nominate too” (voting for an existing nominee) does **not** count.
- **Server:** Redis key `user_nomination_count:${username}`; lazy init from existing nomination hashes; `reserveNominationSlot()` before each new nomination; 429 when over limit. Delete-all (or delete by category) resets affected users’ counters.
- **Client:** No “X/30” badge. **Toast only when** the user has reached the limit **and** tries to submit (429 response or clicking the disabled “Limit reached (30)” button). Submit button shows “Limit reached (30)” and is disabled when at limit; count still fetched for that logic.

### Nomination page (after first submit)
- After a successful submit, the **form is hidden** and replaced by a **“NOMINATE ANOTHER”** button above the list. Clicking it shows the entry form again.
- List heading: **“Other Nominees in [Award Name]”** (not “Current Nominees”).
- **MORE** button (small text, to the right of the heading): shows 5 more nominees per click (initial 5, then 10, 15, …). Hidden when all are visible.

### Earlier session (still relevant)
- Scroll to top on enter/load; footer (RULES, LEGAL, HELP, ©2026); award headers from event-config; subreddit URLs as “supporting community”; unique nominators via `getNominatorUsername(req)`; export/resolve workflow and `scripts/add-resolved-thing.js` (OpenAI/Gemini, per-category constraints).

---

## Key paths

| What | Where |
|------|--------|
| Main UI, views, nomination form, NOMINATE ANOTHER, MORE | `src/client/App.tsx` |
| Styles (nominate-another, nominees-section-header, more button) | `src/client/index.css` |
| Splash | `src/client/splash.html`, `src/client/splash.tsx` |
| Admin panel | `src/client/components/AdminPanel.tsx` |
| Server: submit, rate limit, preview, stats, mod check, CSV | `src/server/index.ts` |
| Rate limit: `ensureUserNominationCount`, `reserveNominationSlot`, `user_nomination_count:*` | `src/server/index.ts` |
| Event/categories + header image paths | `src/shared/config/event-config.ts` |
| App entry points | `devvit.json` |
| Export/resolve workflow | `EXPORT_AND_RESOLVE_WORKFLOW.md` |
| Resolve script (Layer 3 + 4, OpenAI/Gemini) | `scripts/add-resolved-thing.js` |

---

## Gotchas / patterns

- **Mod check:** `req.context` first, then `getModerators().all()`, cache; @devvit/web ^0.12.8.
- **Nominator identity:** Use **`getNominatorUsername(req)`** (context + `devvit-user` header, `t2_` stripped).
- **Rate limit:** Only **new** nominations increment the counter; “nominate too” does not. Lazy init populates count from hashes when key missing.
- **Design doc:** `DESIGN_DOC_NOMINATION_PHASE.md` item 3 still says “client shows X/30”; current behavior is **no** X/30 badge, toast only on limit when user tries to submit.

---

## Commands (from fetchy-mcfetch/)

- `npm run build` – client + server  
- `npm run deploy` – build + upload  
- `npm run dev` – client + server watch + devvit playtest  
- Resolve CSV: `npx dotenv -e .env -- node scripts/add-resolved-thing.js --llm input.csv output.csv` (or `--gemini`)

---

**Save state:** Deploy 0.0.251. Next agent can continue from here.
