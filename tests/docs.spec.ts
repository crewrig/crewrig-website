import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Published section titles, in the vendored manifest's order. Derived from the
// pinned snapshot (not hard-coded) so the assertion stays correct across
// docs-pin.json bumps as upstream sections gain pages.
const manifest = JSON.parse(
  readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '../vendor/docs/index.json'),
    'utf8',
  ),
) as { sections: { title: string }[] };
const SECTIONS_IN_ORDER = manifest.sections.map((s) => s.title);

// A sample page that is NOT the publication-contract page: that page
// legitimately documents the `crewrig-doc:` grammar in prose, so it is the
// one page where the literal string appears by design.
const SAMPLE_DOC = '/docs/adr/0010-spec-plan-review-lifecycle';

test.describe('Docs section', () => {
  test('/docs returns HTTP 200', async ({ page }) => {
    const res = await page.goto('./docs');
    expect(res?.status()).toBe(200);
  });

  test('sidebar lists the published sections in fixed manifest order', async ({
    page,
  }) => {
    await page.goto('./docs');
    const headings = page.locator('aside nav h2');
    await expect(headings).toHaveCount(SECTIONS_IN_ORDER.length);
    for (let i = 0; i < SECTIONS_IN_ORDER.length; i++) {
      await expect(headings.nth(i)).toHaveText(SECTIONS_IN_ORDER[i]);
    }
  });

  test('a sample doc page renders with no metadata block visible', async ({
    page,
  }) => {
    const res = await page.goto(`.${SAMPLE_DOC}`);
    expect(res?.status()).toBe(200);
    // F4: the page heading renders, but no `crewrig-doc` text reaches output.
    const article = page.locator('article.doc-content');
    await expect(article.locator('h1')).toBeVisible();
    const content = await page.content();
    expect(content).not.toContain('crewrig-doc');
    expect(content).not.toContain('<!-- crewrig-doc');
  });

  test('an in-manifest inter-doc link resolves to a /docs route (no 404)', async ({
    page,
  }) => {
    // retroactive-loop.md links to other manifest pages via relative paths
    // (`](adr/0010-...md)`, `](spec-format.md)`) — these must rewrite to
    // /docs routes, not 404.
    await page.goto('./docs/retroactive-loop');
    // Pick any in-content link that points at another /docs page.
    const docLink = page
      .locator('article.doc-content a[href^="/docs/"]')
      .first();
    await expect(docLink).toBeVisible();
    const href = await docLink.getAttribute('href');
    expect(href).toMatch(/^\/docs\//);
    const res = await page.goto(href!);
    expect(res?.status()).toBe(200);
  });

  test('no relative non-.md link survives un-rewritten on a sampled page (F1)', async ({
    page,
  }) => {
    // ADR 0005 carries `](../../../../issues/80)` — a relative, non-.md link
    // that must be rewritten to an absolute upstream URL.
    await page.goto('./docs/adr/0005-e2e-pillar-scenarios');
    const hrefs = await page
      .locator('article.doc-content a')
      .evaluateAll((els) => els.map((e) => e.getAttribute('href') ?? ''));
    for (const href of hrefs) {
      // Every content link is absolute (http/https/mailto), a /docs route,
      // or a pure in-page anchor — never a bare relative path.
      const ok =
        /^[a-z][a-z0-9+.-]*:/i.test(href) ||
        href.startsWith('/') ||
        href.startsWith('#');
      expect(ok, `un-rewritten relative link: ${href}`).toBe(true);
    }
    // And specifically the issues/80 link became an absolute github.com URL.
    const issuesLink = page.locator(
      'article.doc-content a[href*="github.com"][href*="issues/80"]',
    );
    await expect(issuesLink.first()).toHaveCount(1);
    // It must be the repo WEB route, not a broken blob/<ref>/issues/80 URL:
    // a path that over-escapes the repo root is a web route, not a file.
    const href = await issuesLink.first().getAttribute('href');
    expect(href).toBe('https://github.com/crewrig/crewrig/issues/80');
  });

  test('no visible "{#" in heading text (F2)', async ({ page }) => {
    // adoption-guide uses Kramdown `{#dirty-core-refusal}` heading anchors.
    await page.goto('./docs/adoption-guide');
    const headings = page.locator('article.doc-content :is(h1,h2,h3,h4,h5,h6)');
    const texts = await headings.allInnerTexts();
    for (const t of texts) {
      expect(t).not.toContain('{#');
    }
    // The explicit id is honored and its in-page link does not dangle.
    await expect(
      page.locator('article.doc-content #dirty-core-refusal'),
    ).toHaveCount(1);
  });

  test('the header Docs link is present on / and on a doc page', async ({
    page,
  }) => {
    await page.goto('./');
    await expect(
      page.locator('header a[href="/docs"]', { hasText: /Docs/i }),
    ).toBeVisible();

    await page.goto(`.${SAMPLE_DOC}`);
    await expect(
      page.locator('header a[href="/docs"]', { hasText: /Docs/i }),
    ).toBeVisible();
  });
});
