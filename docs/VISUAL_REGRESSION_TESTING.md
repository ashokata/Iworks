# Visual Regression Testing Guide

## Overview

Visual regression testing automatically detects unintended visual changes in your UI by comparing screenshots against baseline images. This helps catch CSS bugs, layout issues, and visual regressions before they reach production.

## What We Test

Our visual regression test suite covers:

### Component-Level Tests (`components.visual.spec.ts`)
- **Buttons**: All variants (primary, secondary, danger), states (default, disabled, loading), and sizes
- **Cards**: Basic layout, with headers/footers
- **Form Inputs**: Default, focused, error, and disabled states
- **Modals/Dialogs**: Confirmation dialogs
- **Tables**: Customer list layouts
- **Badges**: All status variants (active, pending, completed, cancelled, draft)

### Page-Level Tests (`pages.visual.spec.ts`)
- **Customer Pages**: List view, create form, detail view, empty states, validation errors
- **Dashboard**: Desktop and mobile views
- **Job Pages**: Create form, list view
- **Login Page**: Desktop and mobile views
- **Responsive Layouts**: Mobile (375x667), Tablet (768x1024), Desktop (1280x720), Large Desktop (1920x1080)
- **Dark Mode**: Dashboard and customer list
- **Loading States**: Skeleton screens and spinners
- **Error States**: 500 errors, 404 pages

## Prerequisites

### Install Playwright Browsers

Before running visual tests, install the required browsers:

```bash
cd apps/web
npx playwright install
```

This downloads Chromium, Firefox, and WebKit browsers used for testing.

### Start the Development Server

Visual tests run against a live development server:

```bash
cd apps/web
npm run dev
```

The server should be running on `http://localhost:3000` (or the port specified in your `.env`).

## Running Visual Tests

### Run All Visual Tests

```bash
cd apps/web
npm run test:visual
```

This runs all visual tests across all configured browsers (Chromium, Firefox, WebKit, mobile browsers, tablet).

### Run Tests in UI Mode

For interactive debugging and step-through:

```bash
npm run test:visual:ui
```

This opens Playwright's UI mode where you can:
- See tests run in real-time
- Pause and step through tests
- Inspect DOM and screenshots
- Debug failures

### Run Tests in Debug Mode

```bash
npm run test:visual:debug
```

Opens tests in debug mode with Playwright Inspector.

### Run Specific Test Files

```bash
npx playwright test tests/visual/components.visual.spec.ts
```

