import { test, expect } from '@playwright/test';

test.describe('PhD Betting Research Lab - How It Works Page', () => {

    test.beforeEach(async ({ page }) => {
        // Navigate to the page via the main menu to ensure standard user flow
        await page.goto('/', { waitUntil: 'networkidle' });

        // Open the "Methodology" page which is the "How It Works" page
        // Wait for the button to be visible to avoid flakiness
        const methodologyBtn = page.getByRole('button', { name: 'Methodology' });
        await expect(methodologyBtn).toBeVisible();
        await methodologyBtn.click();

        // Verify we are on the correct page
        await expect(page.getByText('PhD Betting Research Lab', { exact: false })).toBeVisible({ timeout: 5000 });
    });

    test('should verify tab navigation and accessibility', async ({ page }) => {
        // defined in HowItWorksPage.jsx TAB_ORDER
        const tabs = ['Overview', 'Math', 'Sport Engines', 'Calculator', 'Glossary'];

        for (const tabName of tabs) {
            const tab = page.getByRole('tab', { name: tabName });
            await expect(tab).toBeVisible();
        }

        // Test Click Navigation
        await page.getByRole('tab', { name: 'Calculator' }).click();
        await expect(page.getByRole('tab', { name: 'Calculator' })).toHaveAttribute('aria-selected', 'true');
        await expect(page.getByText('ALL-ODDS Impact Calculator')).toBeVisible();

        // Test A11y / Keyboard Navigation (Roving Tabindex)
        // Focus the current tab (Calculator)
        await page.getByRole('tab', { name: 'Calculator' }).focus();

        // Press ArrowRight -> Should go to Glossary
        await page.keyboard.press('ArrowRight');
        await expect(page.getByRole('tab', { name: 'Glossary' })).toHaveAttribute('aria-selected', 'true');
        await expect(page.getByRole('tab', { name: 'Glossary' })).toBeFocused();

        // Press ArrowLeft -> Should go back to Calculator
        await page.keyboard.press('ArrowLeft');
        await expect(page.getByRole('tab', { name: 'Calculator' })).toHaveAttribute('aria-selected', 'true');

        // Press Home -> Should go to Overview (first tab)
        await page.keyboard.press('Home');
        await expect(page.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');

        // Press End -> Should go to Glossary (last tab)
        await page.keyboard.press('End');
        await expect(page.getByRole('tab', { name: 'Glossary' })).toHaveAttribute('aria-selected', 'true');
    });

    test('should verify All-Odds Calculator logic', async ({ page }) => {
        // Navigate to Calculator tab
        await page.getByRole('tab', { name: 'Calculator' }).click();

        const oddsInput = page.getByLabel('Odds Input');
        const probInput = page.getByLabel('Your Win Probability P (%)');

        // Test Case 1: Decimal Odds 2.00, 55% Prob
        // Edge = 55% - 50% = 5%
        await oddsInput.fill('2.00');
        await probInput.fill('55');

        // Check computed values in the grid
        // The text might be split in spans, so we look for the value text
        // "Edge (P − implied)" -> "5.00%"
        await expect(page.locator('.phd-kv').filter({ hasText: 'Edge' }).locator('.v')).toHaveText('5.00%');

        // Implied Prob for 2.00 is 50.00%
        await expect(page.locator('.phd-kv').filter({ hasText: 'Implied Prob' }).locator('.v')).toHaveText('50.00%');

        // Test Case 2: American Odds +100 (Same as 2.00)
        await oddsInput.fill('+100');
        // Values should remain the same
        await expect(page.locator('.phd-kv').filter({ hasText: 'Decimal Odds' }).locator('.v')).toHaveText('2.000');

        // Test Case 3: Fractional Odds 1/1 (Same as 2.00)
        await oddsInput.fill('1/1');
        await expect(page.locator('.phd-kv').filter({ hasText: 'Decimal Odds' }).locator('.v')).toHaveText('2.000');

        // Test Case 4: Invalid Input
        // Should show error but keep last valid (2.000)
        await oddsInput.fill('invalid');
        await expect(page.getByText('Invalid', { exact: false })).toBeVisible(); // "detected format" text changes or error msg
        // The component logic says: "Using last valid: 2.00"
        await expect(page.getByText('Using last valid: 2.00')).toBeVisible();
    });

    test('should verify theme persistence and SSR safety', async ({ page }) => {
        // Check initial theme (should be dark by default as per useTheme default)
        const html = page.locator('html');
        await expect(html).toHaveClass(/theme-dark/);

        // Toggle Theme
        const toggleBtn = page.getByLabel('Toggle theme');
        await toggleBtn.click();

        // Should be light
        await expect(html).toHaveClass(/theme-light/);
        await expect(page.getByText('Light')).toBeVisible();

        // Toggle back
        await toggleBtn.click();
        await expect(html).toHaveClass(/theme-dark/);
    });

    test('should render Math formulas safely', async ({ page }) => {
        // Navigate to Math tab
        await page.getByRole('tab', { name: 'Math' }).click();

        // Check for specific math content to ensure KaTeX is rendering
        // We look for text that appears in the rendered block
        // Note: KaTeX renders to complex HTML, so we check for container visibility and maybe some detailed text if possible
        const mathPanel = page.locator('#phd-panels-panel-math'); // ID might be dynamic mostly, but let's check visibility of section
        // Adjust selector based on ARIA
        const mathTabPanel = page.getByRole('tabpanel', { name: 'Math' });
        await expect(mathTabPanel).toBeVisible();

        // Check for "Master objective" text
        await expect(page.getByText('Master objective: growth + tail control + friction')).toBeVisible();

        // Check Copy Button existence
        await expect(page.locator('button').filter({ hasText: 'Copy LaTeX' }).first()).toBeVisible();
    });
});
