# Scripts

## Workflow: Clipboard → Google Sheets → Resolved Thing → Side-by-side

1. **Export from the app**  
   In the app, open Admin → export nominations. The CSV is **copied to your clipboard**.

2. **Paste → clean CSV file**  
   Open **`paste-to-csv.html`** in a browser (double-click the file or open from the repo).  
   Paste the clipboard content into the text area and click **Download CSV**.  
   Save the file (e.g. `nominations.csv`). This produces a proper CSV that opens correctly in Google Sheets.

3. **Add “Resolved Thing”**  
   Run the resolve script on that file (see below).  
   Example:  
   `node scripts/add-resolved-thing.js nominations.csv nominations-resolved.csv`  
   Or with LLM:  
   `node scripts/add-resolved-thing.js --llm nominations.csv nominations-resolved.csv`

4. **View side-by-side in Google Sheets**  
   - Open **nominations.csv** in Sheets (File → Open or drag the file).  
   - Open **nominations-resolved.csv** in another tab (or File → Open again).  
   - Place the two tabs side by side, or use a second window, to compare original and resolved “Thing” column.

---

## paste-to-csv.html

Converts **raw pasted CSV text** (e.g. from the app’s clipboard export) into a **downloadable .csv file** that opens correctly in Google Sheets.

- Open the file in any browser (no server needed).  
- Paste your exported CSV into the text area.  
- Click **Download CSV** to get a UTF-8 CSV with proper quoting and line endings.  
- Open the downloaded file in Google Sheets.

---

## add-resolved-thing.js (Layer 3 + optional Layer 4)

Adds a **Resolved Thing** column to the exported nominations CSV so you can bucket and count popularity in a spreadsheet.

### What it does

- **Layer 3 (default):** **Resolved Thing** = existing **Thing Slug** when present, otherwise a normalized slug from **Post Title** (same heuristic as the app's Layer 2).
- **Layer 4 (--llm):** Calls **OpenAI** (gpt-4o-mini) for a short canonical label. Requires `OPENAI_API_KEY`. Falls back to Layer 3 if key is missing or the API errors.
- **Layer 4 (--gemini):** Same as above but uses **Google Gemini** (gemini-1.5-flash). Requires `GEMINI_API_KEY` (get one at [Google AI Studio](https://aistudio.google.com/app/apikey)). Use this if you prefer your Gemini Pro account over OpenAI.

### Usage

```bash
# Layer 3 only (slug): file → stdout
node scripts/add-resolved-thing.js nominations.csv

# Layer 3: file → file
node scripts/add-resolved-thing.js nominations.csv nominations-with-resolved.csv

# Layer 4 with OpenAI
node scripts/add-resolved-thing.js --llm nominations.csv nominations-llm-resolved.csv

# Layer 4 with Gemini (use your Gemini Pro account)
export GEMINI_API_KEY=your-key
node scripts/add-resolved-thing.js --gemini nominations.csv nominations-gemini-resolved.csv
```

Or use the npm script:

```bash
npm run resolve-csv -- input.csv output.csv
npm run resolve-csv -- --llm input.csv output.csv
npm run resolve-csv -- --gemini input.csv output.csv
```

### Layer 4: getting labels like "Minnesota" and "New York City"

**Option A – OpenAI:** Set `OPENAI_API_KEY` (platform.openai.com), then run with `--llm`.

**Option B – Gemini:** Set `GEMINI_API_KEY` (from [Google AI Studio](https://aistudio.google.com/app/apikey)), then run with `--gemini`:

```bash
export GEMINI_API_KEY=your-key
node scripts/add-resolved-thing.js --gemini csv-downloads/mock-detour-destination-nominations.csv csv-downloads/mock-gemini-resolved.csv
```

The script sends each row's **Category**, **Post Title**, **Reason**, and **URL** to the model and asks for a single short label. Open the output CSV and pivot by **Resolved Thing** to see popularity per bucket.

### Spreadsheet use

1. Export from the app (clipboard), then use **paste-to-csv.html** to download a clean CSV (see workflow above).
2. Run this script on that file (with or without `--llm`).
3. Open the **resolved** CSV in Excel/Sheets and pivot (or COUNTIF) by **Resolved Thing** to see popularity per thing. Open the **original** CSV in a second tab/sheet to view side-by-side.
4. **Category** is in each row so you can filter by award when analyzing.
