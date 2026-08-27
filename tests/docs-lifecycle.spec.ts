import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Section-scoped regression coverage for the Lifecycle section refresh
// (crewrig-website#30): `vendor/docs/retroactive-loop.md` (reworked: REVIEW
// launch trigger, deferred-findings ledger, 4th termination condition) and
// the NEW `vendor/docs/reviewer-seat.md`, routes `/docs/retroactive-loop`
// and `/docs/reviewer-seat`.
// Kept in its own file (never touching `tests/docs.spec.ts`) so this
// ticket's PR does not collide with the other section-refresh PRs running
// in parallel.

const here = dirname(fileURLToPath(import.meta.url));

const pin = JSON.parse(
  readFileSync(join(here, '../docs-pin.json'), 'utf8'),
) as { repo: string; ref: string };
const BLOB_BASE = `https://github.com/${pin.repo}/blob/${pin.ref}`;

const RETROACTIVE_LOOP = '/docs/retroactive-loop';
const REVIEWER_SEAT = '/docs/reviewer-seat';

test.describe('Docs section — Lifecycle', () => {
  test('both Lifecycle pages return HTTP 200', async ({ page }) => {
    const loopRes = await page.goto(`.${RETROACTIVE_LOOP}`);
    expect(loopRes?.status()).toBe(200);
    const seatRes = await page.goto(`.${REVIEWER_SEAT}`);
    expect(seatRes?.status()).toBe(200);
  });

  test('sidebar lists Retroactive review loop before Reviewer seat (manifest nav_order)', async ({
    page,
  }) => {
    await page.goto('./docs');
    // Scope to the Lifecycle section's own <ul>, not the full sidebar, so
    // ordering among sibling sections cannot make this test pass by
    // accident.
    const section = page
      .locator('aside nav h2', { hasText: 'Lifecycle' })
      .locator('xpath=following-sibling::ul[1]');
    const links = section.locator('a');
    await expect(links).toHaveCount(2);
    await expect(links.nth(0)).toHaveAttribute('href', RETROACTIVE_LOOP);
    await expect(links.nth(1)).toHaveAttribute('href', REVIEWER_SEAT);
  });

  test('no visible metadata block on either page', async ({ page }) => {
    for (const route of [RETROACTIVE_LOOP, REVIEWER_SEAT]) {
      await page.goto(`.${route}`);
      const content = await page.content();
      expect(content, `${route} leaked metadata`).not.toContain('crewrig-doc');
      expect(content, `${route} leaked metadata`).not.toContain(
        '<!-- crewrig-doc',
      );
    }
  });

  test('retroactive-loop.md: the reworked "Deferred-findings ledger" section renders', async ({
    page,
  }) => {
    await page.goto(`.${RETROACTIVE_LOOP}`);
    const heading = page.locator(
      'article.doc-content #deferred-findings-ledger',
    );
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText('Deferred-findings ledger');
  });

  test('retroactive-loop.md: heading text carries no literal "{#" and every heading has an id', async ({
    page,
  }) => {
    await page.goto(`.${RETROACTIVE_LOOP}`);
    const headings = page.locator(
      'article.doc-content :is(h1,h2,h3,h4,h5,h6)',
    );
    // h1 + 15 section headings.
    await expect(headings).toHaveCount(16);
    const texts = await headings.allInnerTexts();
    for (const t of texts) {
      expect(t).not.toContain('{#');
    }
    const ids = await headings.evaluateAll((els) =>
      els.map((e) => e.id),
    );
    for (const id of ids) {
      expect(id.length).toBeGreaterThan(0);
    }
  });

  test('retroactive-loop.md: in-manifest link to the new reviewer-seat.md rewrites to a /docs route (no 404)', async ({
    page,
  }) => {
    // `](reviewer-seat.md)` — now in-manifest since this same ticket
    // publishes the page. Linked six times across the page.
    await page.goto(`.${RETROACTIVE_LOOP}`);
    const link = page.locator(
      `article.doc-content a[href="${REVIEWER_SEAT}"]`,
    );
    await expect(link).toHaveCount(6);
    await expect(link.first()).toBeVisible();
    const res = await page.goto(REVIEWER_SEAT);
    expect(res?.status()).toBe(200);
  });

  test('retroactive-loop.md: out-of-manifest links rewrite to absolute upstream blob URLs', async ({
    page,
  }) => {
    await page.goto(`.${RETROACTIVE_LOOP}`);
    // `](plan-review-protocol.md)` — docs/plan-review-protocol.md is not a
    // published page.
    await expect(
      page.locator(
        `article.doc-content a[href="${BLOB_BASE}/docs/plan-review-protocol.md"]`,
      ),
    ).toHaveCount(1);
    // `](../specs/0005-retroactive-routing-engine.md)` — resolves to
    // specs/0005-retroactive-routing-engine.md, outside the docs/ tree.
    // Linked twice in the page (intro paragraph + Cross-references).
    await expect(
      page.locator(
        `article.doc-content a[href="${BLOB_BASE}/specs/0005-retroactive-routing-engine.md"]`,
      ),
    ).toHaveCount(2);
  });

  test('retroactive-loop.md: pipe tables render as HTML tables', async ({
    page,
  }) => {
    await page.goto(`.${RETROACTIVE_LOOP}`);
    const tables = page.locator('article.doc-content table');
    // Finding classes/routing, spawn-sequence-by-mode, routing matrix,
    // non-blocking-conditional-routing.
    await expect(tables.first()).toBeVisible();
    await expect(tables).toHaveCount(4);
  });

  test('reviewer-seat.md: the distinctive "Vacant seat" section renders', async ({
    page,
  }) => {
    await page.goto(`.${REVIEWER_SEAT}`);
    const heading = page.locator('article.doc-content #vacant-seat');
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText('Vacant seat');
  });

  test('reviewer-seat.md: heading text carries no literal "{#" and every heading has an id', async ({
    page,
  }) => {
    await page.goto(`.${REVIEWER_SEAT}`);
    const headings = page.locator(
      'article.doc-content :is(h1,h2,h3,h4,h5,h6)',
    );
    // h1 + 15 h2 sections + 3 nested h3 subsections.
    await expect(headings).toHaveCount(19);
    const texts = await headings.allInnerTexts();
    for (const t of texts) {
      expect(t).not.toContain('{#');
    }
    const ids = await headings.evaluateAll((els) =>
      els.map((e) => e.id),
    );
    for (const id of ids) {
      expect(id.length).toBeGreaterThan(0);
    }
  });

  test('reviewer-seat.md: in-manifest link rewrites to a /docs route (no 404)', async ({
    page,
  }) => {
    // `](plan-format.md)` is in-manifest (Reference section). Linked three
    // times in the page ("The seat line, and where it goes", "Prior-finding
    // disposition", and Cross-references).
    await page.goto(`.${REVIEWER_SEAT}`);
    await expect(
      page.locator('article.doc-content a[href="/docs/plan-format"]'),
    ).toHaveCount(3);
    const res = await page.goto('./docs/plan-format');
    expect(res?.status()).toBe(200);
  });

  test('reviewer-seat.md: out-of-manifest links rewrite to absolute upstream blob URLs', async ({
    page,
  }) => {
    await page.goto(`.${REVIEWER_SEAT}`);
    // `](../artifacts/core/skills/pr-reviewer/SKILL.md)` — escapes docs/ to
    // artifacts/, not a published page. Linked three times in the page
    // (twice in "The seat line, and where it goes" verdict-transport list,
    // plus once in Cross-references).
    await expect(
      page.locator(
        `article.doc-content a[href="${BLOB_BASE}/artifacts/core/skills/pr-reviewer/SKILL.md"]`,
      ),
    ).toHaveCount(3);
    // `](interaction-modes.md)` — docs/interaction-modes.md is not a
    // published page.
    await expect(
      page.locator(
        `article.doc-content a[href="${BLOB_BASE}/docs/interaction-modes.md"]`,
      ),
    ).toHaveCount(1);
  });

  test('reviewer-seat.md: pipe tables render as HTML tables', async ({
    page,
  }) => {
    await page.goto(`.${REVIEWER_SEAT}`);
    const tables = page.locator('article.doc-content table');
    // Seat identity + finding identifiers.
    await expect(tables.first()).toBeVisible();
    await expect(tables).toHaveCount(2);
  });
});
