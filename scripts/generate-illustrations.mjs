#!/usr/bin/env node
/**
 * Illustration generator — MANUAL ONLY. Never invoked by the site build.
 *
 * Reads each case's illustration prompt from `src/data/cases.ts`, prepends the
 * shared style preamble from `src/assets/illustrations/STYLE.md`, calls a Vertex
 * AI image model via Application Default Credentials, writes the PNG to
 * `src/assets/illustrations/<id>.png`, and upserts a provenance entry into
 * `src/assets/illustrations/provenance.json`.
 *
 * Prerequisites (operator's responsibility, not the build's):
 *   - `gcloud auth application-default login` (or a service-account ADC file
 *     pointed to by GOOGLE_APPLICATION_CREDENTIALS).
 *   - GOOGLE_CLOUD_PROJECT set to a project with Vertex AI enabled.
 *
 * Run:  node scripts/generate-illustrations.mjs            # all cases
 *       node scripts/generate-illustrations.mjs <id> ...   # selected cases
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { GoogleGenAI } from '@google/genai';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ILLUSTRATIONS_DIR = join(ROOT, 'src/assets/illustrations');
const PROVENANCE_PATH = join(ILLUSTRATIONS_DIR, 'provenance.json');
const STYLE_PATH = join(ILLUSTRATIONS_DIR, 'STYLE.md');

// Gemini 3.x image-preview models are served on the Vertex `global` endpoint,
// not on regional ones (a regional call 404s). Override with GOOGLE_CLOUD_LOCATION
// if the availability set changes between previews.
const MODEL = 'gemini-3.1-flash-image-preview';
const REGION = process.env.GOOGLE_CLOUD_LOCATION || 'global';

/** Reproducibility knobs recorded verbatim in provenance. */
const GENERATION_PARAMS = {
  aspectRatio: '3:2',
  // Image-preview models do not currently expose a stable seed; recorded as
  // null so the provenance schema is uniform with future seeded runs.
};

/**
 * Pull the `cases` array out of `src/data/cases.ts` without a TS toolchain.
 * The data file is plain data — we strip the type annotations Node can't parse
 * by importing it through a tiny on-the-fly transform is overkill; instead we
 * read the validated copy from the compiled-at-runtime module. Node 22+ can
 * import TS via --experimental-strip-types; we rely on that flag at call time.
 */
async function loadCases() {
  const mod = await import(
    pathToFileURL(join(ROOT, 'src/data/cases.ts')).href
  );
  return { cases: mod.cases };
}

/** Extract the style preamble (the blockquote under "## Art direction"). */
async function loadStylePreamble() {
  const md = await readFile(STYLE_PATH, 'utf8');
  const lines = md.split('\n');
  const start = lines.findIndex((l) => l.startsWith('## Art direction'));
  if (start === -1) {
    throw new Error('STYLE.md: "## Art direction" heading not found');
  }
  const quote = [];
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i];
    if (l.startsWith('> ')) quote.push(l.slice(2).trim());
    else if (l.startsWith('>')) quote.push('');
    else if (quote.length) break;
  }
  return quote.join(' ').replace(/\s+/g, ' ').trim();
}

async function loadProvenance() {
  if (!existsSync(PROVENANCE_PATH)) return { illustrations: [] };
  return JSON.parse(await readFile(PROVENANCE_PATH, 'utf8'));
}

function upsertProvenance(provenance, entry) {
  const idx = provenance.illustrations.findIndex((e) => e.file === entry.file);
  if (idx === -1) provenance.illustrations.push(entry);
  else provenance.illustrations[idx] = entry;
  provenance.illustrations.sort((a, b) => a.file.localeCompare(b.file));
}

async function main() {
  const selected = process.argv.slice(2);
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  if (!project) {
    console.error('GOOGLE_CLOUD_PROJECT is not set. Aborting.');
    process.exit(1);
  }

  const [{ cases }, preamble, provenance] = await Promise.all([
    loadCases(),
    loadStylePreamble(),
    loadProvenance(),
  ]);

  await mkdir(ILLUSTRATIONS_DIR, { recursive: true });

  // ADC: GoogleGenAI picks up Application Default Credentials when
  // vertexai:true and no apiKey is provided.
  const ai = new GoogleGenAI({ vertexai: true, project, location: REGION });

  const todo = selected.length
    ? cases.filter((c) => selected.includes(c.id))
    : cases;

  if (!todo.length) {
    console.error(`No matching cases for: ${selected.join(', ')}`);
    process.exit(1);
  }

  for (const c of todo) {
    const prompt = `${preamble}\n\n${c.illustration.prompt}\n\nComposition: landscape, ${GENERATION_PARAMS.aspectRatio} aspect ratio.`;
    console.log(`\n→ Generating ${c.illustration.file} (${c.id})`);

    // gemini-*-flash-image (the "Nano Banana" family) is a Gemini model: image
    // output comes back through generateContent as an inlineData part, NOT via
    // the Imagen-only generateImages API. responseModalities must request IMAGE.
    // Preview image models are tightly rate-limited; retry 429s with backoff
    // so a single throttle does not abort a multi-image run partway through.
    let response;
    for (let attempt = 1; ; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: MODEL,
          contents: prompt,
          config: { responseModalities: ['TEXT', 'IMAGE'] },
        });
        break;
      } catch (err) {
        if (err?.status === 429 && attempt <= 4) {
          const wait = attempt * 20000;
          console.log(`  rate-limited (429); retrying in ${wait / 1000}s (attempt ${attempt}/4)`);
          await new Promise((r) => setTimeout(r, wait));
          continue;
        }
        throw err;
      }
    }

    const parts = response?.candidates?.[0]?.content?.parts ?? [];
    const bytes = parts.find((p) => p.inlineData?.data)?.inlineData?.data;
    if (!bytes) {
      throw new Error(`${c.id}: model returned no image bytes`);
    }

    const outPath = join(ILLUSTRATIONS_DIR, c.illustration.file);
    await writeFile(outPath, Buffer.from(bytes, 'base64'));
    console.log(`  wrote ${outPath}`);

    upsertProvenance(provenance, {
      file: c.illustration.file,
      prompt,
      model: MODEL,
      region: REGION,
      date: new Date().toISOString().slice(0, 10),
      seed: null,
      params: GENERATION_PARAMS,
    });

    // Persist provenance after each image so a mid-run failure (e.g. a 429 on a
    // later image) never leaves an already-written PNG without its entry.
    await writeFile(PROVENANCE_PATH, JSON.stringify(provenance, null, 2) + '\n');
  }

  await writeFile(
    PROVENANCE_PATH,
    JSON.stringify(provenance, null, 2) + '\n',
  );
  console.log(`\nProvenance updated: ${PROVENANCE_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
