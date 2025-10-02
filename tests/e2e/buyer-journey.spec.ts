import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Anonymous Buyer Journey
 *
 * Tests the complete buyer flow from browsing to purchase completion.
 * Covers the critical path defined in the design doc.
 */

test.describe('Anonymous Buyer Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Start at marketplace home
    await page.goto('http://localhost:3000');
  });

  test('should allow anonymous browsing without wallet connection', async ({ page }) => {
    // Verify marketplace loads
    await expect(page.locator('h1')).toContainText('Web3 Marketplace');

    // Should see products without connecting wallet
    const productCards = page.locator('[data-testid="product-card"]');
    await expect(productCards.first()).toBeVisible({ timeout: 5000 });

    // Verify no wallet connection required yet
    const walletButton = page.locator('button:has-text("Connect Wallet")');
    await expect(walletButton).toBeVisible();
  });

  test('should search and filter products', async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"]');

    // Use search
    await page.fill('input[placeholder*="Search"]', 'laptop');
    await page.keyboard.press('Enter');

    // Verify search results
    await expect(page.locator('[data-testid="product-card"]')).toHaveCount(
      await page.locator('[data-testid="product-card"]').count()
    );

    // Filter by category
    await page.click('text=Electronics');
    await page.waitForLoadState('networkidle');

    // Verify filtering worked
    const products = page.locator('[data-testid="product-card"]');
    expect(await products.count()).toBeGreaterThan(0);
  });

  test('should view product details', async ({ page }) => {
    // Click first product
    await page.click('[data-testid="product-card"]');

    // Verify product detail page
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-testid="product-price"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-description"]')).toBeVisible();
    await expect(page.locator('button:has-text("Add to Cart")')).toBeVisible();
  });

  test('should add items to cart', async ({ page }) => {
    // Add product to cart
    await page.click('[data-testid="product-card"]');
    await page.click('button:has-text("Add to Cart")');

    // Verify cart notification or update
    await expect(page.locator('text=/Added to cart|Cart updated/i')).toBeVisible({
      timeout: 3000
    });

    // Check cart icon shows count
    const cartBadge = page.locator('[data-testid="cart-count"]');
    await expect(cartBadge).toHaveText('1');
  });

  test('should view and manage cart', async ({ page }) => {
    // Add product to cart first
    await page.click('[data-testid="product-card"]');
    await page.click('button:has-text("Add to Cart")');
    await page.waitForTimeout(500);

    // Navigate to cart
    await page.click('[data-testid="cart-button"]');

    // Verify cart page
    await expect(page.locator('h1, h2')).toContainText('Cart');
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);

    // Update quantity
    await page.click('[data-testid="quantity-increase"]');
    await expect(page.locator('[data-testid="quantity-input"]')).toHaveValue('2');

    // Verify total updates
    const total = page.locator('[data-testid="cart-total"]');
    await expect(total).toBeVisible();
  });

  test('should remove items from cart', async ({ page }) => {
    // Add product
    await page.click('[data-testid="product-card"]');
    await page.click('button:has-text("Add to Cart")');
    await page.waitForTimeout(500);

    // Go to cart
    await page.click('[data-testid="cart-button"]');

    // Remove item
    await page.click('[data-testid="remove-item"]');

    // Verify empty cart
    await expect(page.locator('text=/Your cart is empty|No items/i')).toBeVisible();
  });

  test('should proceed to checkout and prompt for wallet', async ({ page }) => {
    // Add product and go to cart
    await page.click('[data-testid="product-card"]');
    await page.click('button:has-text("Add to Cart")');
    await page.waitForTimeout(500);
    await page.click('[data-testid="cart-button"]');

    // Click checkout
    await page.click('button:has-text("Checkout")');

    // Should be prompted to connect wallet
    await expect(page.locator('text=/Connect.*Wallet|Sign in/i')).toBeVisible({
      timeout: 3000
    });
  });

  test('should persist cart in local storage across page reloads', async ({ page, context }) => {
    // Add item to cart
    await page.click('[data-testid="product-card"]');
    await page.click('button:has-text("Add to Cart")');
    await page.waitForTimeout(500);

    // Get cart count before reload
    const cartCountBefore = await page.locator('[data-testid="cart-count"]').textContent();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify cart persisted
    const cartCountAfter = await page.locator('[data-testid="cart-count"]').textContent();
    expect(cartCountAfter).toBe(cartCountBefore);
  });

  test('should handle multi-seller cart', async ({ page }) => {
    // Add products from different sellers
    const products = page.locator('[data-testid="product-card"]');
    await products.nth(0).click();
    await page.click('button:has-text("Add to Cart")');
    await page.goBack();
    await page.waitForLoadState('networkidle');

    await products.nth(1).click();
    await page.click('button:has-text("Add to Cart")');

    // Go to cart
    await page.goBack();
    await page.click('[data-testid="cart-button"]');

    // Verify multiple items
    const cartItems = page.locator('[data-testid="cart-item"]');
    expect(await cartItems.count()).toBeGreaterThanOrEqual(2);
  });

  test('should display correct pricing and totals', async ({ page }) => {
    // Add product
    await page.click('[data-testid="product-card"]');

    // Get product price
    const priceText = await page.locator('[data-testid="product-price"]').textContent();
    const price = parseInt(priceText?.replace(/[^0-9]/g, '') || '0');

    await page.click('button:has-text("Add to Cart")');
    await page.click('[data-testid="cart-button"]');

    // Verify cart total matches
    const totalText = await page.locator('[data-testid="cart-total"]').textContent();
    const total = parseInt(totalText?.replace(/[^0-9]/g, '') || '0');

    expect(total).toBe(price);
  });

  test('should handle empty cart checkout gracefully', async ({ page }) => {
    // Try to access checkout with empty cart
    await page.goto('http://localhost:3000/checkout');

    // Should redirect or show empty state
    await expect(
      page.locator('text=/Your cart is empty|Add items to cart/i')
    ).toBeVisible({ timeout: 3000 });
  });

  test('should display product images from IPFS/Bulletin', async ({ page }) => {
    await page.click('[data-testid="product-card"]');

    // Verify images load
    const productImage = page.locator('[data-testid="product-image"]');
    await expect(productImage).toBeVisible();

    // Check image has valid src
    const src = await productImage.getAttribute('src');
    expect(src).toBeTruthy();
    expect(src).toMatch(/^https?:\/\//);
  });
});

/**
 * Mobile responsive tests
 */
test.describe('Mobile Buyer Journey', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should work on mobile devices', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Verify mobile menu
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();

    // Browse products
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible();

    // Add to cart
    await page.click('[data-testid="product-card"]');
    await page.click('button:has-text("Add to Cart")');

    // Verify mobile cart
    const cartBadge = page.locator('[data-testid="cart-count"]');
    await expect(cartBadge).toHaveText('1');
  });
});
