#!/usr/bin/env node
/**
 * Layer 3: Batch script to add "Resolved Thing" column to exported nominations CSV.
 *
 * Uses category as context. Resolved Thing = existing "Thing Slug" when present,
 * else normalized slug from "Post Title" (same heuristic as Layer 2). Use the
 * output in a spreadsheet to pivot/count by Resolved Thing for popularity.
 *
 * Usage:
 *   node scripts/add-resolved-thing.js [input.csv] [output.csv]
 *   node scripts/add-resolved-thing.js < input.csv > output.csv
 *
 * If only one path is given, it's the input; output goes to stdout.
 * If no paths are given, reads stdin and writes stdout.
 */

import { createReadStream, createWriteStream } from 'fs';
import { createInterface } from 'readline';
import { pipeline } from 'stream/promises';

const THING_SLUG_MAX_LENGTH = 80;

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

async function run(inputPath, outputPath) {
  const reader = inputPath ? getFileReader(inputPath) : getStdinReader();
  const outStream = outputPath ? createWriteStream(outputPath, 'utf8') : process.stdout;

  const COL_POST_TITLE = 'Post Title';
  const COL_THING_SLUG = 'Thing Slug';
  const COL_RESOLVED_THING = 'Resolved Thing';

  let headerRow = null;
  let headerIndex = null;
  let idxPostTitle = -1;
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
      idxPostTitle = headerIndex[COL_POST_TITLE] ?? -1;
      idxThingSlug = headerIndex[COL_THING_SLUG] ?? -1;
      // Insert "Resolved Thing" after "Thing Slug" if present, else at end
      insertColIndex = idxThingSlug >= 0 ? idxThingSlug + 1 : headerRow.length;
      const newHeaders = [...headerRow];
      newHeaders.splice(insertColIndex, 0, COL_RESOLVED_THING);
      write(newHeaders.map(escapeCsvField).join(','));
      continue;
    }

    const postTitle = idxPostTitle >= 0 ? row[idxPostTitle] ?? '' : '';
    const thingSlug = idxThingSlug >= 0 ? (row[idxThingSlug] ?? '').trim() : '';
    const resolvedThing =
      thingSlug.length > 0 ? thingSlug : normalizeThingSlug(postTitle);

    const newRow = [...row];
    newRow.splice(insertColIndex, 0, resolvedThing);
    write(newRow.map(escapeCsvField).join(','));
  }

  if (outStream !== process.stdout) {
    outStream.end();
  }
}

const [inputPath, outputPath] = process.argv.slice(2);
run(inputPath, outputPath).catch((err) => {
  console.error('add-resolved-thing error:', err.message);
  process.exit(1);
});
