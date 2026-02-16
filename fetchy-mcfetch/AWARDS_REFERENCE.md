# Awards reference – where they live and what to change

Use this when changing award **names**, **descriptions**, or the **thing being awarded**. It lists every place awards are defined, referenced, and how they feed the LLM script.

---

## 1. Single source of truth: event config

**File:** `src/shared/config/event-config.ts`

Each award is one entry in **`AWARD_CATEGORIES`** (and belongs to a **`CATEGORY_GROUPS`** entry). The type is **`AwardCategory`** from `src/shared/types/event.ts`:

| Field | Purpose | Used where |
|--------|---------|------------|
| **`id`** | Stable key. **Do not change** unless you migrate Redis + CSV + script. Used in Redis keys, API, CSV export, and LLM script. | Server (submit, list, export, delete, stats), client (routing, API), script (`THING_TYPE_BY_CATEGORY` key) |
| **`categoryGroup`** | Group id (e.g. `'gaming-hobbies'`). | Grouping on main screen, CSV "Category Group", LLM prompt context |
| **`name`** | Display name (e.g. "S-Tier Gaming", "Detour Destination"). | All UI: cards, submit header, "Other Nominees in {name}", related awards |
| **`emoji`** | Fallback when no icon. | Card and list when `iconPath` missing or fails |
| **`description`** | What the award is for (shown on nomination page). | Submit form under the award header |
| **`headerImage`** | URL path to 1200×300 banner on nomination page. | `App.tsx` – form header (`selectedCategory.headerImage`) |
| **`headerTextAlign`** | `'left'` \| `'right'`. | Form header title alignment |
| **`iconPath`** | URL path to 80×80 icon. | Main screen cards, nomination cards, related awards |
| **`cardColor`** | CSS gradient for card top. | Main screen award cards (optional override) |
| **`bannerImage`** | Legacy gif name; not used for current main/category headers. | — |

**Helpers (same file):** `getCategoryById(categoryId)`, `getCategoriesByGroup(groupId)`, `getAllCategories()`, `getCategoryGroupById(groupId)`.

---

## 2. Where awards are used in the app

### Server – `src/server/index.ts`

- **Submit:** `getCategoryById(category)` to validate `category` (id). Nominations stored with `category` = id.
- **List/export/delete/stats:** Filter and aggregate by category **id**; use `getCategoryById` to get group/name when building CSV or stats.
- **CSV export:** Writes **`Category`** = category **id** and **`Category Group`** = `categoryInfo.categoryGroup`. No human-readable award name column.

### Client – `src/client/App.tsx`

- **Main screen:** Renders `categoryGroups` and per-group `categories` from event config. Each award uses `cat.id`, `cat.name`, `cat.emoji`, `cat.iconPath`, `cat.cardColor`.
- **Category group headers:** `getCategoryHeaderImage(group.id)` returns a path from a **hardcoded map** (group id → image path). Map is in `App.tsx` only; not in event-config.
- **Submit form:** `selectedCategory` = one `AwardCategory`. Uses `selectedCategory.name`, `selectedCategory.description`, `selectedCategory.headerImage`, `selectedCategory.headerTextAlign`, `selectedCategory.emoji`, `selectedCategory.iconPath`.
- **Nominee list / list view:** Award name shown from `categories.find(c => c.id === nom.category)` → `.name`; icon from same object (`iconPath` / `emoji`).
- **Related awards:** Same category group; uses `award.id`, `award.name`, `award.iconPath`, `award.emoji`.

### Client – category group header image map

**Location:** `App.tsx`, function `getCategoryHeaderImage(groupId)`.

Maps **group id** → image path under `/images/category-headers/`:

- `gaming-hobbies` → `header-games.png`
- `funny-cute` → `header-funnycute.png`
- `knowledge` → `header-knowledge.png`
- `lifestyle-advice` → `header-lifestyle.png`
- `pop-culture` → `header-culture.png`
- `the-internet` → `header-internet.png`

These are **group** headers (one per section on the main screen), not per-award. Award-specific banners are `headerImage` in event-config.

---

## 3. Image assets

### Award header images (nomination page banner)

**Directory:** `src/client/public/images/award-headers/`  
**Naming in config:** `headerImage` in event-config, e.g.  
`/images/award-headers/The Internet Awards_Award Banner_S-Tier Gaming Award_1200x300px@2x.png`

- **Spec:** 1200×300px @2x.
- **One file per award** that has a header (one award, "The Rabbit Hole" / `most-rewarding-rabbit-hole`, has no `headerImage` in config).
- If you **rename an award**, either:
  - Rename the file to match the new name and update `headerImage` in event-config, or
  - Keep the file and only change `name`/`description` in config (no asset change).

