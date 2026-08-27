import { test, expect } from '@playwright/test';

// Section refresh for "Authoring" (issue #29): the section grows from one
// page to three — `authoring`, plus two NEW pages, `extension-authoring` and
// `extension-mcp-servers`, first rendered by this site at pin `a14cefd`.
// New file per the parallel-PR convention: `tests/docs.spec.ts` stays
// untouched while sibling section PRs run against it concurrently.

const SECTION_TITLE = 'Authoring';
const PAGES_IN_NAV_ORDER = [
  { slug: 'authoring', title: 'Authoring skills, agents & commands' },
  { slug: 'extension-authoring', title: 'Extension authoring' },
  { slug: 'extension-mcp-servers', title: 'Extension MCP servers' },
];

test.describe('Docs section: Authoring', () => {
  for (const { slug } of PAGES_IN_NAV_ORDER) {
    test(`/docs/${slug} returns HTTP 200`, async ({ page }) => {
      const res = await page.goto(`./docs/${slug}`);
      expect(res?.status()).toBe(200);
    });
  }

  test('sidebar lists the Authoring section pages in nav order', async ({
    page,
  }) => {
    await page.goto('./docs/authoring');
    const section = page
      .locator('aside nav > div')
      .filter({ has: page.getByRole('heading', { name: SECTION_TITLE, exact: true }) });
    const links = section.locator('ul a');
    await expect(links).toHaveCount(PAGES_IN_NAV_ORDER.length);
    for (let i = 0; i < PAGES_IN_NAV_ORDER.length; i++) {
      await expect(links.nth(i)).toHaveAttribute(
        'href',
        `/docs/${PAGES_IN_NAV_ORDER[i].slug}`,
      );
      await expect(links.nth(i)).toHaveText(PAGES_IN_NAV_ORDER[i].title);
    }
  });

  test('no visible metadata block on any of the three pages', async ({
    page,
  }) => {
    for (const { slug } of PAGES_IN_NAV_ORDER) {
      await page.goto(`./docs/${slug}`);
      const content = await page.content();
      expect(content, `${slug} leaked metadata`).not.toContain('crewrig-doc');
    }
  });

  test('in-manifest cross-link between the two new pages resolves to a /docs route', async ({
    page,
  }) => {
    // extension-authoring.md links to extension-mcp-servers.md twice (the
    // mcpServers table row and the "Where each detail lives" list); both must
    // rewrite in-manifest to a /docs route, never a raw .md path.
    await page.goto('./docs/extension-authoring');
    const crossLink = page.locator(
      'article.doc-content a[href="/docs/extension-mcp-servers"]',
    );
    await expect(crossLink.first()).toBeVisible();
    const res = await page.goto('/docs/extension-mcp-servers');
    expect(res?.status()).toBe(200);

    // And the reverse direction: extension-mcp-servers.md's opening paragraph
    // links back to extension-authoring.md.
    await page.goto('./docs/extension-mcp-servers');
    await expect(
      page.locator('article.doc-content a[href="/docs/extension-authoring"]').first(),
    ).toBeVisible();
  });

  test('out-of-manifest links never survive as a bare relative path (no network)', async ({
    page,
  }) => {
    // extension-mcp-servers.md links to the two unpublished runbooks
    // (extension-mcp-token-probe) and to extension-skeleton/EXTENSION-FORMAT.md
    // — none of these are in the manifest, so they must rewrite to an absolute
    // upstream blob URL, never a bare relative .md path. Assert on link *form*
    // only; no network calls against github.com in this test.
    await page.goto('./docs/extension-mcp-servers');
    const hrefs = await page
      .locator('article.doc-content a')
      .evaluateAll((els) => els.map((e) => e.getAttribute('href') ?? ''));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      const ok =
        /^[a-z][a-z0-9+.-]*:/i.test(href) ||
        href.startsWith('/') ||
        href.startsWith('#');
      expect(ok, `un-rewritten relative link: ${href}`).toBe(true);
    }
    // Specifically: the unpublished runbook link resolved to an absolute
    // upstream blob URL, not a /docs route (it is not in the manifest).
    const runbookLink = page.locator(
      'article.doc-content a[href*="github.com"][href*="runbooks/extension-mcp-token-probe.md"]',
    );
    await expect(runbookLink.first()).toHaveCount(1);
  });
});
