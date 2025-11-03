import { expect, test } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display sign in page', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });

  test('should display sign up page', async ({ page }) => {
    await page.goto('/sign-up');
    await expect(page.getByRole('heading', { name: /create.*account/i })).toBeVisible();
  });

  test('should navigate between sign in and sign up pages', async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByRole('link', { name: /sign up/i }).click();
    await expect(page).toHaveURL(/\/sign-up/);
    await expect(page.getByRole('heading', { name: /create.*account/i })).toBeVisible();

    await page.getByRole('link', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show validation error
    await expect(page.getByText(/invalid.*email/i)).toBeVisible();
  });

  test('should show error for empty form submission', async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show required field errors
    await expect(page.getByText(/required/i).first()).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/sign-in');
    const passwordInput = page.getByLabel(/password/i);

    // Initially should be password type
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click show/hide button
    await page.getByRole('button', { name: /show password/i }).click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    await page.getByRole('button', { name: /hide password/i }).click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should display forgot password link', async ({ page }) => {
    await page.goto('/sign-in');
    const forgotPasswordLink = page.getByRole('link', { name: /forgot.*password/i });
    await expect(forgotPasswordLink).toBeVisible();
    await expect(forgotPasswordLink).toHaveAttribute('href', /\/forgot-password/);
  });

  test('should display Google sign in button', async ({ page }) => {
    await page.goto('/sign-in');
    const googleButton = page.getByRole('button', { name: /continue with google/i });
    await expect(googleButton).toBeVisible();
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to sign in when accessing protected routes without auth', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('should redirect to sign in when accessing profile without auth', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('should redirect to sign in when accessing settings without auth', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
