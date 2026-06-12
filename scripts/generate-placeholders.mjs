#!/usr/bin/env node
/**
 * One-off placeholder generator — runs until real Vertex generation is wired
 * (scripts/generate-illustrations.mjs). Produces five solid dark PNGs with the
 * case title in violet, plus a provenance.json marking each as a placeholder,
 * so the bidirectional integrity check stays green pre-Vertex.
 *
 * Idempotent: re-running overwrites the PNGs and rewrites provenance.json.
 * Real generation later overwrites both the PNG and the provenance entry.
 *
 * Run:  node scripts/generate-placeholders.mjs
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import { cases } from '../src/data/cases.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ILLUSTRATIONS_DIR = join(ROOT, 'src/assets/illustrations');
const PROVENANCE_PATH = join(ILLUSTRATIONS_DIR, 'provenance.json');

const WIDTH = 1200;
const HEIGHT = 800;
const BG = '#0d0d14';
const ACCENT = '#7c3aed';
const DATE = '2026-06-12';

function escapeXml(s) {
  return s.replace(/[<>&'"]/g, (ch) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[ch]),
  );
}

/** Naive word-wrap so long titles fit the frame. */
function wrap(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxChars && line) {
      lines.push(line.trim());
      line = w;
    } else {
      line = (line + ' ' + w).trim();
    }
  }
  if (line) lines.push(line.trim());
  return lines;
}

function svgFor(c) {
  const lines = wrap(c.title, 26);
  const lineHeight = 64;
  const startY = HEIGHT / 2 - ((lines.length - 1) * lineHeight) / 2;
  const tspans = lines
    .map(
      (l, i) =>
        `<tspan x="50%" y="${startY + i * lineHeight}">${escapeXml(l)}</tspan>`,
    )
    .join('');
  return `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${BG}"/>
  <rect x="2" y="2" width="${WIDTH - 4}" height="${HEIGHT - 4}" fill="none" stroke="${ACCENT}" stroke-opacity="0.35" stroke-width="2" rx="16"/>
  <text x="50%" y="140" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="22" letter-spacing="3" fill="${ACCENT}" fill-opacity="0.8">${escapeXml(c.pillar.toUpperCase())}</text>
  <text text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="48" font-weight="700" fill="${ACCENT}">${tspans}</text>
  <text x="50%" y="${HEIGHT - 90}" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="20" fill="#9090a8">${escapeXml(c.persona.name)} — ${escapeXml(c.persona.role)}</text>
  <text x="50%" y="${HEIGHT - 50}" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="16" letter-spacing="2" fill="#9090a8" fill-opacity="0.7">PLACEHOLDER</text>
</svg>`;
}

async function main() {
  await mkdir(ILLUSTRATIONS_DIR, { recursive: true });
  const provenance = { illustrations: [] };

  for (const c of cases) {
    const out = join(ILLUSTRATIONS_DIR, c.illustration.file);
    await sharp(Buffer.from(svgFor(c))).png().toFile(out);
    console.log(`wrote ${out}`);
    provenance.illustrations.push({
      file: c.illustration.file,
      prompt: c.illustration.prompt,
      model: 'PLACEHOLDER — pending gemini-3.1-flash-image-preview',
      date: DATE,
      placeholder: true,
    });
  }

  provenance.illustrations.sort((a, b) => a.file.localeCompare(b.file));
  await writeFile(PROVENANCE_PATH, JSON.stringify(provenance, null, 2) + '\n');
  console.log(`wrote ${PROVENANCE_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
