import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Section-scoped regression coverage for the Harness engineering section
// refresh (crewrig-website#31): `vendor/docs/harness-engineering.md`, route
// `/docs/harness-engineering`. This section is a single page with no
// upstream file-level delta since the June pin — the ticket was a currency
// audit, not a rendering diff — so this file locks in the rendering
// contract the audit confirmed still holds. Kept in its own file (never
// touching `tests/docs.spec.ts`) so this ticket's PR does not collide with
// the other section-refresh PRs running in parallel.

const here = dirname(fileURLToPath(import.meta.url));

const pin = JSON.parse(
  readFileSync(join(here, '../docs-pin.json'), 'utf8'),
) as { repo: string; ref: string };
const BLOB_BASE = `https://github.com/${pin.repo}/blob/${pin.ref}`;

const HARNESS_ENGINEERING = '/docs/harness-engineering';

test.describe('Docs section — Harness engineering', () => {
  test('the page returns HTTP 200', async ({ page }) => {
    const res = await page.goto(`.${HARNESS_ENGINEERING}`);
    expect(res?.status()).toBe(200);
  });

  test('sidebar lists the Harness engineering section with its one page', async ({
    page,
  }) => {
    await page.goto('./docs');
    // Scope to the section's own <ul>, not the full sidebar, so ordering
    // among sibling sections cannot make this test pass by accident.
    const section = page
      .locator('aside nav h2', { hasText: 'Harness engineering' })
      .locator('xpath=following-sibling::ul[1]');
    const links = section.locator('a');
    await expect(links).toHaveCount(1);
    await expect(links.nth(0)).toHaveAttribute('href', HARNESS_ENGINEERING);
    await expect(links.nth(0)).toHaveText('Harness engineering');
  });

  test('no visible metadata block on the page', async ({ page }) => {
    await page.goto(`.${HARNESS_ENGINEERING}`);
    const content = await page.content();
    expect(content).not.toContain('crewrig-doc');
    expect(content).not.toContain('<!-- crewrig-doc');
  });

  test('the four-stage loop renders as distinctive content', async ({
    page,
  }) => {
    await page.goto(`.${HARNESS_ENGINEERING}`);
    const heading = page.locator('article.doc-content #the-loop');
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText('The loop');

    const items = page.locator('article.doc-content ol li');
    const texts = await items.allInnerTexts();
    for (const stage of ['Tag', 'Cluster', 'Fix', 'Re-install']) {
      expect(texts.some((t) => t.startsWith(stage))).toBe(true);
    }
  });

  test('in-manifest link rewrites to a /docs route (no 404)', async ({
    page,
  }) => {
    // `](layers.md)` under "Where to read next" is in-manifest
    // (Architecture & ADRs section).
    await page.goto(`.${HARNESS_ENGINEERING}`);
    const link = page.locator('article.doc-content a[href="/docs/layers"]');
    await expect(link).toHaveCount(1);
    const res = await page.goto('/docs/layers');
    expect(res?.status()).toBe(200);
  });

  test('out-of-manifest links rewrite to absolute upstream blob URLs', async ({
    page,
  }) => {
    // The two skill links (`harness-report`/`harness-curator` SKILL.md) sit
    // outside `docs/**`, so they must rewrite to the pinned upstream blob
    // URL rather than a bare relative path or a /docs route. No network:
    // this asserts the rewritten href only.
    await page.goto(`.${HARNESS_ENGINEERING}`);
    await expect(
      page.locator(
        `article.doc-content a[href="${BLOB_BASE}/artifacts/library/skills/harness-report/SKILL.md"]`,
      ),
    ).toHaveCount(1);
    await expect(
      page.locator(
        `article.doc-content a[href="${BLOB_BASE}/artifacts/library/skills/harness-curator/SKILL.md"]`,
      ),
    ).toHaveCount(1);
  });
});
