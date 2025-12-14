/**
 * Visual Testing Helpers
 *
 * Utility functions for visual regression tests
 */

import { Page } from '@playwright/test';

/**
 * Mock user authentication for visual tests
 */
export async function mockLogin(page: Page, user = {
  id: 'test-user',
  email: 'test@example.com',
  name: 'Test User',
  tenantId: 'test-tenant',
}) {
  await page.addInitScript((userData) => {
    window.localStorage.setItem('isAuthenticated', 'true');
    window.localStorage.setItem('user', JSON.stringify(userData));
  }, user);
}

/**
 * Mock API responses for consistent visual tests
 */
export async function mockApiResponses(page: Page) {
  // Mock customer list
  await page.route('**/api/customers*', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          {
            id: 'cust-1',
            customerNumber: 'CUST-000001',
            firstName: 'John',
            lastName: 'Doe',
            type: 'RESIDENTIAL',
            email: 'john@example.com',
            mobilePhone: '555-1234',
          },
          {
            id: 'cust-2',
            customerNumber: 'CUST-000002',
            companyName: 'ABC Corp',
            type: 'COMMERCIAL',
            email: 'contact@abc.com',
            mobilePhone: '555-5678',
          },
        ],
        total: 2,
      }),
    });
  });

  // Mock job list
  await page.route('**/api/jobs*', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          {
            id: 'job-1',
            jobNumber: 'JOB-000001',
            title: 'HVAC Repair',
            status: 'SCHEDULED',
            priority: 'HIGH',
            scheduledStart: '2025-12-20T09:00:00Z',
          },
        ],
        total: 1,
      }),
    });
  });
}

/**
 * Hide dynamic content that changes between test runs
 */
export async function hideDynamicContent(page: Page) {
  await page.addStyleTag({
    content: `
      [data-testid="timestamp"],
      [data-testid="live-time"],
      [data-testid="live-date"],
      .relative-time,
      .live-clock {
        visibility: hidden !important;
      }
    `
  });
}

/**
 * Disable animations for consistent screenshots
 */
export async function disableAnimations(page: Page) {
  await page.addStyleTag({
    content: `
      *,
      *::before,
      *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `
  });
}

/**
 * Set consistent fonts to avoid rendering differences
 */
export async function setConsistentFonts(page: Page) {
  await page.addStyleTag({
    content: `
      * {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      }
    `
  });
}

/**
 * Wait for all images to load
 */
export async function waitForImages(page: Page) {
  await page.evaluate(() => {
    const images = Array.from(document.images);
    return Promise.all(
      images
        .filter(img => !img.complete)
        .map(img => new Promise(resolve => {
          img.onload = img.onerror = resolve;
        }))
    );
  });
}

/**
 * Wait for fonts to load
 */
export async function waitForFonts(page: Page) {
  await page.evaluate(() => document.fonts.ready);
}

/**
 * Prepare page for visual testing
 * Combines multiple helpers for consistent screenshots
 */
export async function preparePageForVisualTest(page: Page, options: {
  mockAuth?: boolean;
  mockApis?: boolean;
  hideDynamic?: boolean;
  disableAnimations?: boolean;
} = {}) {
  const {
    mockAuth = true,
    mockApis = true,
    hideDynamic = true,
    disableAnimations: disableAnims = true,
  } = options;

  if (mockAuth) {
    await mockLogin(page);
  }

  if (mockApis) {
    await mockApiResponses(page);
  }

  if (hideDynamic) {
    await hideDynamicContent(page);
  }

  if (disableAnims) {
    await disableAnimations(page);
  }

  await setConsistentFonts(page);
  await waitForFonts(page);
}

/**
 * Take a screenshot of a specific element
 */
export async function screenshotElement(page: Page, selector: string, filename: string) {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible' });
  return element.screenshot({ path: filename });
}

/**
 * Create test data for consistent visual tests
 */
export const mockData = {
  customers: [
    {
      id: 'cust-1',
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
    },
    {
      id: 'cust-2',
      customerNumber: 'CUST-000002',
      companyName: 'ABC Corporation',
      type: 'COMMERCIAL',
      email: 'contact@abc.com',
      mobilePhone: '555-5678',
      addresses: [],
    },
  ],
  jobs: [
    {
      id: 'job-1',
      jobNumber: 'JOB-000001',
      title: 'HVAC Repair',
      status: 'SCHEDULED',
      priority: 'HIGH',
      scheduledStart: '2025-12-20T09:00:00Z',
      scheduledEnd: '2025-12-20T11:00:00Z',
    },
    {
      id: 'job-2',
      jobNumber: 'JOB-000002',
      title: 'Plumbing Fix',
      status: 'IN_PROGRESS',
      priority: 'NORMAL',
      scheduledStart: '2025-12-19T14:00:00Z',
      scheduledEnd: '2025-12-19T16:00:00Z',
    },
  ],
};

/**
 * Common viewport sizes for responsive testing
 */
export const viewports = {
  mobile: { width: 375, height: 667 },
  mobileLandscape: { width: 667, height: 375 },
  tablet: { width: 768, height: 1024 },
  tabletLandscape: { width: 1024, height: 768 },
  desktop: { width: 1280, height: 720 },
  desktopLarge: { width: 1920, height: 1080 },
  desktop4k: { width: 3840, height: 2160 },
};

/**
 * Mock different loading states
 */
export async function mockLoadingState(page: Page, endpoint: string, delayMs: number = 3000) {
  await page.route(endpoint, async route => {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [], total: 0 }),
    });
  });
}

/**
 * Mock error state
 */
export async function mockErrorState(page: Page, endpoint: string, errorCode: number = 500) {
  await page.route(endpoint, route => {
    route.fulfill({
      status: errorCode,
      contentType: 'application/json',
      body: JSON.stringify({
        error: errorCode === 404 ? 'Not Found' : 'Internal Server Error',
        message: 'An error occurred',
      }),
    });
  });
}
