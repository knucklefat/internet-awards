# Nomination Link-Free Implementation Plan

## 1. Current State (What We Have)

### Flow
- User selects an award → sees form with **Nominee Name or description** (text) and **Reddit Post URL** (required).
- Server requires `postUrl`; validates Reddit URL; fetches post via `reddit.getPostById`; uses `category:postId` as **unique identity**.
- "Nominate too" = same URL in same category → increment `voteCount` on that nomination.
- CSV export: Category, Category Group, Post Title, Author, Subreddit, Karma, URL, Nominated By, Reason, Timestamp. No "resolved thing" column.

### Identity Today
- **Redis key**: `nomination:${category}:${postId}` → one row per (category, Reddit post).
- **Popularity**: `voteCount` per nomination; `topPosts` in stats by postId.

### Constraints
- **Server**: Serverless, read-only filesystem, no long batch jobs. Can use `fetch` for external APIs.
- **CSV**: Exported via `/api/export-csv`; consumed by scripts (e.g. `auto-export.js`) or spreadsheets. No in-server CSV write.

---

## 2. Problem Framing

| Goal | Constraint |
|------|------------|
| Remove link requirement | Keep nomination experience in-app and low-friction (no copy-paste round trip). |
| Still identify a "thing" | So we can count popularity (same thing = same bucket). |
| Reliably categorize | So we can measure popularity of that thing (and optionally use award as signal). |

So we need:
1. **Submission model**: Name/description (required), link (optional).
2. **Thing identity**: Either at submit time or after collection, we need a stable "thing" identifier so we can aggregate votes.
3. **Categorization for popularity**: Either store a "resolved thing" per row or run a post-hoc step that buckets rows into the same "thing" (e.g. in CSV or in a spreadsheet).

---

## 3. Can Name/Description + Optional Link Work with CSV?

Yes. Two main approaches:

### A) Per-entry resolution (add a column per nomination)
- When a nomination is submitted (or when processing a CSV row), an "agent" (rule-based or LLM) infers the **thing** from: award category + title/description + optional URL.
- That **thing** (e.g. normalized string or ID) is stored in a new field and exported in CSV.
- **Pros**: Each row is self-contained; spreadsheets can pivot/sort by "thing"; no second pass.  
- **Cons**: If done at submit time in-app, requires an API call (latency/cost) unless you use cheap heuristics. If done offline on CSV, you need a script or spreadsheet step.

### B) Batch resolution (after collection)
- Collect raw rows: Category, Title/Description, Optional URL, Nominated By, etc.
- After collection (e.g. on exported CSV), an agent analyzes **all** entries and assigns a "thing" or "bucket" per row (or group of rows).
- **Pros**: Single pass over full data; can use context from other rows ("same as row 12"); no impact on submit latency.  
- **Cons**: Identity isn’t available in-app for "nominate too"; popularity is computed only after export + run of the batch step.

So: **CSV with optional link can support both** — either by adding a column via per-entry resolution (at submit or in a script on the CSV) or by running a batch agent on the CSV and writing a new column (e.g. "Resolved Thing" or "Bucket ID").

---

## 4. Award as Signal

The award category is a strong signal and should be an **input** to any resolution step:

- **S-Tier Gaming** → nominee is likely a game, stream, or gaming moment.
- **Holy Grail** → collectible.
- **Tech that Delivered** → product/tech.
- **Faith in Humanity Restorer** → moment or piece of content.

So whenever we resolve "what is this thing?" (per-entry or batch), we should pass **category id** (and optionally category name/description) into the agent. That improves consistency and reduces ambiguity.

---

## 5. Tools We Have

| Tool | Where | Use |
|------|--------|-----|
| Redis | Server | Store nominations (hash per nomination, sorted set for order). |
| CSV export | Server → client download / auto-export script | Full dataset for spreadsheets or scripts. |
| Spreadsheets | Outside app | Open CSV, add columns (manual or formulas), run batch logic (e.g. scripts, add-ons). |
| Server `fetch` | Server | Call external APIs (e.g. LLM) at submit time if we want per-entry resolution in-app. |
| Devvit serverless | Server | No fs; no long-running batch over Redis in one request. |

