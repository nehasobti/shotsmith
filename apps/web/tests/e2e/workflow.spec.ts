import { test, expect } from '@playwright/test';

test.describe('ShopShot AI E2E Workflow', () => {
  const timestamp = Date.now();
  const testEmail = `test_${timestamp}@shopshot.dev`;
  const testPassword = 'Password123!';

  test('full lifecycle: register -> landing -> studio -> ad copy -> gallery export', async ({ page }) => {
    // 1. Visit landing page
    await page.goto('/');
    await expect(page).toHaveTitle(/ShopShot/i);
    await expect(page.locator('h1')).toContainText('luxury commercial assets');

    // 2. Register new account
    await page.goto('/register');
    await page.fill('#name', 'Test Founder');
    await page.fill('#email', testEmail);
    await page.fill('#password', testPassword);
    await page.click('button[type="submit"]');

    // 3. Navigate to projects dashboard
    await page.waitForURL('**/projects');
    await expect(page.locator('text=My Projects')).toBeVisible();

    // 4. Create new project
    await page.click('text=New Project');
    await page.fill('input[placeholder*="Ceramic"]', `E2E Tumbler ${timestamp}`);
    await page.click('button:has-text("Create Project")');

    // 5. Arrive at studio
    await page.waitForURL(/\/projects\/[a-f0-9-]+/);
    await expect(page.locator('text=Studio')).toBeVisible();

    // 6. Navigate to Ad Copy Studio
    await page.click('a:has-text("Ad Copy")');
    await page.waitForURL(/\/projects\/[a-f0-9-]+\/copy/);
    await expect(page.locator('text=Copy Parameters')).toBeVisible();

    // 7. Navigate to Gallery
    await page.click('a:has-text("Gallery")');
    await page.waitForURL(/\/projects\/[a-f0-9-]+\/gallery/);
    await expect(page.locator('text=Gallery')).toBeVisible();
  });
});
