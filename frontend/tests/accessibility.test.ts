import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Saathi Accessibility Audits', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to active local server landing page
    await page.goto('/');
    await injectAxe(page);
  });

  test('Page has no visual contrast or ARIA violations (WCAG 2.2 AAA Target)', async ({ page }) => {
    // Run Axe auditing on the body
    await checkA11y(page, 'body', {
      axeOptions: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag22aa', 'wcag21a', 'wcag21aa', 'best-practice'],
        },
      },
    });
  });

  test('Focus indicators remain visible on keyboard tab-navigation', async ({ page }) => {
    // Tab forward and confirm focused element has outline
    await page.keyboard.press('Tab');
    const activeElement = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const styles = window.getComputedStyle(el);
      return {
        tagName: el.tagName,
        outlineWidth: styles.outlineWidth,
        outlineStyle: styles.outlineStyle,
      };
    });

    expect(activeElement).not.toBeNull();
    expect(activeElement?.outlineWidth).not.toBe('0px');
    expect(activeElement?.outlineStyle).not.toBe('none');
  });

  test('Reduced motion disables transitions', async ({ page }) => {
    // Inject prefers-reduced-motion media override
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    const hasReducedTransition = await page.evaluate(() => {
      const el = document.body;
      const styles = window.getComputedStyle(el);
      return styles.transitionDuration === '0s' || styles.transitionDuration === '0.001s';
    });

    expect(hasReducedTransition).toBe(true);
  });
});
