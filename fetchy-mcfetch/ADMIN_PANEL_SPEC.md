# Admin Panel Specification (fetchy-mcfetch)

**Status:** Spec — not yet implemented  
**Target:** Mod-only admin for The Internet Awards nominations (r/theinternetawards).  
**Scale:** Hundreds to thousands of nominations; UI must remain usable.

---

## 1. Overview

The Admin Panel is a modal available only to subreddit moderators. It has **four main views**, each triggered by tapping one of four **sticky stat cards** at the top. Content below the stat row scrolls; the stat row stays pinned. A **dropdown** and **sort** controls (and in one case a **download** action) are view-specific. The panel supports moderation (hide/unhide nominations, shadow ban/unban nominators), browsing by category or award, and CSV export. **Delete All** is removed from the UI and is only performed via explicit developer command.

---

## 2. Sticky Stat Row (Always Visible)

- **Layout:** Single row of four stat cards: **NOMINATIONS** | **CATEGORIES** | **AWARDS** | **NOMINATORS**.
- **Behavior:** Tapping a card switches the panel into that view and highlights that card (e.g. teal border). The stat row stays fixed at the top while the body scrolls.
- **Counts:** Each card shows the current count (e.g. 42, 6, 25, 4). Category count = number of category groups; Award count = number of awards.
- **Download (NOMINATIONS only):** A **download icon** on the right side of the NOMINATIONS stat row runs the same logic as the current “Export All Nominations to CSV” (copy to clipboard in WebView). No separate “Export Data” or “Danger Zone” section in the UI.

---

## 3. Views

### 3.1 NOMINATIONS View (default / start view)

- **Purpose:** Show all nominees across all awards in one list.
- **Dropdown:** Not used (or “All” / no dropdown).
- **Sort:** Two options — **MOST SECONDED** | **NEWEST**. Applies to the full list.
- **List:** Scrollable list of nominee cards. Each card:
  - **Thumbnail:** Award icon for the nominee’s category (or post thumbnail when available).
  - **Line 1:** Name/description (user’s first form field).
  - **Line 2:** Link title if applicable (post title when different from line 1); otherwise empty.
  - **Action:** None in this view (no HIDE here; hide/unhide is per award in AWARDS view).
- **Performance:** With hundreds/thousands of nominations, consider pagination, “load more,” or virtual scrolling; exact strategy TBD in implementation.

---

### 3.2 CATEGORIES View

- **Purpose:** Browse by category group; under each category, show its awards and their nominees.
- **Dropdown:** Lists **category groups** (e.g. “1. GAMES & HOBBIES”, “2. FUNNY & CUTE”, …). **Count in parentheses** in the dropdown label (e.g. “1. GAMES & HOBBIES (12)”) — number of nominations in that category. Selecting an option **jumps** the user to that category’s content (no separate “Nominations by category group” breakdown section).
- **Auto-select:** When entering CATEGORIES view, **auto-select the first category** in the dropdown.
- **Content below dropdown:**
  - For the selected category, list **awards** in that category.
  - Each award is a **row/header** with: award icon, award name, and a **“SEE AWARD”** button (teal text).
  - **SEE AWARD:** Behaves like switching to AWARDS view and selecting that award: same dropdown selection, sort, and nominee list. The UI can switch to AWARDS view and highlight the AWARDS stat card when “SEE AWARD” is used.
  - Under each award header, list **nominee cards** for that award only (same card layout as elsewhere: thumbnail, name/description, link title, **HIDE** button).
- **Remove:** Do not show the current “Nominations by category group” section; the count-in-dropdown replaces it.

---

### 3.3 AWARDS View

- **Purpose:** Focus on a single award; list all nominees for that award (including hidden) with hide/unhide.
- **Dropdown:** Lists **awards** (e.g. “S-Tier Game”, “Holy Grail”, “Most Quotable”). Selecting an award filters the list to that award’s nominees. **Count in parentheses** in dropdown (e.g. “S-Tier Game (8)”) — number of nominees for that award.
- **Auto-select:** When entering AWARDS view, **auto-select the first award** in the dropdown.
- **Sort:** **MOST SECONDED** | **NEWEST** for the nominees of the selected award.
- **List:** Nominee cards for the selected award only. Each card:
  - Same layout: award icon (or post thumbnail), name/description, link title if applicable.
  - **Action:** **HIDE** or **UNHIDE** (right-aligned). Hidden nominees still appear in this list with UNHIDE; they are excluded from public “Other Nominees” lists.
- **Empty space:** If an award has no nominees, show empty space so layout stays consistent (no collapse).

---

### 3.4 NOMINATORS View (new)

- **Purpose:** List nominators (usernames) with moderation action (shadow ban/unban).
- **List:** Usernames ordered by **number of nominations submitted** (descending). Each row: username, nomination count, and a right-aligned action button.
- **Sort:** **ACTIVE** | **SHADOW BANNED**. ACTIVE shows only non–shadow-banned users; SHADOW BANNED shows only shadow-banned users.
- **Action:** **SHADOW BAN** or **UNBAN** (one per row). Same visual treatment as HIDE (e.g. red/destructive style); UNBAN can use a restorative style (e.g. green).
- **Shadow ban behavior (server):**
  - When a user is **shadow banned:** Do not record any **new** submissions or **new** “second” actions from that user from the moment of ban. Existing data (past nominations, past seconds) is unchanged.
  - When a user is **unbanned:** Resume recording submissions and seconds from the moment of unban only. No backfill of data during the banned period.
