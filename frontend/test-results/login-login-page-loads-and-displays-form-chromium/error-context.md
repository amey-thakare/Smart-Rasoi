# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login.spec.ts >> login page loads and displays form
- Location: e2e/login.spec.ts:3:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Welcome back')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('text=Welcome back') with timeout 5000ms
  - waiting for locator('text=Welcome back')

```

```yaml
- text: kaggle
- heading "Welcome!" [level=1]
- button "Sign In"
- button "Register"
- button "G Register with Google"
- button "◉ Register with GitHub"
- button "✉ Register with Email"
- text: or
- textbox "Email"
- textbox "Password"
- button "Create account"
- paragraph:
  - text: Have an account?
  - button "Sign in"
- paragraph: When you link your Google account, Kaggle collects certain information stored in that account that you have configured to make available. By linking your accounts, you authorize Kaggle to access and use your account on the third party service in connection with your use of kaggle.com.
- button "Contact Us / Support"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('login page loads and displays form', async ({ page }) => {
  4  |   await page.goto('/login');
  5  |   
  6  |   // Expect a title "to contain" a substring.
> 7  |   await expect(page.locator('text=Welcome back')).toBeVisible();
     |                                                   ^ Error: expect(locator).toBeVisible() failed
  8  | 
  9  |   // Expect the login form inputs to exist
  10 |   await expect(page.locator('input[type="email"]')).toBeVisible();
  11 |   await expect(page.locator('input[type="password"]')).toBeVisible();
  12 |   
  13 |   // Expect a sign in button
  14 |   await expect(page.locator('button:has-text("Sign in")')).toBeVisible();
  15 | });
  16 | 
```