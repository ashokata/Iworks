/**
 * Visual Regression Tests for UI Components
 *
 * These tests capture screenshots of components in different states
 * and compare them against baseline images to detect visual regressions.
 */

import { test, expect } from '@playwright/test';

test.describe('Button Component Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a page that renders buttons (you may need to create a test page)
    await page.goto('/');
  });

  test('Button - Primary variant', async ({ page }) => {
    // Create a test container with the button
    await page.setContent(`
      <div style="padding: 20px; background: white;">
        <button class="inline-flex items-center justify-center rounded-md font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 py-2 px-4">
          Primary Button
        </button>
      </div>
    `);

    await expect(page.locator('button')).toHaveScreenshot('button-primary.png');
  });

  test('Button - Secondary variant', async ({ page }) => {
    await page.setContent(`
      <div style="padding: 20px; background: white;">
        <button class="inline-flex items-center justify-center rounded-md font-medium bg-gray-100 text-gray-900 hover:bg-gray-200 h-10 py-2 px-4">
          Secondary Button
        </button>
      </div>
    `);

    await expect(page.locator('button')).toHaveScreenshot('button-secondary.png');
  });

  test('Button - Danger variant', async ({ page }) => {
    await page.setContent(`
      <div style="padding: 20px; background: white;">
        <button class="inline-flex items-center justify-center rounded-md font-medium bg-red-600 text-white hover:bg-red-700 h-10 py-2 px-4">
          Delete
        </button>
      </div>
    `);

    await expect(page.locator('button')).toHaveScreenshot('button-danger.png');
  });

  test('Button - Disabled state', async ({ page }) => {
    await page.setContent(`
      <div style="padding: 20px; background: white;">
        <button disabled class="inline-flex items-center justify-center rounded-md font-medium bg-blue-600 text-white h-10 py-2 px-4 opacity-50 pointer-events-none">
          Disabled
        </button>
      </div>
    `);

    await expect(page.locator('button')).toHaveScreenshot('button-disabled.png');
  });

  test('Button - Loading state', async ({ page }) => {
    await page.setContent(`
      <div style="padding: 20px; background: white;">
        <button class="inline-flex items-center justify-center rounded-md font-medium bg-blue-600 text-white h-10 py-2 px-4">
          <svg class="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </button>
      </div>
    `);

    // Disable animations for consistent screenshot
    await page.addStyleTag({ content: '* { animation: none !important; }' });

    await expect(page.locator('button')).toHaveScreenshot('button-loading.png');
  });

  test('Button - Small size', async ({ page }) => {
    await page.setContent(`
      <div style="padding: 20px; background: white;">
        <button class="inline-flex items-center justify-center rounded-md font-medium bg-blue-600 text-white h-9 px-3 text-sm">
          Small
        </button>
      </div>
    `);

    await expect(page.locator('button')).toHaveScreenshot('button-small.png');
  });

  test('Button - Large size', async ({ page }) => {
    await page.setContent(`
      <div style="padding: 20px; background: white;">
        <button class="inline-flex items-center justify-center rounded-md font-medium bg-blue-600 text-white h-11 px-8">
          Large
        </button>
      </div>
    `);

    await expect(page.locator('button')).toHaveScreenshot('button-large.png');
  });
});

test.describe('Card Component Visual Tests', () => {
  test('Card - Basic layout', async ({ page }) => {
    await page.setContent(`
      <div style="padding: 20px; background: #f5f5f5;">
        <div style="background: white; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); max-width: 400px;">
          <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Card Title</h3>
          <p style="color: #666;">This is the card content area with some descriptive text.</p>
        </div>
      </div>
    `);

    await expect(page.locator('div').nth(1)).toHaveScreenshot('card-basic.png');
  });

  test('Card - With header and footer', async ({ page }) => {
    await page.setContent(`
      <div style="padding: 20px; background: #f5f5f5;">
        <div style="background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); max-width: 400px;">
          <div style="background: #f9fafb; padding: 16px; border-bottom: 1px solid #e5e7eb;">
            <h3 style="font-size: 18px; font-weight: 600;">Card Header</h3>
          </div>
          <div style="padding: 24px;">
            <p style="color: #666;">Card content goes here.</p>
          </div>
          <div style="background: #f9fafb; padding: 16px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 8px;">
            <button style="padding: 8px 16px; border-radius: 6px; background: #e5e7eb;">Cancel</button>
            <button style="padding: 8px 16px; border-radius: 6px; background: #3b82f6; color: white;">Save</button>
          </div>
        </div>
      </div>
    `);

    await expect(page.locator('div').nth(1)).toHaveScreenshot('card-with-header-footer.png');
  });
});