### Award icons (cards and lists)

**Directory:** `src/client/public/images/icons/awards/`  
**Naming in config:** `iconPath` in event-config, e.g.  
`/images/icons/awards/Peak Gaming Moment Award_80x80px@1x.png`

- **Spec:** 80×80px @1x.
- If you **rename an award**, either update the filename and `iconPath`, or keep existing file and only change `name` in config.

### Category group headers (main screen section banners)

**Directory:** `src/client/public/images/category-headers/`  
**Referenced in:** `App.tsx` only, in `getCategoryHeaderImage()` (see above).  
Files: `header-games.png`, `header-funnycute.png`, `header-knowledge.png`, `header-lifestyle.png`, `header-culture.png`, `header-internet.png`.

- Changing a **group** name does not require changing these paths; only if you rename the group **id** would you need to change the map (and any group id is used in config and code).

---

## 4. LLM resolve script – “thing” being awarded

**File:** `scripts/add-resolved-thing.js`

**Purpose:** Adds a "Resolved Thing" column to the exported CSV. With `--llm` or `--gemini`, the LLM produces a short canonical label for what’s being nominated (e.g. a place for Detour Destination, a film for Absolute Cinema).

**Category key:** The script uses the CSV column **`Category`**, which is the category **id** (e.g. `destination-having-moment`), not the display name.

**Constraint map:** **`THING_TYPE_BY_CATEGORY`** (top of script).

- **Keys** = category **id** (must match event-config `id` and the CSV "Category" column).
- **Values** = short instructions for the LLM (e.g. “a PLACE only…”, “the film or movie title…”).

When you change **what the award is for** (or its name in a way that changes the “thing”):

1. Update **`description`** in `src/shared/config/event-config.ts` (and optionally `name`).
2. Update the corresponding entry in **`THING_TYPE_BY_CATEGORY`** in `scripts/add-resolved-thing.js` so the LLM output stays correct.

If you **add a new award** (new id in event-config), add a new key/value in `THING_TYPE_BY_CATEGORY`. If you **remove an award**, remove its key (and handle existing data/CSV as needed).

**Flow:** CSV row → `category` = row["Category"] (id) → `getThingConstraint(category)` → `getSystemPrompt(categoryId)` → LLM system prompt. The user content passed to the LLM includes "Award category: &lt;id&gt; (&lt;categoryGroup&gt;)" and nomination title/reason/URL.

---

## 5. Checklist for making award changes

**Name only (display text):**

- [ ] `src/shared/config/event-config.ts` → update `name` (and optionally `description`).
- [ ] If you want new header/icon assets with the new name: add or rename files under `images/award-headers/` and `images/icons/awards/`, and update `headerImage` / `iconPath` in event-config.

**Name + thing being awarded:**

- [ ] event-config: update `name` and `description`.
- [ ] `scripts/add-resolved-thing.js`: update the **value** (and if needed the key) for that award in `THING_TYPE_BY_CATEGORY`.
- [ ] Assets: same as “name only” if you change visuals.

**Do not change `id`** unless you are doing a full data/export/script migration; everything (Redis, API, CSV, LLM script) is keyed by it.

---

## 6. Quick map: category id → display name (current)

From `event-config.ts` – 24 awards, finalized names and resolution guidance:

| id | name |
|----|------|
| best-gaming-moment | S-Tier Game |
| holy-grail-collectible | Holy Grail |
| best-artistic-creation | Artistic Masterpiece |
| most-quotable-quote-fiction | Most Quotable |
| funniest-original-content | Comedy Gold |
| outstanding-aww | Outstanding Aww |
| meme-won-internet | Top Shelf Meme |
| wholesomest-moment | Faith in Humanity |
| best-plot-twist | Deepest Learning |
| most-innovative-tech | Tech that Delivered |
| breakthrough-scientific-discovery | Mind-Blowing Discovery |
| most-informative-episode | Stream of Consciousness |
| life-hack-changed-everything | Life-Changing Life Hack |
| destination-having-moment | Pinned Destination |
| best-fashion-style-trend | The Look |
| best-original-dish | Chef's Kiss |
| best-show-episode | Redemption Arc |
| absolute-cinema-moment | Absolute Cinema |
| best-sports-moment | Peak Sports |
| hottest-earworm | Hottest Earworm |
| community-moment | Community of the Moment |
| best-channel-stream-podcast | Positive Influence |
| best-internet-trend | Viral Trend |
| most-quotable-ama | Ask Me Anything |

Each award has `resolutionGuidance` in event-config (used by resolve script). All 24 have header image and icon.