### Run Tests for Specific Browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
npx playwright test --project=mobile-chrome
```

### Run Tests in Headed Mode

See the browser while tests run:

```bash
npx playwright test --headed
```

## First Run: Generating Baseline Screenshots

The first time you run visual tests, Playwright generates baseline screenshots:

```bash
npm run test:visual
```

Baseline screenshots are saved to:
```
apps/web/tests/visual/*.spec.ts-snapshots/
```

These baseline images are committed to version control and used for future comparisons.

## Updating Baseline Screenshots

When you intentionally change the UI, update the baseline screenshots:

```bash
npm run test:visual:update
```

Or for specific tests:

```bash
npx playwright test --update-snapshots tests/visual/components.visual.spec.ts
```

**Important**: Review the updated screenshots carefully before committing to ensure they reflect the intended changes.

## Reviewing Visual Diffs

When a visual test fails, Playwright generates:

1. **Expected**: The baseline screenshot
2. **Actual**: The new screenshot from the test run
3. **Diff**: A visual comparison highlighting differences

### View Results in HTML Report

After a test run:

```bash
npx playwright show-report
```

This opens an HTML report showing:
- Pass/fail status for each test
- Screenshots for failed tests
- Side-by-side comparison of expected vs actual
- Highlighted differences

### View Results in UI Mode

```bash
npm run test:visual:ui
```

Click on failed tests to see:
- Visual diff with highlighted changes
- Expected and actual screenshots
- Ability to accept/reject changes

## Understanding Test Configuration

### Playwright Configuration (`playwright.config.ts`)

Key settings:

```typescript
expect: {
  toHaveScreenshot: {
    maxDiffPixels: 100,    // Allow up to 100 pixels to differ
    threshold: 0.2,        // 20% threshold for pixel difference
    animations: 'disabled', // Disable animations for consistency
  },
}
```

- **maxDiffPixels**: Maximum number of pixels that can differ (accounts for minor rendering differences)
- **threshold**: Percentage threshold for pixel difference (0.0 = exact match, 1.0 = 100% different)
- **animations**: Disabled to prevent timing-based flakiness

### Test Helpers (`helpers.ts`)

Utilities for consistent screenshots:

- `mockLogin(page)`: Mock authentication
- `mockApiResponses(page)`: Mock API calls for consistent data
- `hideDynamicContent(page)`: Hide timestamps and live clocks
- `disableAnimations(page)`: Disable CSS animations
- `setConsistentFonts(page)`: Force consistent font rendering
- `waitForImages(page)`: Wait for all images to load
- `waitForFonts(page)`: Wait for fonts to load
- `preparePageForVisualTest(page, options)`: All-in-one preparation

## Best Practices

### 1. Hide or Mock Dynamic Content

Always hide or mock content that changes between test runs:

```typescript
// Hide timestamps
await page.addStyleTag({
  content: `
    [data-testid="timestamp"],
    .relative-time {
      visibility: hidden;
    }
  `
});

// Or mock with fixed data
await page.route('**/api/customers*', route => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ data: mockCustomers }),
  });
});
```

### 2. Wait for Page to Stabilize

```typescript
await page.goto('/customers');
await page.waitForLoadState('networkidle');
await waitForFonts(page);
await waitForImages(page);
```

### 3. Mask Dynamic Elements

For elements that must be visible but change:

```typescript
await expect(page).toHaveScreenshot('page.png', {
  mask: [
    page.locator('[data-testid="live-clock"]'),
    page.locator('[data-testid="user-avatar"]'),
  ],
});
```

### 4. Use Consistent Viewports

Define viewports in the test:

```typescript
await page.setViewportSize({ width: 1280, height: 720 });
```

Or use predefined viewports from helpers:

```typescript
import { viewports } from './helpers';
await page.setViewportSize(viewports.desktop);
```

### 5. Test Multiple States

Test components in all relevant states:

```typescript
test.describe('Button Component', () => {
  test('Primary variant', async ({ page }) => { ... });
  test('Disabled state', async ({ page }) => { ... });
  test('Loading state', async ({ page }) => { ... });
  test('Small size', async ({ page }) => { ... });
});
```

### 6. Disable Animations

Always disable animations for consistency:

```typescript
await disableAnimations(page);
```

Or in the test:

```typescript
await page.addStyleTag({
  content: '* { animation: none !important; transition: none !important; }'
});
```

### 7. Use Full Page Screenshots for Pages

For full pages, use `fullPage: true`:

```typescript
await expect(page).toHaveScreenshot('customer-list.png', {
  fullPage: true,
});
```

For components, use element screenshots:

```typescript
await expect(page.locator('button')).toHaveScreenshot('button.png');
```

## Troubleshooting

### Tests Fail on First Run

**Problem**: "Error: A snapshot doesn't exist at..."

**Solution**: This is expected. Run with `--update-snapshots` to generate baselines:

```bash
npm run test:visual:update
```

### Flaky Tests (Random Failures)

**Problem**: Tests pass/fail inconsistently

**Solutions**:
1. Ensure animations are disabled
2. Wait for network idle: `await page.waitForLoadState('networkidle')`
3. Wait for fonts: `await waitForFonts(page)`
4. Increase timeout: `test.setTimeout(60000)`
5. Hide/mock dynamic content
6. Increase `maxDiffPixels` threshold if minor differences are acceptable

### Different Results on Different Machines

**Problem**: Screenshots differ on macOS vs Windows vs Linux

**Solution**:
1. Use CI/CD to generate consistent baselines (Ubuntu recommended)
2. Use Docker for consistent rendering environment
3. Increase threshold slightly to account for OS rendering differences
4. Use `deviceScaleFactor: 1` in config to normalize DPI

### Fonts Render Differently

**Problem**: Font rendering varies between environments

**Solutions**:
1. Use `setConsistentFonts(page)` helper
2. Load web fonts explicitly
3. Use system fonts that are available everywhere
4. Consider using Docker with consistent font installation

### Screenshots Include Scrollbars

**Problem**: Scrollbars visible in screenshots

**Solution**: Hide scrollbars with CSS:

```typescript
await page.addStyleTag({
  content: `
    ::-webkit-scrollbar { display: none; }
    * { scrollbar-width: none; }
  `
});
```

### Test Timeout

**Problem**: "Test timeout of 30000ms exceeded"

**Solutions**:
1. Increase timeout: `test.setTimeout(60000)`
2. Check if server is running
3. Check for network issues
4. Use `waitForLoadState('networkidle')` instead of fixed waits

## CI/CD Integration

Visual tests run automatically in GitHub Actions on every pull request.

### CI Configuration (`.github/workflows/ci.yml`)

```yaml
- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run Visual Tests
  run: npm run test:visual