So:
- **In-app "thing" at submit**: Only if we do resolution on the server (e.g. call an API) and store result in Redis; then CSV can just export that field.
- **"Thing" only in CSV**: No server change for resolution; export current fields; run a separate script (or spreadsheet) that reads CSV, adds "Resolved Thing" (or "Bucket"), and optionally writes a new CSV. That fits "batch agent after collection."

---

## 6. Paths Forward (High Level)

### Path 1: Link optional, no "thing" in-app (simplest)
- **Form**: Name/description required, URL optional.
- **Identity**: No stable "thing" in-app. Each submission is a row; duplicate "same thing" submissions are separate rows (no "nominate too" by thing).
- **Popularity**: Only after export: run a batch agent on CSV (using category + title/description + optional URL) to add a "Resolved Thing" column, then pivot/count in a spreadsheet.
- **Engagement**: Friction drops (no link required). "Nominate too" could be removed or repurposed (e.g. "I agree" on a different UX that doesn’t rely on shared identity).

### Path 2: Link optional, "thing" in-app via heuristic (no external API)
- **Form**: Same as Path 1.
- **Identity**: Server derives a **normalized thing id** from: category + normalized title/description (e.g. trim, lower case, collapse spaces, maybe remove punctuation). Optionally hash that to a short id. Store in Redis and in CSV.
- **Dedupe**: "Nominate too" = same category + same normalized thing id → increment voteCount for that nomination row (or for a canonical row).
- **Popularity**: In-app and in CSV (e.g. voteCount or count of rows per thing).
- **Caveat**: "Elden Ring" vs "Elden Ring DLC" = different things; "Elden Ring" vs "elden ring" = same. Good enough for many cases; no LLM.

### Path 3: Link optional, "thing" in-app via API (e.g. LLM)
- **Form**: Same.
- **Identity**: On submit, server calls an external API (e.g. LLM) with: award category + title/description + optional URL; API returns a short "thing" label or id. Store it; use for dedupe and "nominate too."
- **Pros**: Better normalization ("Elden Ring" vs "Elden Ring Shadow of the Erdtree" → same game).  
- **Cons**: Latency, cost, dependency; need error/fallback (e.g. fall back to heuristic).

### Path 4: Link optional, "thing" only in CSV (batch agent)
- **Form**: Same as Path 1.
- **Identity in-app**: Not stored; no "nominate too" by thing.
- **After export**: Script (or spreadsheet) reads CSV, uses category + title/description + optional URL (and optionally LLM) to add "Resolved Thing" column; you then bucket and measure popularity in the spreadsheet.
- **Engagement**: Same as Path 1; maximum flexibility and no server/LLM dependency if you run the batch locally.

---

## 7. Recommended Phasing (Logical Production Layers)

Implement in layers so each step is shippable and easy to prompt for.

### Layer 1: Make link optional and collect name/description
- **Scope**: Client + server only.
- **Client**: Make URL optional; make name/description required; remove "All nominees require supporting link" and submit disabled when URL empty; optional: show URL as "Optional supporting link."
- **Server**: Accept submissions without `postUrl`. If no URL: no Reddit fetch; create a nomination with a **new identity** (e.g. `category:slug` where `slug` = hash or id from title+description+timestamp, or UUID). Store: category, title (from name/description or a sanitized copy), nominatedBy, nominationReason, optional url, timestamp, voteCount. No postId, author, subreddit, karma, thumbnail unless URL provided.
- **Types**: Extend `Nomination` so postId, author, subreddit, karma, url, thumbnail, permalink are optional; add something like `titleOrName` so we always have a display string.
- **CSV**: Export new shape: include title/name, description/reason, optional URL; leave new columns (e.g. "Resolved Thing") for later or leave blank.
- **Prompt tip**: "Implement Layer 1: link optional, name/description required; server accepts submissions without URL and stores them with a new identity scheme; update Nomination type and CSV export."

### Layer 2: In-app "thing" identity (heuristic)
- **Scope**: Server + shared types.
- **Server**: Define a **normalized thing id** from category + normalized name/description (and optional URL if present). Same category + same normalized id → treat as same nomination (increment voteCount or attach to same canonical record). Store `normalizedThingId` or `thingSlug` in Redis and return in API.
- **Client**: "Nominate too" only for entries that have a thing id (and optionally only when you want to support +1 on link-free entries). List view shows voteCount.
- **CSV**: Export `normalizedThingId` / `thingSlug` (and voteCount if not already).
- **Prompt tip**: "Implement Layer 2: derive normalized thing id from category + name/description (and optional URL); use it for dedupe and voteCount; add to CSV export."

