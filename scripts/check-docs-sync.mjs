#!/usr/bin/env node
/**
 * Bidirectional docs-vendor integrity gate. Network-free; runs in CI.
 *
 *   (a) Every manifest `path` has a vendored file under `vendor/docs/`.
 *   (b) Every vendored `*.md` file is listed in the manifest (no orphans).
 *
 * Exit 1 on any drift. This catches a stale or partial `node
 * scripts/sync-docs.mjs` run without needing the network — it only reads the
 * committed vendor tree and the vendored manifest.
 */

import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const VENDOR_DIR = join(ROOT, 'vendor/docs');
const MANIFEST_PATH = join(VENDOR_DIR, 'index.json');

/** All vendored `*.md` files, as docs/-relative POSIX paths (manifest form). */
async function vendoredMarkdown(dir) {
  const out = [];
  async function walk(d) {
    const entries = await readdir(d, { withFileTypes: true });
    for (const e of entries) {
      const full = join(d, e.name);
      if (e.isDirectory()) {
        await walk(full);
      } else if (e.name.toLowerCase().endsWith('.md')) {
        const rel = relative(VENDOR_DIR, full).split('\\').join('/');
        out.push(`docs/${rel}`);
      }
    }
  }
  await walk(dir);
  return out;
}

async function main() {
  if (!existsSync(MANIFEST_PATH)) {
    console.error(`FAIL — vendored manifest missing at ${MANIFEST_PATH}`);
    console.error('  run `npm run sync:docs` first.');
    process.exit(1);
  }

  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
  const manifestPaths = manifest.sections.flatMap((s) =>
    s.pages.map((p) => p.path),
  );
  const vendored = await vendoredMarkdown(VENDOR_DIR);

  const manifestSet = new Set(manifestPaths);
  const vendoredSet = new Set(vendored);
  const errors = [];

  // (a) manifest path -> vendored file.
  for (const path of manifestPaths) {
    const rel = path.slice('docs/'.length);
    if (!existsSync(join(VENDOR_DIR, rel))) {
      errors.push(`manifest path not vendored: ${path}`);
    }
  }

  // (b) vendored file -> manifest entry (no orphans).
  for (const path of vendored) {
    if (!manifestSet.has(path)) {
      errors.push(`vendored file absent from manifest (orphan): ${path}`);
    }
  }

  console.log('Docs sync integrity check');
  console.log(`  manifest pages   : ${manifestSet.size}`);
  console.log(`  vendored *.md    : ${vendoredSet.size}`);

  if (errors.length) {
    console.error(`\nFAIL — ${errors.length} drift issue(s):`);
    for (const e of errors) console.error(`  x ${e}`);
    console.error('\n  run `npm run sync:docs` to re-vendor at the pinned ref.');
    process.exit(1);
  }

  console.log('\nPASS — vendored docs match the manifest in both directions.');
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
