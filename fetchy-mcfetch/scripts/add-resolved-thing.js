#!/usr/bin/env node
/**
 * Layer 3 + optional Layer 4: Add "Resolved Thing" column to exported nominations CSV.
 *
 * Layer 3 (default): Resolved Thing = existing "Thing Slug" when present, else
 * normalized slug from "Post Title" (same heuristic as Layer 2).
 *
 * Layer 4 (--llm): Call OpenAI to get a short canonical label. Requires OPENAI_API_KEY.
 * Layer 4 (--gemini): Same but use Google Gemini. Requires GEMINI_API_KEY.
 * Fallback to Layer 3 slug on missing key, error, or empty response.
 *
 * Usage:
 *   node scripts/add-resolved-thing.js [input.csv] [output.csv]
 *   node scripts/add-resolved-thing.js --llm input.csv output.csv
 *   node scripts/add-resolved-thing.js --gemini input.csv output.csv
 *   LAYER4_LLM=1 node scripts/add-resolved-thing.js input.csv output.csv
 *
 * If only one path is given, it's the input; output goes to stdout.
 * If no paths are given, reads stdin and writes stdout.
 */

import { createReadStream, createWriteStream } from 'fs';
import { createInterface } from 'readline';

const THING_SLUG_MAX_LENGTH = 80;
const LLM_DELAY_MS = 350;

/**
 * Per-award constraint: what type of "thing" the LLM should output (resolution guidance).
 * Key = Category id (from CSV). Value = short instruction so the model returns
 * the right kind of label. Aligned with event-config resolutionGuidance.
 */
const THING_TYPE_BY_CATEGORY = {
  'best-gaming-moment': 'Game Title. A video game on any digital platform.',
  'holy-grail-collectible': 'Title of Something that people collect.',
  'best-artistic-creation': 'Link or image of a Piece of art. The artistic work or creation.',
  'most-quotable-quote-fiction': 'Literary Title or Author. Work of fiction.',
  'funniest-original-content': 'Title of a published comic or Comedian.',
  'outstanding-aww': 'Specific animal.',
  'meme-won-internet': 'Single Meme. The meme or viral image.',
  'wholesomest-moment': 'Title or Description of a piece of content. Wholesome or heartwarming content.',
  'best-plot-twist': 'Title or Description of a subject. Thread or thought-starter.',
  'most-innovative-tech': 'Title of a technology or name of company.',
  'breakthrough-scientific-discovery': 'Title or description of subject. Research, discovery, or finding in science.',
  'most-informative-episode': 'Title of a podcast, stream, or streamer.',
  'life-hack-changed-everything': 'Title or Description. The life hack.',
  'destination-having-moment': 'Name of a physical location. Travel destination only. Never a person.',
  'best-fashion-style-trend': 'Name of a style or brand.',
  'best-original-dish': 'Title or description of a recipe, dish, or drink.',
  'best-show-episode': 'Title of a show and/or episode of a show.',
  'absolute-cinema-moment': 'Title of a Movie.',
  'best-sports-moment': 'Title or description of an athletic team, player or game.',
  'hottest-earworm': 'Title of a song or musical artist.',
  'community-moment': 'Name of a subreddit or community.',
  'best-channel-stream-podcast': 'Title or name of a podcast, podcaster or streamer.',
  'best-internet-trend': 'Name or Description of an internet trend.',
  'most-quotable-ama': 'Title or name or reddit post title. The AMA subject.',
};

function getThingConstraint(categoryId) {
  if (typeof categoryId === 'string' && categoryId.trim()) {
    const key = categoryId.trim();
    if (THING_TYPE_BY_CATEGORY[key]) return THING_TYPE_BY_CATEGORY[key];
  }
  return 'a single short canonical label for the thing being nominated (place, work, event, or thing). Output only the label. Not a person unless the award is for a person.';
}