### Layer 3 (optional): Richer resolution in CSV (batch agent) ✅ Implemented
- **Scope**: Outside app (script or spreadsheet).
- **Input**: CSV with Category, Title/Description, Optional URL, Thing Slug, etc. (export from `/api/export-csv`).
- **Output**: Same CSV + column "Resolved Thing". Logic: use existing **Thing Slug** when present, else normalize **Post Title** (same heuristic as Layer 2); category is in each row for optional LLM use later.
- **Script**: `scripts/add-resolved-thing.js`. Run: `node scripts/add-resolved-thing.js [input.csv] [output.csv]` or pipe stdin → stdout. See `scripts/README.md`.
- **Spreadsheet**: Open output CSV and pivot/count by **Resolved Thing** for popularity; filter by **Category** for per-award analysis.

### Layer 4 (optional): In-app resolution via API
- **Scope**: Server only (and env for API key).
- **Server**: On submit (when name/description present), call external API to get "thing" label/id; store it; use for identity and "nominate too." Fallback to Layer 2 heuristic on timeout/error.
- **Prompt tip**: "Add optional LLM/API call at submit to resolve 'thing' from category + name/description + optional URL; store result and use for dedupe; fallback to heuristic from Layer 2."

---

## 8. How to Prompt for Maximum Efficiency

- **One layer at a time**: e.g. "Implement Layer 1 from NOMINATION_LINK_FREE_PLAN.md" so the model stays within one scope (client + server contract + types + CSV).
- **Reference the doc**: "Following NOMINATION_LINK_FREE_PLAN.md, make the nomination link optional and add a batch script that adds 'Resolved Thing' to the exported CSV."
- **Be explicit about identity**: "Use category + normalized title/description for unique key when there’s no URL; store as nomination:category:normalizedId."
- **Be explicit about backward compatibility**: "Existing nominations with postId should keep working; new link-free nominations should use the new key format and optional fields."
- **CSV contract**: When adding columns, say "Add column X to the CSV export and to the type Y so spreadsheets can bucket by thing."

---

## 9. Direct Answers to Your Questions

- **Requiring a valid link to nominate must be removed.**  
  → Do it in Layer 1 (form + server accept link-optional, new identity for link-free).

- **Name/description only if they can (1) clearly define an identifiable thing and (2) be reliably categorized for popularity.**  
  → (1) We can define "thing" by heuristic (Layer 2) or by batch/LLM (Layer 3/4). (2) Categorization for popularity is then "count by thing" (in-app by normalized id, or in CSV by "Resolved Thing").

- **Is the latter possible with CSV (with optional link)?**  
  → Yes: either per-entry agent adding a column (at submit or in a script on CSV), or batch agent that runs on the full CSV and adds a "Resolved Thing" / bucket column.

- **Separate agent to parse entry and add to CSV vs agent that analyzes all entries after collection?**  
  → Both work. Per-entry: better for in-app "nominate too" and instant CSV column. Batch: no server/LLM at submit; run once on export; can use cross-row context; better for one-off or spreadsheet-centric workflows.

- **Award as data point for guessing intent.**  
  → Yes; use award (category) as a required input to any resolution step (per-entry or batch).

---

## 10. Suggested Order of Work

1. **Layer 1** – Ship link-optional, name/description required, new storage shape and CSV. No "thing" yet; no change to "nominate too" for link-free (or hide "nominate too" for those).
2. **Layer 2** – Add heuristic "thing" id and use it for dedupe and voteCount; add to CSV. Keeps everything in-app and spreadsheet-friendly without external APIs.
3. **Layer 3** – If you want finer-grained bucketing, add a batch script (or spreadsheet flow) that adds "Resolved Thing" to CSV using category + title/description + optional URL.
4. **Layer 4** – Only if you need higher-quality resolution in-app; add optional API call at submit with fallback to Layer 2.

This keeps the nomination experience engaging (low friction, no required link), preserves the option to use name/description + optional link for identity and popularity, and uses the award as a signal in any resolution step. Use the doc and one-layer-at-a-time prompts to implement cleanly and avoid scope creep.
