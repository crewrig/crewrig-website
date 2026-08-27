import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Section-scoped regression coverage for the Reference section refresh
// (crewrig-website#32): the heaviest section of the docs-pin bump to
// crewrig@a14cefd — 4 reworked pages (`cli-matrix.md`, `spec-format.md`,
// `plan-format.md`, `scripting-conventions.md`), 1 unchanged
// (`publication-contract.md`), and 3 new (`ci-reference-format.md`,
// `org-mcp-declaration.md`, `extension-hook-events.md`).
// Kept in its own file (never touching `tests/docs.spec.ts` or any other
// section's `docs-*.spec.ts`) so this ticket's PR does not collide with
// the other section-refresh PRs running in parallel.

const here = dirname(fileURLToPath(import.meta.url));

const pin = JSON.parse(
  readFileSync(join(here, '../docs-pin.json'), 'utf8'),
) as { repo: string; ref: string };
const BLOB_BASE = `https://github.com/${pin.repo}/blob/${pin.ref}`;

const CLI_MATRIX = '/docs/cli-matrix';
const SPEC_FORMAT = '/docs/spec-format';
const PLAN_FORMAT = '/docs/plan-format';
const SCRIPTING_CONVENTIONS = '/docs/scripting-conventions';
const PUBLICATION_CONTRACT = '/docs/publication-contract';
const CI_REFERENCE_FORMAT = '/docs/ci-reference-format';
const ORG_MCP_DECLARATION = '/docs/org-mcp-declaration';
const EXTENSION_HOOK_EVENTS = '/docs/extension-hook-events';

// In manifest nav_order (10 -> 80).
const REFERENCE_PAGES: { route: string; title: string }[] = [
  { route: CLI_MATRIX, title: 'CLI support matrix' },
  { route: SPEC_FORMAT, title: 'Specification format' },
  { route: PLAN_FORMAT, title: 'Plan format' },
  { route: SCRIPTING_CONVENTIONS, title: 'Scripting conventions' },
  { route: PUBLICATION_CONTRACT, title: 'Documentation publication contract' },
  { route: CI_REFERENCE_FORMAT, title: 'CI capability reference format' },
  { route: ORG_MCP_DECLARATION, title: 'Org MCP server declaration channel' },
  { route: EXTENSION_HOOK_EVENTS, title: 'Extension hook events' },
];

