# Scripts

## add-resolved-thing.js (Layer 3)

Adds a **Resolved Thing** column to the exported nominations CSV so you can bucket and count popularity in a spreadsheet.

### What it does

- Reads CSV from file or stdin (same format as `/api/export-csv`: Category, Category Group, Post Title, Author, Subreddit, Karma, URL, Nominated By, Reason, Thing Slug, Vote Count, Timestamp).
- For each row: **Resolved Thing** = existing **Thing Slug** when present, otherwise a normalized slug from **Post Title** (same heuristic as the app’s Layer 2). Category is available in the row for future LLM/context use.
- Writes the same CSV with a new column **Resolved Thing** (inserted after Thing Slug).

### Usage

```bash
# From file → stdout
node scripts/add-resolved-thing.js nominations.csv

# From file → file
node scripts/add-resolved-thing.js nominations.csv nominations-with-resolved.csv

# Stdin → stdout (e.g. pipe from export)
node scripts/add-resolved-thing.js < csv-downloads/nominations-2026-02-05.csv > resolved.csv
```

Or use the npm script (then pass paths as needed):

```bash
npm run resolve-csv -- input.csv output.csv
npm run resolve-csv -- < input.csv > output.csv
```

### Spreadsheet use

1. Export nominations from the app (Admin → Export or `/api/export-csv`).
2. Run: `node scripts/add-resolved-thing.js input.csv output.csv`.
3. Open `output.csv` in Excel/Sheets and pivot (or COUNTIF) by **Resolved Thing** to see popularity per thing.
4. **Category** is in each row so you can filter by award when analyzing.

### Optional: LLM enrichment

The script is rule-based by default. To use an LLM to derive a richer “Resolved Thing” (e.g. merge “Elden Ring” and “Elden Ring DLC” into one bucket), you can extend the script: for each row, call your API with `Category` + `Post Title` (+ optional `Reason` / `URL`) and append the model’s label as **Resolved Thing**. Award category should be passed as context so the model knows the domain (e.g. gaming award → nominee is likely a game).
