import { test, expect } from '@playwright/test';

// Coverage for the Introduction docs section (issue #26), added after the
// docs-pin bump to a14cefd (#35) pulled in the upstream four-CLI fix
// (crewrig/crewrig#1068). New file — does not touch tests/docs.spec.ts,
// which other section-refresh PRs are editing in parallel.

test.describe('Docs section: Introduction', () => {
  test('/docs/introduction returns HTTP 200', async ({ page }) => {
    const res = await page.goto('./docs/introduction');
    expect(res?.status()).toBe(200);
  });

  test('the sidebar lists an Introduction section with an Introduction page link', async ({
    page,
  }) => {
    await page.goto('./docs/introduction');
    const sectionHeading = page.locator('aside nav h2', {
      hasText: 'Introduction',
    });
    await expect(sectionHeading).toHaveCount(1);

    const pageLink = page.locator('aside nav a[href="/docs/introduction"]', {
      hasText: 'Introduction',
    });
    await expect(pageLink).toHaveCount(1);
    await expect(pageLink).toHaveAttribute('aria-current', 'page');
  });

  test('the opening phrase confirms the four-CLI wording (guards against a stale re-pin)', async ({
    page,
  }) => {
    await page.goto('./docs/introduction');
    const article = page.locator('article.doc-content');
    // Normalize whitespace: the phrase wraps across a source line break, which
    // markdown-it renders as a literal newline in the DOM text node.
    const text = (await article.first().textContent())?.replace(/\s+/g, ' ') ?? '';
    expect(text).toContain('four command-line AI coding assistants');
    expect(text).not.toContain('three command-line AI coding assistants');
  });

  test('no visible "crewrig-doc:" metadata block reaches the output', async ({
    page,
  }) => {
    const res = await page.goto('./docs/introduction');
    expect(res?.status()).toBe(200);
    const content = await page.content();
    expect(content).not.toContain('crewrig-doc');
  });

  test('relative links are rewritten: in-manifest to /docs/<slug>, out-of-manifest to an absolute upstream URL', async ({
    page,
  }) => {
    await page.goto('./docs/introduction');
    const article = page.locator('article.doc-content');

    // In-manifest: "Core concepts" (concepts.md) rewrites to a /docs route.
    const conceptsLink = article.locator('a[href="/docs/concepts"]', {
      hasText: 'Core concepts',
    });
    await expect(conceptsLink).toHaveCount(1);

    // Out-of-manifest: "../AGENTS.md" rewrites to an absolute blob URL at the
    // pinned ref — never left as a bare relative path.
    const agentsLinks = article.locator('a', { hasText: 'AGENTS.md' });
    await expect(agentsLinks.first()).toBeVisible();
    const hrefs = await agentsLinks.evaluateAll((els) =>
      els.map((e) => e.getAttribute('href') ?? ''),
    );
    for (const href of hrefs) {
      expect(href).toMatch(/^https:\/\/github\.com\/crewrig\/crewrig\/blob\/[0-9a-f]+\/AGENTS\.md$/);
    }
  });
});
