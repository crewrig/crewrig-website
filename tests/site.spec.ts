import { test, expect } from '@playwright/test';

// Persona names, in case order — must match src/data/cases.ts.
const PERSONAS = [
  'Priya Nair',
  'Marcus Bell',
  'Lena Ostrowski',
  'Tomas Reyes',
  'Aisha Diallo',
];

test.describe('Structure', () => {
  test('page loads with HTTP 200', async ({ page }) => {
    const res = await page.goto('./');
    expect(res?.status()).toBe(200);
  });

  test('<title> contains "CrewRig"', async ({ page }) => {
    await page.goto('./');
    await expect(page).toHaveTitle(/CrewRig/);
  });

  test('Hero h1 exists and has non-empty text', async ({ page }) => {
    await page.goto('./');
    const h1 = page.locator('section#hero h1');
    await expect(h1).toBeVisible();
    expect((await h1.textContent())?.trim().length).toBeGreaterThan(0);
  });

  test('Hero: Fork on GitHub link points to github.com/crewrig/crewrig', async ({ page }) => {
    await page.goto('./');
    const fork = page.locator('section#hero a', { hasText: /Fork on GitHub/i });
    await expect(fork).toBeVisible();
    const href = await fork.getAttribute('href');
    expect(href).toContain('github.com/crewrig/crewrig');
  });

  test('Hero: "See how it works" link anchors to the first case', async ({ page }) => {
    await page.goto('./');
    const cta = page.locator('section#hero a', { hasText: /See how it works/i });
    await expect(cta).toBeVisible();
    const href = await cta.getAttribute('href');
    expect(href).toContain('#case-');
  });

  // --- Five-case narrative ---------------------------------------------------

  test('exactly five case sections render', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('[data-testid="case"]')).toHaveCount(5);
  });

  test('each case section carries an image and its persona name', async ({ page }) => {
    await page.goto('./');
    const cases = page.locator('[data-testid="case"]');
    await expect(cases).toHaveCount(5);
    const count = await cases.count();
    for (let i = 0; i < count; i++) {
      const section = cases.nth(i);
      // Exactly one illustration per case.
      await expect(section.locator('img')).toHaveCount(1);
      // The matching persona name appears in the case body.
      await expect(section).toContainText(PERSONAS[i]);
    }
  });

  test('the five pillar personas all appear, each once', async ({ page }) => {
    await page.goto('./');
    for (const name of PERSONAS) {
      await expect(page.getByText(name, { exact: false })).toHaveCount(1);
    }
  });

  // --- Getting-started CTA ---------------------------------------------------

  test('QuickStart section exists with id', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('#quick-start')).toBeVisible();
  });

  test('getting-started CTA is present', async ({ page }) => {
    await page.goto('./');
    const cta = page.locator('section#quick-start a', { hasText: /View on GitHub/i });
    await expect(cta).toBeVisible();
    const href = await cta.getAttribute('href');
    expect(href).toContain('github.com/crewrig/crewrig');
  });

  // --- QuickStart CLI-toggle tests (PRESERVED — regression #12) ---------------

  test('QuickStart: CLI toggle — 7 pre blocks total in DOM', async ({ page }) => {
    await page.goto('./');
    // Step 1 (clone) + steps 3-4 × 3 CLIs = 7 pre blocks in DOM
    const pres = page.locator('section#quick-start pre');
    await expect(pres).toHaveCount(7);
  });

  test('QuickStart: Claude tab active by default, Gemini and Copilot hidden', async ({ page }) => {
    await page.goto('./');
    const claudeBlock = page.locator('section#quick-start [data-cli="claude"]').first();
    const geminiBlock = page.locator('section#quick-start [data-cli="gemini"]').first();
    const copilotBlock = page.locator('section#quick-start [data-cli="copilot"]').first();
    await expect(claudeBlock).toBeVisible();
    await expect(geminiBlock).toBeHidden();
    await expect(copilotBlock).toBeHidden();
  });

  test('QuickStart: toggle to Gemini shows Gemini panels, hides Claude and Copilot', async ({ page }) => {
    await page.goto('./');
    await page.click('#btn-gemini');
    const claudeBlock = page.locator('section#quick-start [data-cli="claude"]').first();
    const geminiBlock = page.locator('section#quick-start [data-cli="gemini"]').first();
    const copilotBlock = page.locator('section#quick-start [data-cli="copilot"]').first();
    await expect(geminiBlock).toBeVisible();
    await expect(claudeBlock).toBeHidden();
    await expect(copilotBlock).toBeHidden();
  });

  test('QuickStart: toggle to GitHub Copilot shows Copilot panels, hides Claude and Gemini', async ({ page }) => {
    await page.goto('./');
    await page.click('#btn-copilot');
    await expect(page.locator('#panel-copilot-3')).toBeVisible();
    await expect(page.locator('#panel-copilot-4')).toBeVisible();
    await expect(page.locator('#panel-claude-3')).toBeHidden();
    await expect(page.locator('#panel-gemini-3')).toBeHidden();
  });

  // --- Regression tests for issue #12 ---------------------------------------
  // Three bugs in the Copilot tab of the QuickStart section:
  //   1. Duplicate "Step 2" labels visible when Copilot tab is active.
  //   2. Prereq instructs `gh extension install github/gh-copilot` instead of
  //      the standalone GitHub Copilot CLI.
  //   3. Init commands use `gh copilot /init-…` instead of the standalone
  //      `copilot -i "/init-…"` syntax.

  test('QuickStart Copilot tab: exactly one visible "Step 2" label (regression #12 — bug 1)', async ({ page }) => {
    await page.goto('./');
    await page.click('#btn-copilot');
    const step2Labels = page.locator('section#quick-start *', { hasText: /^\s*Step 2\b/ });
    // Count only the leaf elements that directly contain a "Step 2" text node
    // and are visible — i.e. the section header tiles, not ancestor wrappers.
    const visibleStep2 = await step2Labels.evaluateAll((nodes) =>
      nodes.filter((n) => {
        const direct = Array.from(n.childNodes)
          .filter((c) => c.nodeType === Node.TEXT_NODE)
          .map((c) => (c.textContent ?? '').trim())
          .join(' ');
        if (!/^Step 2\b/.test(direct)) return false;
        const rect = (n as HTMLElement).getBoundingClientRect();
        const style = window.getComputedStyle(n as HTMLElement);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      }).length,
    );
    expect(visibleStep2).toBe(1);
  });

  test('QuickStart Copilot tab: no "gh extension install" command visible (regression #12 — bug 2)', async ({ page }) => {
    await page.goto('./');
    await page.click('#btn-copilot');
    const quickStartText = await page.locator('section#quick-start').innerText();
    expect(quickStartText).not.toContain('gh extension install');
  });

  test('QuickStart Copilot tab: init commands use standalone `copilot -i` syntax (regression #12 — bug 3)', async ({ page }) => {
    await page.goto('./');
    await page.click('#btn-copilot');
    const panel3 = page.locator('#panel-copilot-3');
    await expect(panel3).toBeVisible();
    const text = (await panel3.innerText()).trim();
    expect(text).toMatch(/copilot\s+-i\s+"\/init-personal-profile"/);
    expect(text).toMatch(/copilot\s+-i\s+"\/init-soul"/);
    expect(text).not.toMatch(/gh\s+copilot\s+\/init-/);
  });

  test('QuickStart: ArrowRight on Copilot tab wraps back to Claude', async ({ page }) => {
    await page.goto('./');
    await page.click('#btn-copilot');
    await page.locator('#btn-copilot').press('ArrowRight');
    await expect(page.locator('#panel-claude-3')).toBeVisible();
    await expect(page.locator('#panel-copilot-3')).toBeHidden();
    await expect(page.locator('#btn-claude')).toHaveAttribute('aria-selected', 'true');
  });

  test('QuickStart: ArrowLeft on Claude tab wraps to Copilot', async ({ page }) => {
    await page.goto('./');
    await page.locator('#btn-claude').press('ArrowLeft');
    await expect(page.locator('#panel-copilot-3')).toBeVisible();
    await expect(page.locator('#panel-claude-3')).toBeHidden();
    await expect(page.locator('#btn-copilot')).toHaveAttribute('aria-selected', 'true');
  });

  test('QuickStart: clicking a tab updates aria-selected', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('#btn-claude')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#btn-gemini')).toHaveAttribute('aria-selected', 'false');
    await expect(page.locator('#btn-copilot')).toHaveAttribute('aria-selected', 'false');
    await page.click('#btn-copilot');
    await expect(page.locator('#btn-copilot')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#btn-claude')).toHaveAttribute('aria-selected', 'false');
    await expect(page.locator('#btn-gemini')).toHaveAttribute('aria-selected', 'false');
  });

  test('Footer: logo image exists', async ({ page }) => {
    await page.goto('./');
    const logo = page.locator('footer img');
    await expect(logo).toBeVisible();
  });

  test('Footer: GitHub link present', async ({ page }) => {
    await page.goto('./');
    const link = page.locator('footer a', { hasText: /GitHub/i }).first();
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    expect(href).toContain('github.com');
  });

  test('Footer: License Apache 2.0 link present', async ({ page }) => {
    await page.goto('./');
    const link = page.locator('footer a', { hasText: /Apache 2\.0/i }).first();
    await expect(link).toBeVisible();
  });
});

test.describe('Responsive', () => {
  for (const [name, width, height] of [
    ['mobile', 390, 844],
    ['tablet', 768, 1024],
    ['desktop', 1440, 900],
  ] as const) {
    test(`${name} (${width}x${height}): no horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('./');
      const { scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(innerWidth + 1);
    });

    test(`${name} (${width}x${height}): five cases render with personas`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('./');
      const cases = page.locator('[data-testid="case"]');
      await expect(cases).toHaveCount(5);
      for (let i = 0; i < PERSONAS.length; i++) {
        await expect(cases.nth(i).locator('img')).toHaveCount(1);
        await expect(cases.nth(i)).toContainText(PERSONAS[i]);
      }
    });
  }
});

test.describe('Navigation', () => {
  test('"See how it works" CTA scrolls to the first case', async ({ page }) => {
    await page.goto('./');
    await page.locator('section#hero a', { hasText: /See how it works/i }).click();
    await expect(page).toHaveURL(/#case-/);
    const target = page.locator('[data-testid="case"]').first();
    await expect(target).toBeInViewport();
  });
});
