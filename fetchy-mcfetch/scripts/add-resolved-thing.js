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
 * Per-award constraint: what type of "thing" the LLM should output.
 * Key = Category id (from CSV). Value = short instruction so the model returns
 * the right kind of label (e.g. place for Detour Destination, not a person).
 */
const THING_TYPE_BY_CATEGORY = {
  'best-gaming-moment': 'a video game: title on any digital platform. Not a person.',
  'holy-grail-collectible': 'the collectible item or product name. Not a person.',
  'most-quotable-quote-fiction': 'the work of fiction (book, story, series). Not a person unless they are the author.',
  'best-artistic-creation': 'the artistic work or creation (art, design, craft). Not a person unless they are the artist.',
  'funniest-original-content': 'the comedy content (skit, clip, joke, meme). Can be creator name if the nomination is "that person\'s content".',
  'outstanding-aww': 'the animal or animal content (species, pet name, or viral animal).',
  'meme-won-internet': 'the meme, viral image, or phrase. Not a person.',
  'wholesomest-moment': 'the moment, act, or story (event or thing). Can be a short description.',
  'best-plot-twist': 'a factual subject or event. Not a person.',
  'most-innovative-tech': 'the tech product, innovation, or device. Not a person or company unless the nomination is for that product.',
  'breakthrough-scientific-discovery': 'the scientific discovery, finding, or research (short name). Not a person.',
  'most-informative-episode': 'an episode from a streamer or podcaster (show name, episode title, or channel). Not a person unless they are the show.',
  'life-hack-changed-everything': 'the life hack (tip, method, or product name). Not a person.',
  'destination-having-moment': 'a PLACE only: travel destination, city, region, country, or landmark. Never a person. If the nomination mentions a person, output the place they are associated with (e.g. New York City not the mayor).',
  'best-fashion-style-trend': 'the fashion, style, or beauty trend (look name or trend). Not a person.',
  'best-original-dish': 'the dish, recipe, or culinary creation. Not a person or restaurant unless it\'s the dish name.',
  'best-show-episode': 'the TV episode or series (show name, or "Show Name: Episode"). Not a person.',
  'absolute-cinema-moment': 'the film or movie title. Not a person.',
  'best-sports-moment': 'the sports moment or event (game, play, tournament). Can include athlete name if the moment is "that play".',
  'hottest-earworm': 'the song or musical work (title and/or artist). Not a person unless they are the artist.',
  'community-moment': 'the moment or event that brought community together (short description). Not a person.',
  'most-rewarding-rabbit-hole': 'the thread, topic, or rabbit hole subject (short name). Not a person.',
  'best-channel-stream-podcast': 'the channel, stream, or podcast (show or creator name).',
  'best-internet-trend': 'the trend name or short description. Not a person.',
  'most-quotable-ama': 'the AMA subject (person or topic of the AMA, e.g. "Neil deGrasse Tyson AMA").',
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
