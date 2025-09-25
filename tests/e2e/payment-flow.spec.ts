import { test, expect } from '@playwright/test';

test.describe('Payment Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('should complete full payment flow', async ({ page }) => {
    // Navigate to products page
    await page.click('text=Products');
    await expect(page).toHaveURL('/products');

    // Add a product to cart
    await page.click('[data-testid="product-card"]:first-child button:has-text("Add to Cart")');
    
    // Verify cart notification
    await expect(page.locator('[data-testid="cart-notification"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');

    // Go to cart
    await page.click('[data-testid="cart-icon"]');
    await expect(page).toHaveURL('/cart');

    // Verify cart contents
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="cart-total"]')).toBeVisible();

    // Proceed to checkout
    await page.click('button:has-text("Checkout")');
    await expect(page).toHaveURL('/checkout');

    // Fill customer information
    await page.fill('[data-testid="customer-name"]', 'John Doe');
    await page.fill('[data-testid="customer-email"]', 'john@example.com');

    // Verify payment options are displayed
    await expect(page.locator('[data-testid="payment-options"]')).toBeVisible();
    await expect(page.locator('text=DOT')).toBeVisible();
    await expect(page.locator('text=KSM')).toBeVisible();

    // Select payment method (DOT)
    await page.click('[data-testid="payment-dot"]');

    // Verify QR code is generated
    await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-address"]')).toBeVisible();

    // Verify payment amount is displayed
    await expect(page.locator('[data-testid="payment-amount"]')).toBeVisible();

    // Simulate payment completion (in real scenario, this would be done via blockchain)
    await page.click('button:has-text("Simulate Payment")');

    // Verify redirect to order complete page
    await expect(page).toHaveURL(/\/order-complete/);
    await expect(page.locator('[data-testid="order-success"]')).toBeVisible();
    await expect(page.locator('text=Payment completed successfully')).toBeVisible();
  });

  test('should handle payment timeout', async ({ page }) => {
    // Navigate to checkout
    await page.goto('/checkout');
    
    // Fill customer information
    await page.fill('[data-testid="customer-name"]', 'John Doe');
    await page.fill('[data-testid="customer-email"]', 'john@example.com');

    // Select payment method
    await page.click('[data-testid="payment-dot"]');

    // Wait for payment timeout (simulated)
    await page.click('button:has-text("Simulate Timeout")');

    // Verify timeout message
    await expect(page.locator('[data-testid="payment-timeout"]')).toBeVisible();
    await expect(page.locator('text=Payment timed out')).toBeVisible();

    // Verify retry option
    await expect(page.locator('button:has-text("Retry Payment")')).toBeVisible();
  });

  test('should handle payment cancellation', async ({ page }) => {
    // Navigate to checkout
    await page.goto('/checkout');
    
    // Fill customer information
    await page.fill('[data-testid="customer-name"]', 'John Doe');
    await page.fill('[data-testid="customer-email"]', 'john@example.com');

    // Select payment method
    await page.click('[data-testid="payment-dot"]');

    // Cancel payment
    await page.click('button:has-text("Cancel Payment")');

    // Verify redirect back to cart
    await expect(page).toHaveURL('/cart');
    await expect(page.locator('[data-testid="payment-cancelled"]')).toBeVisible();
  });

  test('should validate customer information', async ({ page }) => {
    // Navigate to checkout
    await page.goto('/checkout');

    // Try to proceed without filling required fields
    await page.click('button:has-text("Proceed to Payment")');

    // Verify validation errors
    await expect(page.locator('[data-testid="name-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();

    // Fill invalid email
    await page.fill('[data-testid="customer-name"]', 'John Doe');
    await page.fill('[data-testid="customer-email"]', 'invalid-email');
    await page.click('button:has-text("Proceed to Payment")');

    // Verify email validation error
    await expect(page.locator('[data-testid="email-error"]')).toHaveText('Please enter a valid email address');
  });

  test('should display correct payment amounts', async ({ page }) => {
    // Add multiple items to cart with different prices
    await page.goto('/products');
    
    // Add first product
    await page.click('[data-testid="product-card"]:first-child button:has-text("Add to Cart")');
    
    // Add second product
    await page.click('[data-testid="product-card"]:nth-child(2) button:has-text("Add to Cart")');

    // Go to checkout
    await page.click('[data-testid="cart-icon"]');
    await page.click('button:has-text("Checkout")');

    // Verify subtotal, tax, and total are calculated correctly
    await expect(page.locator('[data-testid="subtotal"]')).toBeVisible();
    await expect(page.locator('[data-testid="tax"]')).toBeVisible();
    await expect(page.locator('[data-testid="total"]')).toBeVisible();

    // Verify amounts are positive numbers
    const subtotal = await page.locator('[data-testid="subtotal"]').textContent();
    const tax = await page.locator('[data-testid="tax"]').textContent();
    const total = await page.locator('[data-testid="total"]').textContent();

    expect(parseFloat(subtotal?.replace('$', '') || '0')).toBeGreaterThan(0);
    expect(parseFloat(tax?.replace('$', '') || '0')).toBeGreaterThan(0);
    expect(parseFloat(total?.replace('$', '') || '0')).toBeGreaterThan(0);
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network failure
    await page.route('**/api/**', route => route.abort());

    // Navigate to products
    await page.goto('/products');

    // Verify error handling
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('text=Failed to load products')).toBeVisible();

    // Verify retry functionality
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to products
    await page.goto('/products');

    // Verify mobile layout
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible();

    // Test mobile navigation
    await page.click('[data-testid="mobile-menu-toggle"]');
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();

    // Test mobile cart
    await page.click('[data-testid="mobile-cart-icon"]');
    await expect(page.locator('[data-testid="mobile-cart"]')).toBeVisible();
  });
});