function normalizeThingSlug(title) {
  if (typeof title !== 'string') return '';
  const t = title.trim().toLowerCase().replace(/\s+/g, ' ');
  const slug = t
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug.slice(0, THING_SLUG_MAX_LENGTH);
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function getSystemPrompt(categoryId) {
  const constraint = getThingConstraint(categoryId);
  return `You output a single short canonical label for the thing being nominated.

For this award we want: ${constraint}

Output only the label, one line, no quotes or explanation. Use title case for proper nouns.`;
}

function buildUserContent(category, categoryGroup, postTitle, reason, url) {
  const parts = [
    `Award category: ${category}${categoryGroup ? ` (${categoryGroup})` : ''}.`,
    `Nomination: ${(postTitle || '').trim() || '(no title)'}`,
  ];
  if (reason && String(reason).trim()) parts.push(`Reason: ${String(reason).trim()}`);
  if (url && String(url).trim()) parts.push(`URL: ${String(url).trim()}`);
  return parts.join('\n');
}

/**
 * Layer 4 (OpenAI): resolve a short canonical "thing" label. Returns label or null.
 */
async function resolveThingWithOpenAI(apiKey, category, categoryGroup, postTitle, reason, url) {
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) return null;
  const systemPrompt = getSystemPrompt(category);
  const userContent = buildUserContent(category, categoryGroup, postTitle, reason, url);
  const body = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    max_tokens: 50,
    temperature: 0.2,
  };
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey.trim()}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`OpenAI API error ${res.status}: ${errText.slice(0, 200)}`);
      return null;
    }
    const data = await res.json();
    const label = data?.choices?.[0]?.message?.content;
    if (typeof label !== 'string') return null;
    return label.trim().replace(/\n.*/s, '').trim() || null;
  } catch (err) {
    console.error('OpenAI resolve error:', err.message);
    return null;
  }
}

/**
 * Layer 4 (Gemini): resolve a short canonical "thing" label via Google Gemini API.
 * Uses gemini-1.5-flash. Returns label or null.
 */
async function resolveThingWithGemini(apiKey, category, categoryGroup, postTitle, reason, url) {
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) return null;
  const systemPrompt = getSystemPrompt(category);
  const userContent = buildUserContent(category, categoryGroup, postTitle, reason, url);
  const model = 'gemini-1.5-flash';
  const body = {
    contents: [{ parts: [{ text: userContent }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: { maxOutputTokens: 50, temperature: 0.2 },
  };
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey.trim(),
        },
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) {
      const errText = await res.text();
      console.error(`Gemini API error ${res.status}: ${errText.slice(0, 200)}`);
      return null;
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string') return null;
    return text.trim().replace(/\n.*/s, '').trim() || null;
  } catch (err) {
    console.error('Gemini resolve error:', err.message);
    return null;
  }
}

/**
 * Parse a single CSV line (handles quoted fields with commas and escaped quotes).
 */
function parseCsvLine(line) {
  const out = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let field = '';
      i += 1;
      while (i < line.length) {
        if (line[i] === '"') {
          if (line[i + 1] === '"') {
            field += '"';
            i += 2;
          } else {
            i += 1;
            break;
          }
        } else {
          field += line[i];
          i += 1;
        }
      }
      out.push(field);
      if (i < line.length && line[i] === ',') i += 1;
    } else {
      const comma = line.indexOf(',', i);
      if (comma === -1) {
        out.push(line.slice(i).trim());
        break;
      }
      out.push(line.slice(i, comma).trim());
      i = comma + 1;
    }
  }
  return out;
}

/**
 * Escape a field for CSV (quote if contains comma, newline, or quote).
 */
