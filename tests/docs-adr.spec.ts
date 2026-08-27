import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * Regression coverage for the Architecture & ADRs section refresh
 * (crewrig-website#33): the section grows from 13 to 18 entries — five new
 * ADRs (0012–0016) and three modified ones (0001, 0006, 0010) — driven
 * entirely by the vendored manifest (`vendor/docs/index.json`), not by any
 * hard-coded page list here.
 *
 * NOTE on image handling: the ticket's original scope item assumed ADR 0016
 * references images under `docs/assets/mempalace-mcp/`. Verified (both in
 * the vendored snapshot and upstream at the pinned ref) that this is not the
 * case — those images are referenced only by `README.md` and
 * `docs/runbooks/mempalace-mcp-server.md`, neither of which is vendored or
 * published on this site in any section. See the plan comment on issue #33
 * for the full evidence trail. The image test below therefore asserts the
 * *invariant* (render-doc.ts's F3 rule: any in-content `<img>` must already
 * carry the upstream raw-URL form, never a bare relative path) rather than
 * asserting a specific image exists — it still fails if a future docs sync
 * adds an un-rewritten image to any ADR page.
 */

const manifest = JSON.parse(
  readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '../vendor/docs/index.json'),
    'utf8',
  ),
) as {
  sections: {
    section: string;
    title: string;
    pages: { title: string; path: string; nav_order: number }[];
  }[];
};

const ADR_SECTION = manifest.sections.find((s) => s.section === 'architecture-adr')!;
const ADR_PAGES = [...ADR_SECTION.pages].sort((a, b) => a.nav_order - b.nav_order);
const pathToSlug = (path: string) => path.replace(/^docs\//, '').replace(/\.md$/, '');

const NEW_ADR_SLUGS = [
  'adr/0012-ci-reference-contract',
  'adr/0013-user-space-system-context-store',
  'adr/0014-ci-test-wiring-guard',
  'adr/0015-forge-access-cli-only',
  'adr/0016-shared-mempalace-mcp-http-server',
];

const MODIFIED_ADR_SLUGS = [
  'adr/0001-copilot-cli-integration-strategy',
  'adr/0006-chromadb-http-server',
  'adr/0010-spec-plan-review-lifecycle',
];

test.describe('Architecture & ADRs section', () => {
  for (const slug of NEW_ADR_SLUGS) {
    test(`new ADR route /docs/${slug} returns HTTP 200`, async ({ page }) => {
      const res = await page.goto(`./docs/${slug}`);
      expect(res?.status()).toBe(200);
      await expect(page.locator('article.doc-content h1')).toBeVisible();
    });
  }

  test('sidebar lists all 18 ADR entries in manifest nav order, both ADR-0001 titles distinct', async ({
    page,
  }) => {
    await page.goto('./docs/adr/0016-shared-mempalace-mcp-http-server');

    const section = page
      .locator('aside nav > div')
      .filter({ has: page.getByRole('heading', { level: 2, name: ADR_SECTION.title }) });
    const links = section.locator('ul > li > a');

    await expect(links).toHaveCount(ADR_PAGES.length);
    expect(ADR_PAGES.length).toBe(18);

    for (let i = 0; i < ADR_PAGES.length; i++) {
      const page_ = ADR_PAGES[i];
      await expect(links.nth(i)).toHaveText(page_.title);
      await expect(links.nth(i)).toHaveAttribute('href', `/docs/${pathToSlug(page_.path)}`);
    }

    // Both ADR-0001 entries are present and carry distinguishable titles.
    const adr0001Titles = ADR_PAGES.filter((p) => p.path.includes('/0001-')).map(
      (p) => p.title,
    );
    expect(adr0001Titles).toHaveLength(2);
    expect(adr0001Titles[0]).not.toBe(adr0001Titles[1]);
    for (const title of adr0001Titles) {
      await expect(section.locator('a', { hasText: title })).toHaveCount(1);
    }
  });

  test('no un-rewritten relative image src leaks in ADR content (F3 invariant)', async ({
    page,
  }) => {
    // See the module doc comment: no ADR page currently carries a content
    // image, so this asserts the render-doc.ts F3 rewrite invariant rather
    // than a specific image's presence — any <img> that does show up inside
    // article.doc-content on an ADR page must already be an absolute
    // raw.githubusercontent.com URL at the pinned ref, never a relative path.
    for (const slug of [...NEW_ADR_SLUGS, ...MODIFIED_ADR_SLUGS]) {
      await page.goto(`./docs/${slug}`);
      const imgs = page.locator('article.doc-content img');
      const count = await imgs.count();
      for (let i = 0; i < count; i++) {
        const src = await imgs.nth(i).getAttribute('src');
        expect(src, `un-rewritten image src on ${slug}`).toMatch(
          /^https:\/\/raw\.githubusercontent\.com\//,
        );
      }
    }
  });

  test('no "crewrig-doc" metadata leak on the new and modified ADR pages', async ({
    page,
  }) => {
    for (const slug of [...NEW_ADR_SLUGS, ...MODIFIED_ADR_SLUGS]) {
      await page.goto(`./docs/${slug}`);
      const content = await page.content();
      expect(content, `metadata leak on ${slug}`).not.toContain('crewrig-doc');
    }
  });

  test('ADR 0006 -> ADR 0016 in-manifest cross-reference resolves to a /docs route', async ({
    page,
  }) => {
    await page.goto('./docs/adr/0006-chromadb-http-server');
    const crossRef = page.locator(
      'article.doc-content a[href="/docs/adr/0016-shared-mempalace-mcp-http-server"]',
    );
    await expect(crossRef.first()).toBeVisible();
    const res = await page.goto('./docs/adr/0016-shared-mempalace-mcp-http-server');
    expect(res?.status()).toBe(200);
  });
});
