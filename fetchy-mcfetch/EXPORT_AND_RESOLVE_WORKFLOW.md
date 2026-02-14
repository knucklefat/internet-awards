# Export → Resolve Script → Output: Full Workflow

**Goal:** Test the sanctity of the data export and the script that buckets nominees into digestible “things” for finalist selection.

---

## Overview

1. **Export** – Get a CSV of all nominations from the app (Redis → CSV).
2. **Resolve** – Run `add-resolved-thing.js` to add a **Resolved Thing** column (slug-only or LLM canonical labels).
3. **Output** – Open the CSV in Excel/Sheets and pivot (or COUNTIF) by **Resolved Thing** to see popularity per bucket and surface finalists.

---

## Step 1: Get the CSV (Export)

### Option A: From the app (recommended for real Reddit data)

1. Open the app in Reddit (or playtest): splash → “Submit Nominee” → main WebView.
2. Log in as a **mod** and open the admin panel (type **admin**).
3. Click **“Export All to CSV”** (or export by category if you prefer).
4. The app fetches `GET /api/export-csv` and receives the CSV. Depending on the WebView environment it may:
   - Copy the CSV to the clipboard, or
   - Trigger a download.
5. **Paste or save** the contents to a file, e.g. `csv-downloads/nominations-YYYY-MM-DD.csv`.

### Option B: From a running server (e.g. playtest)

If the Devvit server is running locally (e.g. `npm run dev` then playtest so the server is up):

```bash
# Export all (no category filter)
curl -o csv-downloads/export-all.csv "http://localhost:3000/api/export-csv"

# Or with a category
curl -o csv-downloads/export-detour.csv "http://localhost:3000/api/export-csv?category=destination-having-moment"
```

**Note:** In production the app runs on Devvit’s infrastructure; you don’t hit “localhost.” Export is done from inside the app (Option A).

### CSV format (what the server returns)

Headers:

`Category`, `Category Group`, `Post Title`, `Author`, `Subreddit`, `Karma`, `URL`, `Nominated By`, `Reason`, `Thing Slug`, `Vote Count`, `Timestamp`

Each row is one nomination (or one “bucket” with vote count if multiple users nominated the same thing).

---

## Step 2: Run the resolve script

The script **adds one column: “Resolved Thing”**. Same CSV structure, plus that column.

### Layer 3 only (no API key)

Uses **Thing Slug** if present, otherwise a normalized slug from **Post Title** (same logic as the app). No external calls.

```bash
cd fetchy-mcfetch

# Read from file, write to new file
node scripts/add-resolved-thing.js csv-downloads/nominations-2026-02-05.csv csv-downloads/nominations-resolved.csv

# Or stdin → stdout
cat csv-downloads/nominations-2026-02-05.csv | node scripts/add-resolved-thing.js
```

### Layer 4 with OpenAI

Canonical short labels (e.g. “Minnesota”, “New York City”) via OpenAI. Requires `OPENAI_API_KEY`.

```bash
export OPENAI_API_KEY=sk-...
node scripts/add-resolved-thing.js --llm csv-downloads/nominations-2026-02-05.csv csv-downloads/nominations-llm.csv
```

### Layer 4 with Gemini Pro (recommended if you have a Gemini account)

Same idea as OpenAI but uses Google’s Gemini API. Requires `GEMINI_API_KEY`. Get a key at [Google AI Studio](https://aistudio.google.com/app/apikey).

```bash
export GEMINI_API_KEY=your-key
node scripts/add-resolved-thing.js --gemini csv-downloads/nominations-2026-02-05.csv csv-downloads/nominations-gemini.csv
```

Or with npm script:

```bash
npm run resolve-csv -- --gemini csv-downloads/nominations-2026-02-05.csv csv-downloads/nominations-gemini.csv
```

If both `--llm` and `--gemini` are omitted, the script uses Layer 3 only (slug).

---

## Step 3: Use the output for finalists

1. Open the **output CSV** (e.g. `nominations-resolved.csv` or `nominations-gemini.csv`) in Excel or Google Sheets.
2. Ensure the **Resolved Thing** column is present.
3. **Pivot** (or COUNTIF) by **Resolved Thing** to get counts per bucket.
4. Filter by **Category** when you need per-award analysis.
5. Use the counts + labels to choose finalists (e.g. top N per award).

**Sanctity checks:**

- Row count in export CSV should match the “total nominations” (or bucket count) you see in the app.
- After the script, row count should be unchanged; only the new column is added.
- Spot-check a few rows: **Post Title** and **Thing Slug** should match app data; **Resolved Thing** should be the slug (Layer 3) or a short label (Layer 4).

---

## Quick test with mock data

If you don’t have a live export yet, use the mock file:

```bash
# Layer 3 only
node scripts/add-resolved-thing.js csv-downloads/mock-detour-destination-nominations.csv csv-downloads/mock-resolved.csv

# Layer 4 with Gemini
export GEMINI_API_KEY=your-key
node scripts/add-resolved-thing.js --gemini csv-downloads/mock-detour-destination-nominations.csv csv-downloads/mock-gemini-resolved.csv
```

Then open `csv-downloads/mock-gemini-resolved.csv` and confirm the **Resolved Thing** column looks sensible (e.g. place names for “Detour Destination”).

---

## Summary

| Step | Action |
|------|--------|
| 1 | Export CSV from Admin panel (or curl to running server) → save to `csv-downloads/`. |
| 2 | Run `node scripts/add-resolved-thing.js [--llm or --gemini] input.csv output.csv`. |
| 3 | Open output CSV in Sheets/Excel; pivot by Resolved Thing (and filter by Category) to surface finalists. |

Using **Gemini Pro** instead of OpenAI: use `--gemini` and `GEMINI_API_KEY` as above; no OpenAI key needed.
