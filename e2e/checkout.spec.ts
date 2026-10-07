// e2e/checkout.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Checkout Funnel & Price Integrity E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Inject mock user auth and sample photobook item into localStorage before page loads
    await page.addInitScript(() => {
      localStorage.setItem('pp_token', 'mock_jwt_test_token_12345');
      localStorage.setItem(
        'perfectpic_user',
        JSON.stringify({
          id: 'user_e2e_1',
          name: 'Priya Sharma',
          email: 'priya.sharma@example.com',
          phone: '9876543210',
          role: 'customer',
        })
      );
      localStorage.setItem(
        'pp_cart',
        JSON.stringify({
          state: {
            items: [
              {
                id: 'cart-item-1',
                templateId: 'sri-lanka-travel',
                title: 'Sri Lanka Travel Diary Keepsake',
                basePrice: 1999,
                extraPagesPrice: 0,
                dimensions: '8.25" × 8.25"',
                pageCount: 32,
                quantity: 1,
                thumbnail: 'https://images.unsplash.com/photo-1588416936097-41850ab3d86d?w=800&auto=format&fit=crop',
              },
            ],
            accessories: {
              keepsakeBox: false,
              giftWrap: false,
              uvGlaze: false,
              miniPolaroids: false,
            },
            promoCode: null,
            discount: 0,
            discountAmount: 0,
          },
          version: 1,
        })
      );
    });

    await page.goto('/checkout');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should render all checkout steps and load autofilled recipient details', async ({ page }) => {
    // Verify stepper and heading
    await expect(page.getByRole('heading', { name: /secure checkout/i })).toBeVisible();

    // Verify delivery address section
    await expect(page.getByRole('heading', { name: /delivery address/i })).toBeVisible();

    // Verify recipient name input
    const nameInput = page.locator('input[placeholder*="Priya Sharma" i]');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveValue('Priya Sharma');

    // Verify mobile number input
    const phoneInput = page.locator('input[placeholder*="mobile" i]');
    await expect(phoneInput).toBeVisible();
    await expect(phoneInput).toHaveValue('9876543210');
  });

  test('should update order total when toggling express courier shipping', async ({ page }) => {
    // Assert initial standard free delivery
    const freeShippingBadge = page.getByText('FREE', { exact: true }).first();
    await expect(freeShippingBadge).toBeVisible();

    // Toggle Express Courier
    const expressOption = page.locator('label:has-text("Express Priority")');
    await expressOption.click();

    // Total should reflect +₹299
    const orderTotal = page.locator('span:has-text("₹2,298")').first();
    await expect(orderTotal).toBeVisible();

    // Toggle back to Standard Delivery
    const standardOption = page.locator('label:has-text("Standard Delivery")');
    await standardOption.click();

    // Total should return to ₹1,999
    const originalTotal = page.locator('span:has-text("₹1,999")').first();
    await expect(originalTotal).toBeVisible();
  });

  test('should toggle luxury packaging add-ons and update price breakdown', async ({ page }) => {
    // Click on Keepsake Velvet Presentation Box (+₹499)
    const velvetBoxCard = page.locator('div:has-text("Keepsake Velvet Presentation Box")').first();
    await velvetBoxCard.click();

    // Verify velvet box appears in the order summary
    const summaryBoxItem = page.locator('span:has-text("Keepsake Velvet Box")').first();
    await expect(summaryBoxItem).toBeVisible();

    // Verify price updated (+₹499 -> ₹2,498)
    const updatedTotal = page.locator('span:has-text("₹2,498")').first();
    await expect(updatedTotal).toBeVisible();
  });

  test('should validate required address fields before order placement', async ({ page }) => {
    // Clear recipient address line 1
    const addressInput = page.locator('input[placeholder*="House / Flat No" i]');
    await addressInput.fill('');

    // Attempt to submit
    const submitBtn = page.getByRole('button', { name: /pay & confirm order/i });
    await submitBtn.click();

    // Verify validation error message appears
    const errorAlert = page.locator('div:has-text("street address")').first();
    await expect(errorAlert).toBeVisible();
  });
});
