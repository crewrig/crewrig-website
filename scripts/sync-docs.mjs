#!/usr/bin/env node
/**
 * Vendor the framework's published docs into the site repo (manual-only).
 *
 * NEVER wired into `npm run build` — the build stays offline and
 * deterministic (mirrors `generate-illustrations.mjs` isolation). This is
 * the only script that touches the network, and only when run by hand.
 *
 * Reads `docs-pin.json` for the pinned framework `repo` + `ref` (a merged
 * crewrig/main SHA, never a branch), fetches `docs/index.json` from the raw
 * GitHub host at that ref, then fetches each manifest page `path` and writes
 * it under `vendor/docs/<path>` (the `docs/`-relative path is preserved).
 * Finally stamps `docs-pin.json.fetched_at`.
 *
 * The framework repo is public — no auth token required.
 *
 *   node scripts/sync-docs.mjs
 */

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PIN_PATH = join(ROOT, 'docs-pin.json');
const VENDOR_DIR = join(ROOT, 'vendor/docs');
const MANIFEST_PATH = 'docs/index.json';

function rawUrl(repo, ref, path) {
  return `https://raw.githubusercontent.com/${repo}/${ref}/${path}`;
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`fetch failed (${res.status} ${res.statusText}): ${url}`);
  }
  return res.text();
}

async function main() {
  const pin = JSON.parse(await readFile(PIN_PATH, 'utf8'));
  const { repo, ref } = pin;
  if (!repo || !ref) {
    throw new Error('docs-pin.json must declare both "repo" and "ref"');
  }
  // Guard: ref must look like a commit SHA, not a moving branch name.
  if (!/^[0-9a-f]{7,40}$/.test(ref)) {
    throw new Error(
      `docs-pin.json "ref" must be a commit SHA (got "${ref}"); a branch ref ` +
        'would let the pinned content drift.',
    );
  }

  console.log(`Syncing docs from ${repo}@${ref}`);

  const manifestUrl = rawUrl(repo, ref, MANIFEST_PATH);
  const manifestRaw = await fetchText(manifestUrl);
  const manifest = JSON.parse(manifestRaw);

  const pages = manifest.sections.flatMap((s) => s.pages.map((p) => p.path));
  console.log(`  manifest lists ${pages.length} published page(s)`);

  // Start from a clean vendor tree so a removed-upstream page does not linger.
  await rm(VENDOR_DIR, { recursive: true, force: true });
  await mkdir(VENDOR_DIR, { recursive: true });

  // Vendor the manifest itself under vendor/docs/index.json.
  await writeFile(join(VENDOR_DIR, 'index.json'), manifestRaw, 'utf8');

  for (const path of pages) {
    if (!path.startsWith('docs/')) {
      throw new Error(`manifest path is not docs/-relative: ${path}`);
    }
    const body = await fetchText(rawUrl(repo, ref, path));
    // Preserve the docs/-relative layout: docs/adr/x.md -> vendor/docs/adr/x.md
    const rel = path.slice('docs/'.length);
    const dest = join(VENDOR_DIR, rel);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, body, 'utf8');
    console.log(`  vendored ${path}`);
  }

  pin.fetched_at = new Date().toISOString();
  await writeFile(PIN_PATH, JSON.stringify(pin, null, 2) + '\n', 'utf8');

  console.log(`\nDone. Vendored ${pages.length} page(s) + the manifest.`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