- name: Upload Playwright Report
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: apps/web/playwright-report/
```

### Reviewing CI Failures

1. Go to GitHub Actions run
2. Download "playwright-report" artifact
3. Extract and open `index.html`
4. Review visual diffs
5. If changes are intentional, update baselines locally and push

## File Structure

```
apps/web/
├── playwright.config.ts              # Playwright configuration
├── tests/
│   └── visual/
│       ├── components.visual.spec.ts # Component visual tests
│       ├── pages.visual.spec.ts      # Page visual tests
│       ├── helpers.ts                # Test utilities
│       └── *.spec.ts-snapshots/      # Baseline screenshots (committed)
│           ├── button-primary-chromium.png
│           ├── customer-list-desktop-firefox.png
│           └── ...
├── test-results/                     # Test artifacts (gitignored)
│   ├── actual/                       # Failed test screenshots
│   ├── expected/                     # Expected screenshots
│   └── diff/                         # Visual diffs
└── playwright-report/                # HTML report (gitignored)
```

## Writing New Visual Tests

### Component Test Example

```typescript
import { test, expect } from '@playwright/test';

test('Button - Primary variant', async ({ page }) => {
  await page.setContent(`
    <div style="padding: 20px; background: white;">
      <button class="btn-primary">
        Click Me
      </button>
    </div>
  `);

  await expect(page.locator('button')).toHaveScreenshot('button-primary.png');
});
```

### Page Test Example

```typescript
import { test, expect } from '@playwright/test';
import { preparePageForVisualTest } from './helpers';

test('Customer List Page', async ({ page }) => {
  await preparePageForVisualTest(page, {
    mockAuth: true,
    mockApis: true,
    hideDynamic: true,
    disableAnimations: true,
  });

  await page.goto('/customers');
  await page.waitForLoadState('networkidle');

  await expect(page).toHaveScreenshot('customer-list.png', {
    fullPage: true,
  });
});
```

### Responsive Test Example

```typescript
const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 720 },
];

for (const viewport of viewports) {
  test(`Homepage - ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot(`homepage-${viewport.name}.png`);
  });
}
```

## Coverage

Current visual test coverage:

- **8 component variants** (buttons, cards, inputs, modals, tables, badges)
- **15+ page screenshots** (customers, jobs, dashboard, login, 404)
- **8 responsive layouts** (4 viewports × 2 pages)
- **2 dark mode screenshots**
- **3 state tests** (loading, empty, error)
- **6 browsers/devices** (Chromium, Firefox, WebKit, mobile Chrome, mobile Safari, tablet)

**Total: 100+ visual regression tests** across all browsers and viewports.

## Maintenance

### When to Update Baselines

Update baselines when:
- ✅ You intentionally changed UI styling
- ✅ You updated component library (e.g., Tailwind CSS)
- ✅ You fixed a visual bug
- ✅ You changed layout or spacing

Don't update baselines when:
- ❌ Tests are flaky (fix the flakiness instead)
- ❌ You're unsure why screenshots changed
- ❌ Changes are unintentional

### Review Process

1. Run tests locally: `npm run test:visual`
2. If failures occur, review in UI mode: `npm run test:visual:ui`
3. Verify changes are intentional
4. Update baselines: `npm run test:visual:update`
5. Commit updated screenshots with descriptive message
6. Create PR with before/after screenshots in description

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Visual Comparisons Guide](https://playwright.dev/docs/test-snapshots)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [CI/CD Integration](https://playwright.dev/docs/ci)

## Support

For questions or issues:
1. Check this guide's Troubleshooting section
2. Review Playwright documentation
3. Check existing test files for examples
4. Create an issue in the project repository