test.describe('Docs section — Reference', () => {
  test('all 8 Reference pages return HTTP 200', async ({ page }) => {
    for (const { route } of REFERENCE_PAGES) {
      const res = await page.goto(`.${route}`);
      expect(res?.status(), route).toBe(200);
    }
  });

  test('sidebar lists all 8 Reference pages in manifest nav_order (10 -> 80)', async ({
    page,
  }) => {
    await page.goto('./docs');
    // Scope to the Reference section's own <ul>, not the full sidebar, so
    // ordering among sibling sections cannot make this test pass by accident.
    const section = page
      .locator('aside nav h2', { hasText: 'Reference' })
      .locator('xpath=following-sibling::ul[1]');
    const links = section.locator('a');
    await expect(links).toHaveCount(REFERENCE_PAGES.length);
    for (let i = 0; i < REFERENCE_PAGES.length; i++) {
      await expect(links.nth(i)).toHaveAttribute('href', REFERENCE_PAGES[i].route);
      await expect(links.nth(i)).toHaveText(REFERENCE_PAGES[i].title);
    }
  });

  test('/docs landing index also lists all 8 Reference pages', async ({ page }) => {
    // The index page's own content list (`getSections()` rendered inline)
    // is a second consumer of the same manifest, distinct from the sidebar
    // nav that also renders on this page — scope to the content list so a
    // sidebar match cannot make this pass by accident.
    await page.goto('./docs');
    const content = page.locator('main article.doc-content');
    for (const { route } of REFERENCE_PAGES) {
      await expect(content.locator(`a[href="${route}"]`)).toHaveCount(1);
    }
  });

  test('no visible metadata block on any of the 8 pages', async ({ page }) => {
    for (const { route } of REFERENCE_PAGES) {
      // publication-contract.md is the one page in this set that legitimately
      // documents the `crewrig-doc:` grammar in prose and code samples (same
      // exception `tests/docs.spec.ts` already carves out for its own sample
      // page) — the literal string is expected content there, not a leak of
      // the page's own metadata comment.
      if (route === PUBLICATION_CONTRACT) continue;
      await page.goto(`.${route}`);
      const content = await page.content();
      expect(content, `${route} leaked metadata`).not.toContain('crewrig-doc');
      expect(content, `${route} leaked metadata`).not.toContain('<!-- crewrig-doc');
    }
  });

  test('publication-contract.md: its own metadata comment is stripped even though the page documents the grammar in prose', async ({
    page,
  }) => {
    await page.goto(`.${PUBLICATION_CONTRACT}`);
    const content = await page.content();
    // The literal HTML comment for THIS page must still be gone (F4); only
    // the fenced-code-block prose examples of the grammar are expected to
    // remain, and those render as visible <code> text, never as a live
    // HTML comment.
    expect(content).not.toContain(
      '<!-- crewrig-doc: section=reference nav_order=50 published=true title="Documentation publication contract" -->',
    );
  });

  test('publication-contract.md: fenced grammar examples survive verbatim (F4 fence-awareness bugfix), the real metadata block stays stripped', async ({
    page,
  }) => {
    // Regression test for the render-doc.ts bug logged on issue #32: the
    // metadata-block strip used to run on the whole raw string before the
    // fence-aware line loop, so it also erased any `<!-- crewrig-doc: ... -->`
    // text sitting INSIDE a fenced code block — even when that fence was
    // merely illustrating the grammar, not declaring real page metadata.
    // Assert both directions so this test fails whichever way the bug comes
    // back: the fence content must survive, and the real metadata block must
    // still be gone.
    await page.goto(`.${PUBLICATION_CONTRACT}`);

    // "Grammar" section: the generic pattern illustration.
    const grammarExample = page.locator('#grammar + p + pre code');
    await expect(grammarExample).not.toBeEmpty();
    await expect(grammarExample).toContainText(
      '<!-- crewrig-doc: <key>=<value> <key>=<value> ... -->',
    );

    // "Example" section: the concrete worked example (a DIFFERENT page's
    // metadata, `section=lifecycle`, used purely as an illustration here).
    const workedExample = page.locator('#example + pre code');
    await expect(workedExample).not.toBeEmpty();
    await expect(workedExample).toContainText(
      '<!-- crewrig-doc: section=lifecycle nav_order=20 published=true title="Plan format and review" -->',
    );

    // The real metadata block for THIS page — right after the H1, outside
    // any fence — must still be gone. Fence-awareness must not become a
    // loophole that lets a real, un-fenced metadata block survive.
    const content = await page.content();
    expect(content).not.toContain(
      '<!-- crewrig-doc: section=reference nav_order=50 published=true title="Documentation publication contract" -->',
    );
  });

  test('each page renders its H1 with no dangling "{#" heading syntax', async ({
    page,
  }) => {
    for (const { route, title } of REFERENCE_PAGES) {
      await page.goto(`.${route}`);
      const h1 = page.locator('article.doc-content h1').first();
      await expect(h1).toBeVisible();
      const headings = page.locator('article.doc-content :is(h1,h2,h3,h4,h5,h6)');
      const texts = await headings.allInnerTexts();
      for (const t of texts) {
        expect(t, `${route} heading leaked Kramdown syntax`).not.toContain('{#');
      }
      void title; // titles asserted against the sidebar test above
    }
  });

  test('cli-matrix.md: both tables render, and the feature matrix carries an Antigravity CLI column', async ({
    page,
  }) => {
    await page.goto(`.${CLI_MATRIX}`);
    const tables = page.locator('article.doc-content table');
    await expect(tables).toHaveCount(2);
    // Feature matrix is the second table (Supported CLIs is the first).
    const featureMatrix = tables.nth(1);
    await expect(featureMatrix.locator('th', { hasText: 'Antigravity CLI' })).toHaveCount(1);
    await expect(featureMatrix.locator('th', { hasText: 'Claude Code' })).toHaveCount(1);
    await expect(featureMatrix.locator('th', { hasText: 'Gemini CLI' })).toHaveCount(1);
    await expect(featureMatrix.locator('th', { hasText: 'Copilot CLI' })).toHaveCount(1);
  });

  test('cli-matrix.md: no lingering standalone GitHub/forge MCP server row (CLI-only forge access)', async ({
    page,
  }) => {
    await page.goto(`.${CLI_MATRIX}`);
    const rows = page.locator('article.doc-content table tr');
    const rowTexts = await rows.allInnerTexts();
    const forgeMcpRow = rowTexts.some(
      (t) => /forge mcp/i.test(t) && !/no forge mcp/i.test(t),
    );
    expect(forgeMcpRow, 'a standalone forge-MCP-server row survived the drop').toBe(false);
  });

  for (const route of [CLI_MATRIX, EXTENSION_HOOK_EVENTS]) {
    test(`${route}: wide tables sit in their own horizontally scrollable container, not the page`, async ({
      page,
    }) => {
      await page.goto(`.${route}`);
      const result = await page.evaluate(() => {
        const tables = [...document.querySelectorAll('article.doc-content table')];
        return {
          pageOverflows:
            document.documentElement.scrollWidth > document.documentElement.clientWidth,
          tables: tables.map((t) => {
            const style = getComputedStyle(t);
            return { display: style.display, overflowX: style.overflowX };
          }),
        };
      });
      expect(result.pageOverflows, `${route} leaks a table overflow onto the page`).toBe(
        false,
      );
      expect(result.tables.length).toBeGreaterThan(0);
      for (const t of result.tables) {
        // The table-as-scroll-container technique: `display: block` is what
        // makes `overflow-x: auto` actually clip/scroll a <table> across
        // browsers (a `display: table` box ignores overflow on itself).
        expect(t.display).toBe('block');
        expect(t.overflowX).toBe('auto');
      }
    });
  }

  test('cli-matrix.md: in-manifest links rewrite to /docs routes (no 404)', async ({
    page,
  }) => {
    // `](extension-hook-events.md)` and `](ci-reference-format.md)` are both
    // in-manifest (same section, sibling pages).
    await page.goto(`.${CLI_MATRIX}`);
    await expect(
      page.locator(`article.doc-content a[href="${EXTENSION_HOOK_EVENTS}"]`),
    ).toHaveCount(1);
    await expect(
      page.locator(`article.doc-content a[href="${CI_REFERENCE_FORMAT}"]`),
    ).toHaveCount(1);
    const res = await page.goto(`.${EXTENSION_HOOK_EVENTS}`);
    expect(res?.status()).toBe(200);
  });

  test('cli-matrix.md: out-of-manifest, in-tree, non-.md links rewrite to absolute upstream blob URLs (F1)', async ({
    page,
  }) => {
    // `](../ci/ci-capabilities.yml)` and `](../.gitlab-ci.yml)` both resolve
    // to real in-tree files that are not part of the published docs
    // manifest — neither escapes the repo root, so both must become
    // absolute blob URLs at the pinned ref, not /docs routes or bare
    // relative paths.
    await page.goto(`.${CLI_MATRIX}`);
    await expect(
      page.locator(`article.doc-content a[href="${BLOB_BASE}/ci/ci-capabilities.yml"]`),
    ).toHaveCount(1);
    await expect(
      page.locator(`article.doc-content a[href="${BLOB_BASE}/.gitlab-ci.yml"]`),
    ).toHaveCount(1);
  });

  test('org-mcp-declaration.md: in-manifest links rewrite to /docs routes (no 404)', async ({
    page,
  }) => {
    // `](cli-matrix.md)`, `](adr/0015-forge-access-cli-only.md)`, and
    // `](layers.md)` are all in-manifest.
    await page.goto(`.${ORG_MCP_DECLARATION}`);
    await expect(
      page.locator(`article.doc-content a[href="${CLI_MATRIX}"]`),
    ).toHaveCount(1);
    await expect(
      page.locator('article.doc-content a[href="/docs/adr/0015-forge-access-cli-only"]'),
    ).toHaveCount(1);
    await expect(
      page.locator('article.doc-content a[href="/docs/layers"]'),
    ).toHaveCount(1);
    const res = await page.goto('./docs/adr/0015-forge-access-cli-only');
    expect(res?.status()).toBe(200);
  });

  test('org-mcp-declaration.md: out-of-manifest spec link rewrites to an absolute upstream blob URL', async ({
    page,
  }) => {
    // `](../specs/0091-org-mcp-declaration.md)` — specs/ is not published.
    await page.goto(`.${ORG_MCP_DECLARATION}`);
    const link = page.locator(
      `article.doc-content a[href="${BLOB_BASE}/specs/0091-org-mcp-declaration.md"]`,
    );
    await expect(link).toHaveCount(1);
  });

  test('org-mcp-declaration.md: absolute external URL is left untouched', async ({
    page,
  }) => {
    await page.goto(`.${ORG_MCP_DECLARATION}`);
    const link = page.locator(
      'article.doc-content a[href="https://antigravity.google/docs/mcp#mcp-configuration-structure"]',
    );
    await expect(link).toHaveCount(1);
  });

  test('scripting-conventions.md: out-of-manifest non-.md link escapes docs/ to repo root and rewrites to an absolute blob URL', async ({
    page,
  }) => {
    // `](../ci/bash32-forbidden.txt)` resolves to `ci/bash32-forbidden.txt`
    // at the repo root — not an .md file, not in the docs manifest.
    await page.goto(`.${SCRIPTING_CONVENTIONS}`);
    const link = page.locator(
      `article.doc-content a[href="${BLOB_BASE}/ci/bash32-forbidden.txt"]`,
    );
    await expect(link).toHaveCount(1);
  });

  test('ci-reference-format.md: out-of-manifest same-directory link rewrites to an absolute blob URL', async ({
    page,
  }) => {
    // `](cli-matrix-maintenance.md)` sits alongside this page's own docs/
    // directory but is not part of the published manifest.
    await page.goto(`.${CI_REFERENCE_FORMAT}`);
    const link = page.locator(
      `article.doc-content a[href="${BLOB_BASE}/docs/cli-matrix-maintenance.md"]`,
    );
    await expect(link).toHaveCount(1);
  });

  test('publication-contract.md: no relative link survives un-rewritten (F1)', async ({
    page,
  }) => {
    await page.goto(`.${PUBLICATION_CONTRACT}`);
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
  });
});
