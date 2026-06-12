#!/usr/bin/env node
/**
 * Bidirectional illustration integrity check. Run in CI before the test pass.
 *
 *   (a) Every illustration referenced in `src/data/cases.ts` exists on disk
 *       AND has a `provenance.json` entry.
 *   (b) Every `*.png` under `src/assets/illustrations/` has a `provenance.json`
 *       entry (no orphans).
 *
 * Exit 1 on any violation. This guards Requirement 7/8 of spec 0001: no
 * untraceable image ships.
 *
 * Reads filenames from `cases.ts` by static parse (no TS toolchain needed), so
 * it runs on a bare `node` with no build step.
 */

import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ILLUSTRATIONS_DIR = join(ROOT, 'src/assets/illustrations');
const PROVENANCE_PATH = join(ILLUSTRATIONS_DIR, 'provenance.json');
const CASES_PATH = join(ROOT, 'src/data/cases.ts');

/** Parse `file: '<name>.png'` occurrences out of the cases data file. */
async function referencedFiles() {
  const src = await readFile(CASES_PATH, 'utf8');
  const files = new Set();
  const re = /file:\s*['"]([^'"]+\.png)['"]/g;
  let m;
  while ((m = re.exec(src)) !== null) files.add(m[1]);
  return [...files];
}

async function onDiskPngs() {
  const entries = await readdir(ILLUSTRATIONS_DIR);
  return entries.filter((e) => e.toLowerCase().endsWith('.png'));
}

async function provenanceFiles() {
  if (!existsSync(PROVENANCE_PATH)) {
    return { entries: [], missing: true };
  }
  const data = JSON.parse(await readFile(PROVENANCE_PATH, 'utf8'));
  const list = Array.isArray(data.illustrations) ? data.illustrations : [];
  return { entries: list.map((e) => e.file), missing: false };
}

async function main() {
  const [referenced, disk, prov] = await Promise.all([
    referencedFiles(),
    onDiskPngs(),
    provenanceFiles(),
  ]);

  const errors = [];

  if (prov.missing) {
    errors.push(`provenance.json is missing at ${PROVENANCE_PATH}`);
  }
  const provSet = new Set(prov.entries);
  const diskSet = new Set(disk);

  // (a) Referenced ⇒ on disk AND in provenance.
  for (const file of referenced) {
    if (!diskSet.has(file)) {
      errors.push(`referenced in cases.ts but missing on disk: ${file}`);
    }
    if (!provSet.has(file)) {
      errors.push(`referenced in cases.ts but missing from provenance.json: ${file}`);
    }
  }

  // (b) On disk ⇒ in provenance (no orphans).
  for (const file of disk) {
    if (!provSet.has(file)) {
      errors.push(`on disk but missing from provenance.json (orphan): ${file}`);
    }
  }

  // Bonus: provenance entries that point at nothing on disk.
  for (const file of prov.entries) {
    if (!diskSet.has(file)) {
      errors.push(`in provenance.json but missing on disk: ${file}`);
    }
  }

  console.log('Illustration integrity check');
  console.log(`  referenced in cases.ts : ${referenced.length}`);
  console.log(`  on disk (*.png)        : ${disk.length}`);
  console.log(`  provenance entries     : ${prov.entries.length}`);

  if (errors.length) {
    console.error(`\nFAIL — ${errors.length} issue(s):`);
    for (const e of errors) console.error(`  ✗ ${e}`);
    process.exit(1);
  }

  console.log('\nPASS — every illustration is on disk and traceable.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
