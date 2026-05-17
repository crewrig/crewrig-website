import { test, expect } from '@playwright/test';

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

  test('Hero: Fork on GitHub link points to github.com/hcross/crewrig', async ({ page }) => {
    await page.goto('./');
    const fork = page.locator('section#hero a', { hasText: /Fork on GitHub/i });
    await expect(fork).toBeVisible();
    const href = await fork.getAttribute('href');
    expect(href).toContain('github.com/hcross/crewrig');
  });

  test('Hero: Quick Start link points to #quick-start', async ({ page }) => {
    await page.goto('./');
    const qs = page.locator('section#hero a', { hasText: /Quick Start/i });
    await expect(qs).toBeVisible();
    const href = await qs.getAttribute('href');
    expect(href).toContain('#quick-start');
  });

  test('Problem section: exactly 3 cards', async ({ page }) => {
    await page.goto('./');
    const cards = page.locator('section#problem article');
    await expect(cards).toHaveCount(3);
  });

  test('Insight section: non-empty statement', async ({ page }) => {
    await page.goto('./');
    const h2 = page.locator('section#insight h2');
    await expect(h2).toBeVisible();
    expect((await h2.textContent())?.trim().length).toBeGreaterThan(0);
  });

  test('Solution section: exactly 3 pillar cards', async ({ page }) => {
    await page.goto('./');
    const cards = page.locator('section#solution article');
    await expect(cards).toHaveCount(3);
  });

  test('HowItWorks: 6 steps', async ({ page }) => {
    await page.goto('./');
    const steps = page.locator('section#how-it-works ol > li');
    await expect(steps).toHaveCount(6);
    // last step contains ∞
    await expect(steps.last()).toContainText('∞');
  });

  test('FeaturesGrid: 5 feature cards', async ({ page }) => {
    await page.goto('./');
    const cards = page.locator('section#features article');
    await expect(cards).toHaveCount(5);
  });

  test('QuickStart section exists with id', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('#quick-start')).toBeVisible();
  });

  test('QuickStart: 3 code blocks', async ({ page }) => {
    await page.goto('./');
    const pres = page.locator('section#quick-start pre');
    await expect(pres).toHaveCount(3);
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

  test('Footer: License/MIT link present', async ({ page }) => {
    await page.goto('./');
    const link = page.locator('footer a', { hasText: /(License|MIT)/i }).first();
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
  }
});

test.describe('Navigation', () => {
  test('Quick Start CTA scrolls to #quick-start', async ({ page }) => {
    await page.goto('./');
    await page.locator('section#hero a', { hasText: /Quick Start/i }).click();
    await expect(page).toHaveURL(/#quick-start$/);
    const target = page.locator('#quick-start');
    await expect(target).toBeInViewport();
  });
});
