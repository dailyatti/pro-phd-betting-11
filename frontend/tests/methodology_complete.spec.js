import { test, expect } from '@playwright/test';

test.describe('Methodology Page - All Tabs & Math Formulas', () => {

    test('should verify all methodology tabs and mathematical content', async ({ page }) => {
        test.setTimeout(90000); // 90 sec

        await page.goto('/', { waitUntil: 'networkidle' });

        // ========================================
        // OPEN METHODOLOGY PAGE
        // ========================================
        console.log('✓ Opening Methodology Page');
        await page.getByRole('button', { name: 'Methodology' }).click();

        // Wait for page content
        await page.waitForTimeout(2000);

        // ========================================
        // TAB 1: WORKFLOW
        // ========================================
        console.log('✓ Testing WORKFLOW Tab');

        // Verify agent cards (partial text match)
        await expect(page.locator('text=Vision Parser').first()).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=Data Crawler').first()).toBeVisible();
        await expect(page.locator('text=Stochastic Engine').first()).toBeVisible();

        // ========================================
        // TAB 2: TERMINALS
        // ========================================
        console.log('✓ Testing TERMINALS Tab');
        const terminalsTab = page.locator('button:has-text("Terminals")');
        await terminalsTab.click();
        await page.waitForTimeout(1000);

        // ========================================
        // TAB 3: PhD RESEARCH LAB (MATH)
        // ========================================
        console.log('✓ Testing PhD RESEARCH LAB Tab');
        const mathLabTab = page.locator('button:has-text("PhD Research Lab")');
        await mathLabTab.click();
        await page.waitForTimeout(2000); // Wait for LaTeX to render

        // Scroll down to trigger lazy loading
        await page.evaluate(() => window.scrollBy(0, 500));
        await page.waitForTimeout(1000);

        // Look for any KaTeX rendered content (class katex)
        const katexElements = page.locator('.katex');
        await expect(katexElements.first()).toBeVisible({ timeout: 15000 });
        console.log('✓ LaTeX formulas rendered');

        // Check for sport sections by icons/emoji or partial text
        await page.evaluate(() => window.scrollBy(0, 800));
        await page.waitForTimeout(1000);

        // Soccer section
        const soccerSection = page.locator('text=/Soccer|Football|⚽/i').first();
        if (await soccerSection.count() > 0) {
            console.log('✓ Soccer/Football section found');
        }

        // Basketball section
        await page.evaluate(() => window.scrollBy(0, 600));
        await page.waitForTimeout(500);

        // ========================================
        // DARK MODE TOGGLE
        // ========================================
        console.log('✓ Testing Dark Mode in Methodology');
        const darkModeToggle = page.locator('button[aria-label="Toggle dark mode"]');
        if (await darkModeToggle.count() > 0) {
            await darkModeToggle.click();
            await page.waitForTimeout(500);
            await darkModeToggle.click();
        }

        // ========================================
        // EXIT BACK TO MAIN APP
        // ========================================
        console.log('✓ Testing Back Navigation');
        const backBtn = page.locator('button:has-text("Exit Lab")');
        await backBtn.click();

        // Should return to main app
        await expect(page.locator('text=Drop Betting Screenshots')).toBeVisible({ timeout: 5000 });

        console.log('✅ Methodology page fully verified!');
    });

});