test.describe('Form Input Visual Tests', () => {
  test('Input - Default state', async ({ page }) => {
    await page.setContent(`
      <div style="padding: 20px; background: white;">
        <div style="max-width: 300px;">
          <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 4px;">
            Email Address
          </label>
          <input
            type="email"
            placeholder="Enter your email"
            style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;"
          />
        </div>
      </div>
    `);

    await expect(page.locator('div').nth(1)).toHaveScreenshot('input-default.png');
  });

  test('Input - Focused state', async ({ page }) => {
    await page.setContent(`
      <div style="padding: 20px; background: white;">
        <div style="max-width: 300px;">
          <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 4px;">
            Email Address
          </label>
          <input
            type="email"
            placeholder="Enter your email"
            style="width: 100%; padding: 8px 12px; border: 2px solid #3b82f6; border-radius: 6px; font-size: 14px; outline: none; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);"
          />
        </div>
      </div>
    `);

    await expect(page.locator('div').nth(1)).toHaveScreenshot('input-focused.png');
  });

  test('Input - Error state', async ({ page }) => {
    await page.setContent(`
      <div style="padding: 20px; background: white;">
        <div style="max-width: 300px;">
          <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 4px;">
            Email Address
          </label>
          <input
            type="email"
            value="invalid-email"
            style="width: 100%; padding: 8px 12px; border: 1px solid #ef4444; border-radius: 6px; font-size: 14px;"
          />
          <p style="color: #ef4444; font-size: 12px; margin-top: 4px;">Please enter a valid email address</p>
        </div>
      </div>
    `);

    await expect(page.locator('div').nth(1)).toHaveScreenshot('input-error.png');
  });

  test('Input - Disabled state', async ({ page }) => {
    await page.setContent(`
      <div style="padding: 20px; background: white;">
        <div style="max-width: 300px;">
          <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 4px; opacity: 0.5;">
            Email Address
          </label>
          <input
            type="email"
            placeholder="Enter your email"
            disabled
            style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; background: #f3f4f6; opacity: 0.6; cursor: not-allowed;"
          />
        </div>
      </div>
    `);

    await expect(page.locator('div').nth(1)).toHaveScreenshot('input-disabled.png');
  });
});

test.describe('Modal/Dialog Visual Tests', () => {
  test('Modal - Confirmation dialog', async ({ page }) => {
    await page.setContent(`
      <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; padding: 16px;">
        <div style="background: white; border-radius: 8px; max-width: 400px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
          <div style="padding: 24px;">
            <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Delete Customer</h3>
            <p style="color: #666; font-size: 14px;">Are you sure you want to delete this customer? This action cannot be undone.</p>
          </div>
          <div style="background: #f9fafb; padding: 16px; display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid #e5e7eb;">
            <button style="padding: 8px 16px; border-radius: 6px; background: #e5e7eb; font-size: 14px;">Cancel</button>
            <button style="padding: 8px 16px; border-radius: 6px; background: #ef4444; color: white; font-size: 14px;">Delete</button>
          </div>
        </div>
      </div>
    `);

    await expect(page).toHaveScreenshot('modal-confirmation.png');
  });
});

test.describe('Table Visual Tests', () => {
  test('Table - Customer list', async ({ page }) => {
    await page.setContent(`
      <div style="padding: 20px; background: white;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
              <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280;">Name</th>
              <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280;">Email</th>
              <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280;">Type</th>
              <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280;">Phone</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px; font-size: 14px;">John Doe</td>
              <td style="padding: 12px; font-size: 14px; color: #6b7280;">john@example.com</td>
              <td style="padding: 12px; font-size: 14px;"><span style="background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 9999px; font-size: 12px;">Residential</span></td>
              <td style="padding: 12px; font-size: 14px; color: #6b7280;">555-1234</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px; font-size: 14px;">ABC Corp</td>
              <td style="padding: 12px; font-size: 14px; color: #6b7280;">contact@abc.com</td>
              <td style="padding: 12px; font-size: 14px;"><span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 9999px; font-size: 12px;">Commercial</span></td>
              <td style="padding: 12px; font-size: 14px; color: #6b7280;">555-5678</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px; font-size: 14px;">Jane Smith</td>
              <td style="padding: 12px; font-size: 14px; color: #6b7280;">jane@example.com</td>
              <td style="padding: 12px; font-size: 14px;"><span style="background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 9999px; font-size: 12px;">Residential</span></td>
              <td style="padding: 12px; font-size: 14px; color: #6b7280;">555-9012</td>
            </tr>
          </tbody>
        </table>
      </div>
    `);

    await expect(page.locator('table')).toHaveScreenshot('table-customer-list.png');
  });
});

test.describe('Badge/Status Visual Tests', () => {
  test('Status badges - All variants', async ({ page }) => {
    await page.setContent(`
      <div style="padding: 20px; background: white;">
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <span style="background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500;">Active</span>
          <span style="background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500;">Pending</span>
          <span style="background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500;">Completed</span>
          <span style="background: #fee2e2; color: #991b1b; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500;">Cancelled</span>
          <span style="background: #e5e7eb; color: #1f2937; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500;">Draft</span>
        </div>
      </div>
    `);

    await expect(page.locator('div').nth(1)).toHaveScreenshot('badges-all-variants.png');
  });
});
