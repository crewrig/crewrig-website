import { test, expect } from '@playwright/test';

// Section-specific coverage for the Concepts page (crewrig-website#27).
// Complements the generic assertions in tests/docs.spec.ts, which already
// cover metadata-stripping, link-rewriting, and sidebar-ordering mechanics
// on other sample pages — this file targets /docs/concepts content directly.

const PAGE = '/docs/concepts';

test.describe('Docs: Concepts page', () => {
  test('/docs/concepts returns HTTP 200', async ({ page }) => {
    const res = await page.goto(`.${PAGE}`);
    expect(res?.status()).toBe(200);
  });

  test('sidebar lists a "Concepts" section with a "Core concepts" entry', async ({
    page,
  }) => {
    await page.goto(`.${PAGE}`);
    const section = page.locator('aside nav h2', { hasText: 'Concepts' });
    await expect(section).toBeVisible();
    const entry = page.locator('aside nav a', { hasText: 'Core concepts' });
    await expect(entry).toBeVisible();
    await expect(entry).toHaveAttribute('aria-current', 'page');
  });

  test('the four-CLI wording from crewrig#1068 is present', async ({ page }) => {
    await page.goto(`.${PAGE}`);
    const article = page.locator('article.doc-content');
    await expect(article).toContainText('The four supported tools consume');
  });

  test('no metadata block visible on the page', async ({ page }) => {
    await page.goto(`.${PAGE}`);
    const article = page.locator('article.doc-content');
    await expect(article.locator('h1')).toHaveText('Core concepts');
    const content = await page.content();
    expect(content).not.toContain('crewrig-doc');
    expect(content).not.toContain('<!-- crewrig-doc');
  });

  test('an in-manifest link (CLI support matrix) rewrites to a /docs route', async ({
    page,
  }) => {
    // concepts.md links `[CLI support matrix](cli-matrix.md)` twice (layered
    // context + multi-CLI parity sections) — both in-manifest. The href form
    // only is asserted here (no live navigation or network call), per the
    // audit note in issue #27.
    await page.goto(`.${PAGE}`);
    const link = page
      .locator('article.doc-content a', { hasText: 'CLI support matrix' })
      .first();
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    expect(href).toBe('/docs/cli-matrix');
  });
});
