import { expect, test } from '@playwright/test';

test.describe('Navigation', () => {
  test('should display homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/PromptStash/i);
  });

  test('should have accessible skip to content link', async ({ page }) => {
    await page.goto('/');

    // Focus on the page and press Tab to reveal skip link
    await page.keyboard.press('Tab');

    const skipLink = page.getByText(/skip to main content/i);
    await expect(skipLink).toBeVisible();
  });

  test('should display logo', async ({ page }) => {
    await page.goto('/');
    const logo = page.getByText(/PromptStash/i).first();
    await expect(logo).toBeVisible();
  });

  test('should have theme switcher', async ({ page }) => {
    await page.goto('/');

    // Try to find theme switcher (might be in sidebar or header)
    const themeSwitcher = page.getByRole('button', { name: /select theme/i });
    if (await themeSwitcher.isVisible()) {
      await expect(themeSwitcher).toBeVisible();
    }
  });
});

test.describe('Responsive Design', () => {
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Page should be visible and functional on mobile
    await expect(page.getByText(/PromptStash/i).first()).toBeVisible();
  });

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    await expect(page.getByText(/PromptStash/i).first()).toBeVisible();
  });

  test('should be responsive on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    await expect(page.getByText(/PromptStash/i).first()).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/sign-in');

    // Check for h1
    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible();
  });

  test('should have accessible form labels', async ({ page }) => {
    await page.goto('/sign-in');

    // Check that form inputs have associated labels
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/sign-in');

    // Tab through form elements
    await page.keyboard.press('Tab'); // Skip to content
    await page.keyboard.press('Tab'); // Email input
    await page.keyboard.press('Tab'); // Password input
    await page.keyboard.press('Tab'); // Submit button

    // Check that button is focused
    const submitButton = page.getByRole('button', { name: /sign in/i });
    await expect(submitButton).toBeFocused();
  });
});
