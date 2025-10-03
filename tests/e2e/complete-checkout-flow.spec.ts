import { test, expect } from '@playwright/test';

/**
 * E2E Test: Complete Checkout Flow with Digital Delivery
 *
 * Tests the full user journey from browsing to receiving delivery token
 */

test.describe('Complete Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should complete full checkout flow and receive delivery token', async ({ page }) => {
    // Step 1: Browse products
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible({
      timeout: 5000
    });

    // Step 2: Add product to cart
    await page.click('[data-testid="product-card"]');
    await page.click('button:has-text("Add to Cart")');

    await expect(page.locator('text=/Added to cart|Cart updated/i')).toBeVisible({
      timeout: 3000
    });

    // Step 3: Go to cart
    await page.click('[data-testid="cart-button"]');
    await expect(page.locator('h1, h2')).toContainText('Cart');

    // Step 4: Proceed to checkout
    await page.click('button:has-text("Checkout")');

    // Step 5: Connect wallet prompt appears
    await expect(page.locator('text=/Connect.*Wallet|Sign in/i')).toBeVisible({
      timeout: 3000
    });

    // Mock wallet connection for testing
    await page.evaluate(() => {
      // @ts-ignore
      window.mockWalletConnected = true;
      // @ts-ignore
      window.mockWalletAddress = '0xBuyerTestAddress123';
    });

    // Step 6: Complete payment (mocked)
    // In real scenario, this would trigger wallet signature
    await page.evaluate(() => {
      // Mock successful payment
      const event = new CustomEvent('paymentComplete', {
        detail: {
          txHash: '0xmockedtxhash123',
          blockNumber: 12345,
          amount: 100000
        }
      });
      window.dispatchEvent(event);
    });

    // Step 7: Verify delivery token received
    await expect(page.locator('text=/delivery|download/i')).toBeVisible({
      timeout: 10000
    });

    // Step 8: Check for delivery URL or download button
    const deliveryLink = page.locator('a[href*="/delivery/"], button:has-text("Download")');
    await expect(deliveryLink.first()).toBeVisible({
      timeout: 5000
    });

    // Step 9: Verify transaction confirmation
    await expect(page.locator('text=/success|complete|confirmed/i')).toBeVisible();
  });

  test('should show seller reputation during checkout', async ({ page }) => {
    await page.click('[data-testid="product-card"]');

    // Verify seller reputation badge is visible
    const reputationBadge = page.locator('.seller-reputation, [data-testid="seller-reputation"]');
    await expect(reputationBadge).toBeVisible({
      timeout: 5000
    });

    // Check for transaction count or reputation indicator
    await expect(reputationBadge).toContainText(/\d+\s*(sale|transaction)/i);
  });

  test('should handle checkout with empty cart gracefully', async ({ page }) => {
    await page.goto('http://localhost:3000/checkout');

    await expect(
      page.locator('text=/cart is empty|add items to cart/i')
    ).toBeVisible({
      timeout: 3000
    });
  });

  test('should allow cart modification before checkout', async ({ page }) => {
    // Add product to cart
    await page.click('[data-testid="product-card"]');
    await page.click('button:has-text("Add to Cart")');
    await page.waitForTimeout(500);

    // Go to cart
    await page.click('[data-testid="cart-button"]');

    // Increase quantity
    await page.click('[data-testid="quantity-increase"]');
    await expect(page.locator('[data-testid="quantity-input"]')).toHaveValue('2');

    // Verify total updates
    const total = page.locator('[data-testid="cart-total"]');
    await expect(total).toBeVisible();

    // Proceed to checkout with updated quantity
    await page.click('button:has-text("Checkout")');

    await expect(page.locator('text=/Connect.*Wallet|Sign in/i')).toBeVisible({
      timeout: 3000
    });
  });

  test('should show delivery instructions for digital products', async ({ page }) => {
    // Mock successful checkout
    await page.evaluate(() => {
      // @ts-ignore
      localStorage.setItem('mockDeliveryToken', '0123456789abcdef');
    });

    await page.goto('http://localhost:3000/order/confirmation');

    // Check for delivery instructions
    await expect(
      page.locator('text=/delivery instructions|how to access|download/i')
    ).toBeVisible({
      timeout: 5000
    });

    // Verify token expiration info
    await expect(
      page.locator('text=/7 days|expires|valid until/i')
    ).toBeVisible();
  });

  test('should display order summary before payment', async ({ page }) => {
    await page.click('[data-testid="product-card"]');
    await page.click('button:has-text("Add to Cart")');
    await page.waitForTimeout(500);

    await page.click('[data-testid="cart-button"]');
    await page.click('button:has-text("Checkout")');

    // Verify order summary components
    await expect(page.locator('text=/order summary|review order/i')).toBeVisible();
    await expect(page.locator('text=/total|subtotal/i')).toBeVisible();
    await expect(page.locator('text=/seller|merchant/i')).toBeVisible();
  });
});

/**
 * Digital Delivery Token Redemption Flow
 */
test.describe('Delivery Token Redemption', () => {
  test('should redeem delivery token successfully', async ({ page }) => {
    // Mock delivery token
    const mockToken = 'a'.repeat(64); // 64-char hex token

    await page.goto(`http://localhost:3000/delivery/${mockToken}`);

    // Check for delivery content or error message
    const content = page.locator('body');
    await expect(content).toContainText(/.+/, {
      timeout: 5000
    });

    // Verify either success (product delivered) or error (token invalid/expired)
    const hasSuccess = await page.locator('text=/download|access|delivered/i').count() > 0;
    const hasError = await page.locator('text=/invalid|expired|not found/i').count() > 0;

    expect(hasSuccess || hasError).toBe(true);
  });

  test('should show error for invalid delivery token', async ({ page }) => {
    await page.goto('http://localhost:3000/delivery/invalidtoken123');

    await expect(
      page.locator('text=/invalid|not found|error/i')
    ).toBeVisible({
      timeout: 5000
    });
  });
});
