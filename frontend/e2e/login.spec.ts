import { test, expect } from '@playwright/test';

test('login page loads and displays form', async ({ page }) => {
  await page.goto('/login');
  
  // Expect a title "to contain" a substring.
  await expect(page.locator('text=Welcome back')).toBeVisible();

  // Expect the login form inputs to exist
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  
  // Expect a sign in button
  await expect(page.locator('button:has-text("Sign in")')).toBeVisible();
});