function escapeCsvField(value) {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function getStdinReader() {
  return createInterface({ input: process.stdin, crlfDelay: Infinity });
}

function getFileReader(path) {
  return createInterface({
    input: createReadStream(path, 'utf8'),
    crlfDelay: Infinity,
  });
}

async function run(inputPath, outputPath, useLLM, useGemini) {
  const reader = inputPath ? getFileReader(inputPath) : getStdinReader();
  const outStream = outputPath ? createWriteStream(outputPath, 'utf8') : process.stdout;

  const COL_CATEGORY = 'Category';
  const COL_CATEGORY_GROUP = 'Category Group';
  const COL_POST_TITLE = 'Post Title';
  const COL_REASON = 'Reason';
  const COL_URL = 'URL';
  const COL_THING_SLUG = 'Thing Slug';
  const COL_RESOLVED_THING = 'Resolved Thing';

  const openaiKey = useLLM ? (process.env.OPENAI_API_KEY || '').trim() : '';
  const geminiKey = useGemini ? (process.env.GEMINI_API_KEY || '').trim() : '';
  if (useLLM && !openaiKey) {
    console.error('Layer 4 (--llm) requires OPENAI_API_KEY. Falling back to Layer 3 (slug).');
  }
  if (useGemini && !geminiKey) {
    console.error('Layer 4 (--gemini) requires GEMINI_API_KEY. Falling back to Layer 3 (slug).');
  }
  const useLayer4 = (useLLM && openaiKey) || (useGemini && geminiKey);

  let headerRow = null;
  let headerIndex = null;
  let idxCategory = -1;
  let idxCategoryGroup = -1;
  let idxPostTitle = -1;
  let idxReason = -1;
  let idxUrl = -1;
  let idxThingSlug = -1;
  let insertColIndex = -1;

  const write = (line) => {
    if (outStream === process.stdout) {
      process.stdout.write(line + '\n');
    } else {
      outStream.write(line + '\n');
    }
  };

  for await (const line of reader) {
    const row = parseCsvLine(line);

    if (headerIndex === null) {
      headerRow = row;
      headerIndex = {};
      headerRow.forEach((h, i) => {
        headerIndex[h] = i;
      });
      idxCategory = headerIndex[COL_CATEGORY] ?? -1;
      idxCategoryGroup = headerIndex[COL_CATEGORY_GROUP] ?? -1;
      idxPostTitle = headerIndex[COL_POST_TITLE] ?? -1;
      idxReason = headerIndex[COL_REASON] ?? -1;
      idxUrl = headerIndex[COL_URL] ?? -1;
      idxThingSlug = headerIndex[COL_THING_SLUG] ?? -1;
      insertColIndex = idxThingSlug >= 0 ? idxThingSlug + 1 : headerRow.length;
      const newHeaders = [...headerRow];
      newHeaders.splice(insertColIndex, 0, COL_RESOLVED_THING);
      write(newHeaders.map(escapeCsvField).join(','));
      continue;
    }

    const postTitle = idxPostTitle >= 0 ? row[idxPostTitle] ?? '' : '';
    const thingSlug = idxThingSlug >= 0 ? (row[idxThingSlug] ?? '').trim() : '';
    const slugFallback = thingSlug.length > 0 ? thingSlug : normalizeThingSlug(postTitle);

    let resolvedThing = slugFallback;

    if (useLayer4) {
      const category = idxCategory >= 0 ? row[idxCategory] ?? '' : '';
      const categoryGroup = idxCategoryGroup >= 0 ? row[idxCategoryGroup] ?? '' : '';
      const reason = idxReason >= 0 ? row[idxReason] ?? '' : '';
      const url = idxUrl >= 0 ? row[idxUrl] ?? '' : '';
      const label = useGemini && geminiKey
        ? await resolveThingWithGemini(geminiKey, category, categoryGroup, postTitle, reason, url)
        : await resolveThingWithOpenAI(openaiKey, category, categoryGroup, postTitle, reason, url);
      if (label) resolvedThing = label;
      await delay(LLM_DELAY_MS);
    }

    const newRow = [...row];
    newRow.splice(insertColIndex, 0, resolvedThing);
    write(newRow.map(escapeCsvField).join(','));
  }

  if (outStream !== process.stdout) {
    outStream.end();
  }
}

const argv = process.argv.slice(2);
const llmFlag = argv.indexOf('--llm');
const geminiFlag = argv.indexOf('--gemini');
const useLLM = process.env.LAYER4_LLM === '1' || llmFlag >= 0;
const useGemini = process.env.USE_GEMINI === '1' || geminiFlag >= 0;
const filteredArgv = argv.filter((_, i) => i !== llmFlag && i !== geminiFlag);
const [inputPath, outputPath] = filteredArgv;

run(inputPath, outputPath, useLLM, useGemini).catch((err) => {
  console.error('add-resolved-thing error:', err.message);
  process.exit(1);
});
