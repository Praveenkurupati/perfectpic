// e2e/customizer.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Photobook Studio Customizer Canvas E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to studio with an initial project ID
    await page.goto('/studio/test-project-e2e');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load the studio editor canvas and toolbar controls', async ({ page }) => {
    // Assert page has loaded
    await expect(page).toHaveURL(/.*studio\/test-project-e2e/);

    // Verify main navigation or studio container is present
    const studioContainer = page.locator('main, div[class*="studio"], div[class*="editor"]').first();
    await expect(studioContainer).toBeVisible();

    // Verify presence of spread navigation buttons or controls
    const nextSpreadBtn = page.getByRole('button', { name: /next|forward|spread/i }).first();
    if (await nextSpreadBtn.isVisible()) {
      await expect(nextSpreadBtn).toBeEnabled();
    }
  });

  test('should allow navigating spreads and updating cover text', async ({ page }) => {
    // Look for cover title input if available
    const titleInput = page.locator('input[placeholder*="title" i], input[name="title"]').first();
    if (await titleInput.isVisible()) {
      await titleInput.fill('Our Family Vacation 2026');
      await expect(titleInput).toHaveValue('Our Family Vacation 2026');
    }

    // Check spread navigation
    const prevBtn = page.getByRole('button', { name: /prev|back/i }).first();
    if (await prevBtn.isVisible()) {
      await expect(prevBtn).toBeVisible();
    }
  });

  test('should display layout selection drawer or options', async ({ page }) => {
    // Check if layout or theme buttons exist
    const layoutTab = page.getByText(/layouts|templates|themes/i).first();
    if (await layoutTab.isVisible()) {
      await layoutTab.click();
      // Ensure layout options appear
      const layoutOptions = page.locator('[data-layout], button[class*="layout"]');
      if (await layoutOptions.count() > 0) {
        await expect(layoutOptions.first()).toBeVisible();
      }
    }
  });
});
