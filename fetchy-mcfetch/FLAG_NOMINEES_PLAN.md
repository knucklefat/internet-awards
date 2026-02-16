# Plan: Flag nominees + Admin “Flagged” filter

## Goal
1. Let users **flag** nominees from the main nominee listings (submit view “Other Nominees” + list view).
2. In the **admin panel**, add a **Flagged** sort/filter so mods can quickly see and hide malicious posts.

---

## 1. Data model (Redis)

- **`flagged_nominations`** (hash): `memberKey` → `'1'` (or optionally flag count string).  
  “Is this nomination flagged?” and, if we store count, “how many times?”
- **`user_flagged:${userId}`** (hash): `memberKey` → `'1'`.  
  One flag per user per nomination (same pattern as `user_seconded`).

**Flow:** When a user flags:
1. If `user_flagged:${userId}[memberKey]` already set → return “Already reported” (or 200 no-op).
2. Else: `hSet(user_flagged:${userId}, { [memberKey]: '1' })`, `hSet(flagged_nominations, { [memberKey]: '1' })` (or increment count if we want to show “Flagged 3x” in admin).

**Optional:** Store flag count in `flagged_nominations` (e.g. `'1'`, `'2'`, …) via get + set (no HINCRBY needed). Admin can show “Flagged (2)” for triage. For MVP, boolean is enough.

---

## 2. API

### 2.1 POST `/api/flag-nomination` (or `/api/nominations/flag`)
- **Body:** `{ memberKey: string }`.
- **Auth:** Any authenticated user (same as seconding). Optional: rate limit (e.g. max 20 flags per user total, or 5 per 10 min).
- **Logic:**
  - Resolve `userId` (same as nominator: `getNominatorUsername(req)` for key).
  - If `user_flagged:${userId}` already has this `memberKey` → 200 `{ success: true, alreadyFlagged: true }`.
  - Else set `user_flagged:${userId}[memberKey] = '1'` and add `flagged_nominations[memberKey] = '1'` (or increment). Return 200 `{ success: true }`.
- **Response:** `{ success: boolean, alreadyFlagged?: boolean }`.

### 2.2 GET `/api/nominations`
- When **mod** requests with `includeHidden=1`, also load `flagged_nominations` (e.g. `hGetAll(flagged_nominations)`).
- For each nomination, set **`nom.flagged = flaggedSet.has(mem)`** (and optionally `nom.flagCount` if we store counts). So admin list has `flagged: true/false` per row.
- **Public list:** We need `memberKey` on each nomination so the client can call flag. Today `memberKey` is only set when `modRequestingHidden`. **Change:** always set `nom.memberKey = mem` in the response (memberKey is not sensitive: it’s `category:postId` or `category:free:slug`). That way the main app can show a “Report”/“Flag” button and send `memberKey` to `POST /api/flag-nomination`.

---

## 3. Client (main app – nominee cards)

- **Where:** Same two places as “Second” and link icon: (1) submit view “Other Nominees” slice, (2) list view full grid.
- **UI:** Add a small “Report” or “Flag” control (e.g. flag icon) on each card (e.g. in or near the action row). Only show if `nom.memberKey` is present (we’ll add it for all responses).
- **Action:** On click → `POST /api/flag-nomination` with `{ memberKey: nom.memberKey }`. Toast: “Reported” or “Thanks for reporting”.
- **Optional:** Disable button or show “Reported” after success (and optionally set local state so the same user doesn’t see the button again for that nom in this session).

---

## 4. Admin panel

- **Sort dropdown:** Today: “SECONDED” | “Newest”. Add **“Flagged”**.
- **Behavior when “Flagged” is selected:** Filter (or sort) so only nominations with `flagged === true` are shown. So `sortedNominations` becomes:
  - If `sortNominations === 'flagged'`: filter `nominations` to `n.filter(n => n.flagged)`, then optionally sort by newest or seconded.
  - Else: keep current sort (newest / most_seconded).
- **UI:** In the nominee card row, optionally show a small “Flagged” badge (or “Flagged (2)”) when `nom.flagged` is true, so mods see it even when not filtered.
- **Workflow:** Mod opens admin → chooses “Flagged” → sees only flagged nominees → uses existing Hide button to hide malicious ones.

---

## 5. Types

- **Shared (e.g. `event.ts`):** Add to `Nomination`: `flagged?: boolean` and optionally `flagCount?: number`.
- **Server:** Use internal Redis keys above; no new shared types beyond extending `Nomination`.

---

## 6. Implementation order

1. **Server**
   - Add Redis keys and logic for flag (one flag per user per nomination).
   - Add `POST /api/flag-nomination`.
   - In `GET /api/nominations`: (a) always set `nom.memberKey`; (b) when mod + `includeHidden=1`, load `flagged_nominations` and set `nom.flagged` (and optionally `nom.flagCount`).
2. **Client (main app)**
   - On nominee cards (both listing contexts), add Flag/Report button; call `POST /api/flag-nomination` with `nom.memberKey`; show toast.
3. **Admin panel**
   - Extend `NominationSort` with `'flagged'`.
   - In `sortedNominations`: if `sortNominations === 'flagged'`, filter to `nominations.filter(n => n.flagged)` then apply secondary sort if desired.
   - Add “Flagged” option to the sort dropdown; optionally show “Flagged” badge on cards when `nom.flagged`.

---

## 7. Optional later

- **Unflag / dismiss:** Mod-only endpoint to clear flags for a nomination (remove from `flagged_nominations` and optionally clear `user_flagged:*` for that memberKey). Not required for “quickly hide malicious” workflow.
- **Rate limit:** Cap flags per user (e.g. 20 total or 5 per 10 min) to avoid abuse.
- **Flag count in admin:** If we store count in `flagged_nominations`, show “Flagged (3)” in admin for triage priority.
