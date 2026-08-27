import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Section-scoped regression coverage for the Adoption section refresh
// (crewrig-website#28): `vendor/docs/adoption-guide.md` and
// `vendor/docs/layers.md`, routes `/docs/adoption-guide` and `/docs/layers`.
// Kept in its own file (never touching `tests/docs.spec.ts`) so this ticket's
// PR does not collide with the six other section-refresh PRs running in
// parallel.

const here = dirname(fileURLToPath(import.meta.url));

const pin = JSON.parse(
  readFileSync(join(here, '../docs-pin.json'), 'utf8'),
) as { repo: string; ref: string };
const BLOB_BASE = `https://github.com/${pin.repo}/blob/${pin.ref}`;

const ADOPTION_GUIDE = '/docs/adoption-guide';
const LAYERS = '/docs/layers';
const MIGRATION_HEADING_ID =
  'migrating-an-extension-off-the-retired-declaration-shape-spec-0183';

test.describe('Docs section — Adoption', () => {
  test('both Adoption pages return HTTP 200', async ({ page }) => {
    const adoptionRes = await page.goto(`.${ADOPTION_GUIDE}`);
    expect(adoptionRes?.status()).toBe(200);
    const layersRes = await page.goto(`.${LAYERS}`);
    expect(layersRes?.status()).toBe(200);
  });

  test('sidebar lists Adoption guide before Layer taxonomy (manifest nav_order)', async ({
    page,
  }) => {
    await page.goto('./docs');
    // Scope to the Adoption section's own <ul>, not the full sidebar, so
    // ordering among sibling sections cannot make this test pass by accident.
    const section = page
      .locator('aside nav h2', { hasText: 'Adoption' })
      .locator('xpath=following-sibling::ul[1]');
    const links = section.locator('a');
    await expect(links).toHaveCount(2);
    await expect(links.nth(0)).toHaveAttribute('href', ADOPTION_GUIDE);
    await expect(links.nth(1)).toHaveAttribute('href', LAYERS);
  });

  test('no visible metadata block on either page', async ({ page }) => {
    for (const route of [ADOPTION_GUIDE, LAYERS]) {
      await page.goto(`.${route}`);
      const content = await page.content();
      expect(content, `${route} leaked metadata`).not.toContain('crewrig-doc');
      expect(content, `${route} leaked metadata`).not.toContain(
        '<!-- crewrig-doc',
      );
    }
  });

  test('the new "Migrating an extension" section renders (spec 0183)', async ({
    page,
  }) => {
    await page.goto(`.${ADOPTION_GUIDE}`);
    const heading = page.locator(`article.doc-content #${MIGRATION_HEADING_ID}`);
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText(
      'Migrating an extension off the retired declaration shape (spec 0183)',
    );
  });

  test('adoption-guide.md: Kramdown explicit ids are honored, no literal "{#" leaks', async ({
    page,
  }) => {
    await page.goto(`.${ADOPTION_GUIDE}`);
    const headings = page.locator(
      'article.doc-content :is(h1,h2,h3,h4,h5,h6)',
    );
    const texts = await headings.allInnerTexts();
    for (const t of texts) {
      expect(t).not.toContain('{#');
    }
    // Both explicit Kramdown ids on this page are honored and their
    // in-page links do not dangle.
    await expect(
      page.locator('article.doc-content #dirty-core-refusal'),
    ).toHaveCount(1);
    await expect(
      page.locator('article.doc-content #release-workflow-inert-on-fork'),
    ).toHaveCount(1);
  });

  test('adoption-guide.md: in-page anchor links resolve to their explicit ids', async ({
    page,
  }) => {
    await page.goto(`.${ADOPTION_GUIDE}`);
    await expect(
      page.locator('article.doc-content a[href="#dirty-core-refusal"]'),
    ).toHaveCount(1);
    await expect(
      page.locator(
        'article.doc-content a[href="#release-workflow-inert-on-fork"]',
      ),
    ).toHaveCount(1);
  });

  test('adoption-guide.md: out-of-manifest link rewrites to an absolute upstream blob URL', async ({
    page,
  }) => {
    // `](../artifacts/FORMAT.md)` resolves outside the manifest (only
    // `docs/**` pages are published) so it must rewrite to the pinned
    // upstream blob URL rather than a bare relative path or a /docs route.
    await page.goto(`.${ADOPTION_GUIDE}`);
    const link = page.locator(
      `article.doc-content a[href="${BLOB_BASE}/artifacts/FORMAT.md"]`,
    );
    await expect(link).toHaveCount(1);
  });

  test('adoption-guide.md: in-manifest link rewrites to a /docs route (no 404)', async ({
    page,
  }) => {
    // `](extension-authoring.md)` is in-manifest (Authoring section).
    await page.goto(`.${ADOPTION_GUIDE}`);
    const link = page.locator(
      'article.doc-content a[href="/docs/extension-authoring"]',
    );
    await expect(link).toHaveCount(1);
    const res = await page.goto('./docs/extension-authoring');
    expect(res?.status()).toBe(200);
  });

  test('layers.md: pipe tables render as HTML tables', async ({ page }) => {
    await page.goto(`.${LAYERS}`);
    const tables = page.locator('article.doc-content table');
    // Layer definitions table + one table per governance/build/overlay
    // section + the config/ quick-reference table.
    await expect(tables.first()).toBeVisible();
    expect(await tables.count()).toBeGreaterThan(10);
  });

  test('layers.md: out-of-manifest link rewrites to an absolute upstream blob URL', async ({
    page,
  }) => {
    // `](../specs/0027-docs-ia-and-publication-contract.md)` is out of
    // manifest (specs/ is not published under /docs).
    await page.goto(`.${LAYERS}`);
    const link = page.locator(
      `article.doc-content a[href="${BLOB_BASE}/specs/0027-docs-ia-and-publication-contract.md"]`,
    );
    await expect(link).toHaveCount(1);
  });

  test('layers.md: in-manifest links rewrite to /docs routes (no 404)', async ({
    page,
  }) => {
    // `](spec-format.md)` and `](publication-contract.md)` are in-manifest.
    await page.goto(`.${LAYERS}`);
    await expect(
      page.locator('article.doc-content a[href="/docs/spec-format"]'),
    ).toHaveCount(1);
    await expect(
      page.locator('article.doc-content a[href="/docs/publication-contract"]'),
    ).toHaveCount(1);

    const specRes = await page.goto('./docs/spec-format');
    expect(specRes?.status()).toBe(200);
    const pubRes = await page.goto('./docs/publication-contract');
    expect(pubRes?.status()).toBe(200);
  });
});
