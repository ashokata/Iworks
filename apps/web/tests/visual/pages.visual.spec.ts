/**
 * Visual Regression Tests for Key Pages
 *
 * These tests capture full-page screenshots to detect
 * layout changes and visual regressions across pages.
 */

import { test, expect } from '@playwright/test';

// Helper to login (mock auth for visual tests)
async function mockLogin(page) {
  // Mock authentication context
  await page.addInitScript(() => {
    window.localStorage.setItem('isAuthenticated', 'true');
    window.localStorage.setItem('user', JSON.stringify({
      id: 'test-user',
      email: 'test@example.com',
      name: 'Test User'
    }));
  });
}

test.describe('Customer Pages Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await mockLogin(page);
  });

  test('Customer List Page - Desktop', async ({ page }) => {
    await page.goto('/customers');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Hide dynamic elements that change (dates, etc.)
    await page.addStyleTag({
      content: `
        [data-testid="timestamp"],
        .relative-time {
          visibility: hidden;
        }
      `
    });

    // Take full page screenshot
    await expect(page).toHaveScreenshot('customer-list-desktop.png', {
      fullPage: true,
      mask: [
        // Mask elements with dynamic content
        page.locator('[data-testid="timestamp"]').first(),
      ],
    });
  });

  test('Customer List Page - Empty State', async ({ page }) => {
    // Mock empty state
    await page.route('**/api/customers*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], total: 0 }),
      });
    });

    await page.goto('/customers');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('customer-list-empty.png', {
      fullPage: true,
    });
  });

  test('Customer Create Page - Desktop', async ({ page }) => {
    await page.goto('/customers/new');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('customer-create-desktop.png', {
      fullPage: true,
    });
  });

  test('Customer Create Page - Validation Errors', async ({ page }) => {
    await page.goto('/customers/new');
    await page.waitForLoadState('networkidle');

    // Submit form without filling required fields
    const submitButton = page.getByRole('button', { name: /save|create|submit/i });
    await submitButton.click();

    // Wait for validation errors to appear
    await page.waitForSelector('text=/required|error/i', { timeout: 2000 });

    await expect(page).toHaveScreenshot('customer-create-validation-errors.png', {
      fullPage: true,
    });
  });

  test('Customer Detail Page - Desktop', async ({ page }) => {
    // Mock customer data
    await page.route('**/api/customers/*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          customer: {
            id: 'customer-123',
            customerNumber: 'CUST-000001',
            firstName: 'John',
            lastName: 'Doe',
            type: 'RESIDENTIAL',
            email: 'john@example.com',
            mobilePhone: '555-1234',
            addresses: [
              {
                id: 'addr-1',
                street: '123 Main St',
                city: 'New York',
                state: 'NY',
                zip: '10001',
                isPrimary: true,
              }
            ],
          }
        }),
      });
    });

    await page.goto('/customers/view/customer-123');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('customer-detail-desktop.png', {
      fullPage: true,
    });
  });
});

test.describe('Dashboard Page Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await mockLogin(page);
  });

  test('Dashboard - Desktop View', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Hide dynamic content
    await page.addStyleTag({
      content: `
        [data-testid="live-time"],
        [data-testid="live-date"] {
          visibility: hidden;
        }
      `
    });

    await expect(page).toHaveScreenshot('dashboard-desktop.png', {
      fullPage: true,
    });
  });

  test('Dashboard - Mobile View', async ({ page, viewport }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('dashboard-mobile.png', {
      fullPage: true,
    });
  });
});

test.describe('Job Pages Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await mockLogin(page);
  });

  test('Job Create Page - Desktop', async ({ page }) => {
    await page.goto('/jobs/new');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('job-create-desktop.png', {
      fullPage: true,
    });
  });

  test('Job List Page - Desktop', async ({ page }) => {
    await page.goto('/jobs');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('job-list-desktop.png', {
      fullPage: true,
    });
  });
});

test.describe('Login Page Visual Tests', () => {
  test('Login Page - Desktop', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('login-desktop.png', {
      fullPage: true,
    });
  });

  test('Login Page - Mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('login-mobile.png', {
      fullPage: true,
    });
  });
});

test.describe('Responsive Layout Tests', () => {
  test.beforeEach(async ({ page }) => {
    await mockLogin(page);
  });

  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 720 },
    { name: 'large-desktop', width: 1920, height: 1080 },
  ];

  for (const viewport of viewports) {
    test(`Customer List - ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      await page.goto('/customers');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot(`customer-list-${viewport.name}.png`, {
        fullPage: false, // Just viewport
      });
    });
  }
});

test.describe('Dark Mode Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await mockLogin(page);
  });

  test('Dashboard - Dark Mode', async ({ page }) => {
    // Enable dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addInitScript(() => {
      document.documentElement.classList.add('dark');
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('dashboard-dark-mode.png', {
      fullPage: true,
    });
  });

  test('Customer List - Dark Mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addInitScript(() => {
      document.documentElement.classList.add('dark');
    });

    await page.goto('/customers');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('customer-list-dark-mode.png', {
      fullPage: true,
    });
  });
});

test.describe('Loading States Visual Tests', () => {
  test('Customer List - Loading State', async ({ page }) => {
    await mockLogin(page);

    // Delay API response to capture loading state
    await page.route('**/api/customers*', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [], total: 0 }),
        });
      }, 5000); // 5 second delay
    });

    await page.goto('/customers');

    // Wait for loading spinner/skeleton
    await page.waitForSelector('[data-testid="loading"]', { timeout: 1000 }).catch(() => {});

    await expect(page).toHaveScreenshot('customer-list-loading.png');
  });
});

test.describe('Error States Visual Tests', () => {
  test('Customer List - Error State', async ({ page }) => {
    await mockLogin(page);

    // Mock API error
    await page.route('**/api/customers*', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/customers');
    await page.waitForLoadState('networkidle');

    // Wait for error message
    await page.waitForSelector('text=/error|failed/i', { timeout: 2000 }).catch(() => {});

    await expect(page).toHaveScreenshot('customer-list-error.png', {
      fullPage: true,
    });
  });

  test('404 Page', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('404-page.png', {
      fullPage: true,
    });
  });
});