- **Implementation:** Server maintains a store of shadow-banned usernames (e.g. Redis set or hash). On `POST /api/submit-nomination` and on “second” (increment vote) paths, reject or no-op if the acting user is in the shadow-ban set. Unban removes the user from that set.

---

## 4. Removals from Current Admin UI

- **“Nominations by category group”** section — removed; category-level counts appear in the CATEGORIES dropdown only.
- **“Top nominated posts”** section — removed; “most seconded” is available as a sort in NOMINATIONS and AWARDS views.
- **“Export Data”** section (big “Export All Nominations to CSV” button) — removed; replaced by a **download icon** on the NOMINATIONS stat row that performs the same CSV export (e.g. copy to clipboard).
- **“Danger Zone” / “Delete all nominations”** — removed from the UI. Delete-all is only performed when the product owner explicitly instructs the developer to run it (e.g. “delete all” as a one-off command). No in-app button for this.

---

## 5. Server / API

### 5.1 Existing (keep)

- `GET /api/user/is-moderator` — used to show Admin Panel only to mods.
- `GET /api/nominations?category=&includeHidden=1` — list nominations; mod-only when `includeHidden=1`; returns `memberKey` and `hidden` for admin.
- `POST /api/admin/hide-nomination` — body `{ memberKey }`; mod-only; add to hidden set.
- `POST /api/admin/unhide-nomination` — body `{ memberKey }`; mod-only; remove from hidden set.
- `GET /api/export-csv` — CSV export (used by the new download icon).
- `GET /api/stats/event` — event stats (totalNominations, totalNominators, etc.).
- `GET /api/event/config` — category groups and awards (for dropdowns and labels).

### 5.2 New or extended

- **Shadow ban store:** e.g. Redis key `shadow_banned_users` (set or hash of usernames). 
- **Submit-nomination:** Before creating or incrementing a nomination, check if `nominatedBy` (and, for “second,” the acting user) is shadow banned; if so, return an error or no-op and do not persist.
- **Nominators list:** New endpoint, e.g. `GET /api/admin/nominators?sort=active|shadow_banned` (mod-only). Returns list of users with nomination count; for `shadow_banned`, only banned users; for `active`, only non-banned. Include count of nominations per user.
- **Shadow ban / unban:** `POST /api/admin/shadow-ban` (body `{ username }`), `POST /api/admin/unban` (body `{ username }`); mod-only; add/remove from Redis set.

### 5.3 Delete all

- **Not exposed in API to the client.** Implemented as a server-side or script action only when requested by the product owner (e.g. “run delete all” as a developer command).

---

## 6. Data Model (summary)

- **Hidden nominations:** Already implemented: Redis hash `hidden_nominations`, field = `memberKey`, value = `'1'`. Public nomination list excludes these.
- **Shadow-banned users:** New: e.g. Redis set `shadow_banned_users` with username (or t2_ id, consistent with rest of app) as members. Check on submit and on second.

---

## 7. UI/UX Details

- **Sticky stat row:** Use `position: sticky` (or equivalent) so the four stat cards remain visible at the top when the body scrolls.
- **Dropdown:** Single dropdown per view; options show count in parentheses where specified (categories, awards). Auto-select first option when entering CATEGORIES or AWARDS view.
- **Nominee card:** Thumbnail = award icon (or post thumbnail when available); line 1 = name/description; line 2 = link title (if any); right-aligned action = HIDE | UNHIDE (AWARDS, CATEGORIES) or none (NOMINATIONS).
- **Nominator row:** Username, nomination count, right-aligned SHADOW BAN | UNBAN.
- **Download icon:** Only on NOMINATIONS stat row; triggers same CSV export as current “Export All to CSV” (clipboard in WebView).
- **SEE AWARD:** From CATEGORIES view, switches context to AWARDS view with that award selected; can highlight the AWARDS stat card.

---

## 8. Edge Cases / Notes

- **Empty award/category:** Show empty space or “No nominees yet” so layout and dropdown count stay consistent.
- **Scale:** Hundreds/thousands of nominations — avoid loading entire list in one shot if it hurts performance; add pagination or “load more” or virtual list as needed in implementation.
- **r/theinternetawards:** This app will be installed officially in r/theinternetawards; mod list and permissions are scoped to that subreddit.

---

## 9. Implementation Order (suggested)

1. **Sticky stat row** + view switching (NOMINATIONS, CATEGORIES, AWARDS, NOMINATORS) without changing existing content layout.
2. **NOMINATIONS view:** Add sort (MOST SECONDED / NEWEST), download icon on stat row; remove old Export/Danger Zone sections; remove “Nominations by category group” and “Top nominated posts.”
3. **CATEGORIES view:** Dropdown (categories with counts), auto-select first, award headers with SEE AWARD, nominee list per award with HIDE.
4. **AWARDS view:** Dropdown (awards with counts), auto-select first, sort, nominee list with HIDE/UNHIDE; keep showing hidden nominees with UNHIDE.
5. **NOMINATORS view:** New endpoint for nominators list; sort ACTIVE/SHADOW BANNED; SHADOW BAN/UNBAN buttons; server-side shadow-ban store and checks on submit/second.
6. **Delete all:** Remove from UI; document as developer-only command.

---

*End of spec.*
