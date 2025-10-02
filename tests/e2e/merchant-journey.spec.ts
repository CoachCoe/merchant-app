import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Merchant Journey
 *
 * Tests the complete merchant flow for store setup and product listings.
 * Tests wallet authentication and product management.
 */

test.describe('Merchant Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should prompt wallet connection for merchant actions', async ({ page }) => {
    // Try to access merchant dashboard without wallet
    await page.goto('http://localhost:3000/merchant/dashboard');

    // Should be redirected or prompted to connect
    await expect(
      page.locator('text=/Connect.*Wallet|Sign in|Authentication required/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test.describe('With mocked wallet connection', () => {
    test.beforeEach(async ({ page }) => {
      // Mock wallet connection
      await page.addInitScript(() => {
        // @ts-ignore
        window.mockWalletConnected = true;
        // @ts-ignore
        window.mockWalletAddress = '0x1234567890123456789012345678901234567890';
      });
    });

    test('should create store profile', async ({ page }) => {
      await page.goto('http://localhost:3000/merchant/store/create');

      // Fill store details
      await page.fill('[data-testid="store-name"]', 'Test Store');
      await page.fill('[data-testid="store-description"]', 'A test marketplace store');

      // Upload logo (optional)
      // await page.setInputFiles('[data-testid="logo-upload"]', 'path/to/test-logo.png');

      // Submit store creation
      await page.click('button:has-text("Create Store")');

      // Verify success
      await expect(page.locator('text=/Store created|Success/i')).toBeVisible({
        timeout: 10000
      });
    });

    test('should create product listing', async ({ page }) => {
      await page.goto('http://localhost:3000/merchant/products/new');

      // Fill product details
      await page.fill('[data-testid="product-title"]', 'Test Product');
      await page.fill('[data-testid="product-description"]', 'A test product for the marketplace');
      await page.fill('[data-testid="product-price"]', '100');

      // Select category
      await page.selectOption('[data-testid="product-category"]', 'electronics');

      // Add images
      // await page.setInputFiles('[data-testid="image-upload"]', ['test1.jpg', 'test2.jpg']);

      // Set delivery type
      await page.selectOption('[data-testid="delivery-type"]', 'digital');

      // Submit
      await page.click('button:has-text("Create Product")');

      // Wait for IPFS/Bulletin upload and blockchain registration
      await expect(page.locator('text=/Product created|Listed successfully/i')).toBeVisible({
        timeout: 30000 // Allow time for IPFS upload
      });
    });

    test('should view product catalog', async ({ page }) => {
      await page.goto('http://localhost:3000/merchant/products');

      // Should see list of products
      await expect(page.locator('[data-testid="merchant-product-list"]')).toBeVisible();

      // Should have actions for each product
      await expect(page.locator('button:has-text("Edit")')).toBeVisible();
      await expect(page.locator('button:has-text("Deactivate")')).toBeVisible();
    });

    test('should edit product listing', async ({ page }) => {
      await page.goto('http://localhost:3000/merchant/products');

      // Click edit on first product
      await page.click('[data-testid="edit-product-button"]');

      // Update title
      await page.fill('[data-testid="product-title"]', 'Updated Product Title');

      // Update price
      await page.fill('[data-testid="product-price"]', '150');

      // Save changes
      await page.click('button:has-text("Save Changes")');

      // Verify success
      await expect(page.locator('text=/Updated|Changes saved/i')).toBeVisible({
        timeout: 10000
      });
    });

    test('should deactivate product listing', async ({ page }) => {
      await page.goto('http://localhost:3000/merchant/products');

      // Click deactivate
      await page.click('[data-testid="deactivate-product-button"]');

      // Confirm deactivation
      await page.click('button:has-text("Confirm")');

      // Verify product marked as inactive
      await expect(page.locator('text=/Deactivated|Inactive/i')).toBeVisible({
        timeout: 5000
      });
    });

    test('should upload product images to storage', async ({ page }) => {
      await page.goto('http://localhost:3000/merchant/products/new');

      // Mock file upload
      await page.setInputFiles('[data-testid="image-upload"]', {
        name: 'test-product.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake image data')
      });

      // Verify upload progress/completion
      await expect(page.locator('text=/Uploading|Upload complete/i')).toBeVisible({
        timeout: 10000
      });
    });

    test('should display blockchain verification status', async ({ page }) => {
      await page.goto('http://localhost:3000/merchant/products');

      // Products should show verification status
      const verifiedBadge = page.locator('[data-testid="blockchain-verified"]');
      const pendingBadge = page.locator('[data-testid="blockchain-pending"]');

      // At least one should be visible
      await expect(verifiedBadge.or(pendingBadge).first()).toBeVisible();
    });

    test('should view sales analytics', async ({ page }) => {
      await page.goto('http://localhost:3000/merchant/analytics');

      // Check for key metrics
      await expect(page.locator('[data-testid="total-sales"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-products"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-views"]')).toBeVisible();
    });
  });

  test.describe('Product variants', () => {
    test('should add product variants', async ({ page }) => {
      // Mock wallet connection
      await page.addInitScript(() => {
        // @ts-ignore
        window.mockWalletConnected = true;
      });

      await page.goto('http://localhost:3000/merchant/products/new');

      // Add variant
      await page.click('button:has-text("Add Variant")');

      // Fill variant details
      await page.fill('[data-testid="variant-name"]', 'Size');
      await page.fill('[data-testid="variant-value"]', 'Large');
      await page.fill('[data-testid="variant-stock"]', '10');

      // Add another variant
      await page.click('button:has-text("Add Variant")');
      await page.fill('[data-testid="variant-name"]:nth-of-type(2)', 'Color');
      await page.fill('[data-testid="variant-value"]:nth-of-type(2)', 'Blue');

      // Submit product
      await page.click('button:has-text("Create Product")');

      // Verify variants saved
      await expect(page.locator('text=/Product created/i')).toBeVisible({
        timeout: 30000
      });
    });
  });

  test.describe('Error handling', () => {
    test('should handle IPFS upload failures gracefully', async ({ page }) => {
      // Mock wallet connection
      await page.addInitScript(() => {
        // @ts-ignore
        window.mockWalletConnected = true;
        // Mock IPFS failure
        // @ts-ignore
        window.mockIPFSFailure = true;
      });

      await page.goto('http://localhost:3000/merchant/products/new');

      // Fill form
      await page.fill('[data-testid="product-title"]', 'Test Product');
      await page.fill('[data-testid="product-price"]', '100');

      // Try to submit
      await page.click('button:has-text("Create Product")');

      // Should show error
      await expect(page.locator('text=/Upload failed|Error uploading/i')).toBeVisible({
        timeout: 10000
      });
    });

    test('should handle blockchain transaction failures', async ({ page }) => {
      await page.addInitScript(() => {
        // @ts-ignore
        window.mockWalletConnected = true;
        // @ts-ignore
        window.mockBlockchainFailure = true;
      });

      await page.goto('http://localhost:3000/merchant/products/new');

      // Fill and submit
      await page.fill('[data-testid="product-title"]', 'Test Product');
      await page.fill('[data-testid="product-price"]', '100');
      await page.click('button:has-text("Create Product")');

      // Should handle blockchain error
      await expect(page.locator('text=/Transaction failed|Blockchain error/i')).toBeVisible({
        timeout: 15000
      });
    });
  });
});

/**
 * Merchant permissions and security
 */
test.describe('Merchant Security', () => {
  test('should only allow product edits by owner', async ({ page }) => {
    // Mock different wallet address
    await page.addInitScript(() => {
      // @ts-ignore
      window.mockWalletAddress = '0xDIFFERENT_ADDRESS';
    });

    // Try to access someone else's product
    await page.goto('http://localhost:3000/merchant/products/someones-product/edit');

    // Should be denied
    await expect(page.locator('text=/Unauthorized|Access denied|Not your product/i')).toBeVisible({
      timeout: 5000
    });
  });

  test('should validate wallet signature', async ({ page }) => {
    // Mock invalid signature
    await page.addInitScript(() => {
      // @ts-ignore
      window.mockInvalidSignature = true;
    });

    await page.goto('http://localhost:3000/merchant/products/new');
    await page.fill('[data-testid="product-title"]', 'Test');
    await page.click('button:has-text("Create Product")');

    // Should reject invalid signature
    await expect(page.locator('text=/Invalid signature|Authentication failed/i')).toBeVisible({
      timeout: 5000
    });
  });
});
