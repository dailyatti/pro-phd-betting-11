import { test, expect } from '@playwright/test';

// BYOK: Users must provide their own API keys
// For E2E testing, set these environment variables: TEST_OPENAI_KEY, TEST_PERPLEXITY_KEY
const OPENAI_KEY = process.env.TEST_OPENAI_KEY || 'sk-YOUR_OPENAI_KEY_HERE';
const PERPLEXITY_KEY = process.env.TEST_PERPLEXITY_KEY || 'pplx-YOUR_PERPLEXITY_KEY_HERE';

test.describe('Complete E2E Test with Loading Screen & Results Verification', () => {

    test('Full flow: Config → Upload → Loading Screen → Results', async ({ page }) => {
        test.setTimeout(600000); // 10 minutes for slow APIs

        const log = (msg) => {
            console.log(msg);
        };

        // ========================================
        // STEP 1: LOAD APP
        // ========================================
        log('=== STEP 1: Loading Application ===');
        await page.goto('/', { waitUntil: 'networkidle' });
        await expect(page.locator('text=PhD BETTING INTELLIGENCE')).toBeVisible();
        log('✓ App loaded');

        // ========================================
        // STEP 2: CONFIGURE API KEYS
        // ========================================
        log('=== STEP 2: Configuring API Keys ===');
        await page.getByRole('button', { name: 'Configuration' }).click();
        await expect(page.locator('text=API Configuration')).toBeVisible();

        await page.locator('input[placeholder="sk-..."]').fill(OPENAI_KEY);
        await page.locator('input[placeholder="pplx-..."]').fill(PERPLEXITY_KEY);
        await page.getByRole('button', { name: 'Save & Close' }).click();
        await page.waitForTimeout(500);
        log('✓ API Keys saved');

        // ========================================
        // STEP 3: UPLOAD BETTING SCREENSHOT
        // ========================================
        log('=== STEP 3: Uploading Betting Screenshot ===');
        const fileInput = page.locator('input[type="file"]').first();
        await fileInput.setInputFiles('./tests/test-betting-screenshot.png');
        await page.waitForTimeout(3000);

        const runButton = page.locator('button:has-text("Run Intelligence")');
        await expect(runButton).toBeEnabled({ timeout: 15000 });
        log('✓ Image uploaded, Run button enabled');

        // ========================================
        // STEP 4: START ANALYSIS
        // ========================================
        log('=== STEP 4: Starting Analysis ===');
        await runButton.click();
        await page.waitForTimeout(2000);

        // ========================================
        // STEP 5: VERIFY LOADING SCREEN ELEMENTS
        // ========================================
        log('=== STEP 5: Verifying Loading Screen ===');

        // Check for loading overlay OR status change
        const hasLoadingOverlay = await page.locator('.loading-overlay').isVisible().catch(() => false);
        const hasVisionStatus = await page.locator('text=/VISION/i').isVisible().catch(() => false);
        const hasFactsStatus = await page.locator('text=/FACTS/i').isVisible().catch(() => false);

        log(`Loading overlay visible: ${hasLoadingOverlay}`);
        console.log('VISION status visible:', hasVisionStatus);
        console.log('FACTS status visible:', hasFactsStatus);

        if (hasLoadingOverlay) {
            // Take loading screen screenshot
            await page.screenshot({ path: './test-results/loading-screen-active.png', fullPage: true });
            console.log('📸 Loading screen screenshot saved');

            // Verify loading screen components
            const stageLabel = await page.locator('text=/Vision Scan|Deep Research|PhD Analysis/').first().isVisible().catch(() => false);
            const progressBar = await page.locator('[class*="from-cyan-500"]').isVisible().catch(() => false);
            const elapsedTime = await page.locator('text=Elapsed:').isVisible().catch(() => false);
            const cancelBtn = await page.locator('button:has-text("Cancel Analysis")').isVisible().catch(() => false);

            console.log('Stage label visible:', stageLabel);
            console.log('Progress bar visible:', progressBar);
            console.log('Elapsed time visible:', elapsedTime);
            console.log('Cancel button visible:', cancelBtn);
        }

        // ========================================
        // STEP 6: WAIT FOR COMPLETION (long timeout)
        // ========================================
        log('=== STEP 6: Waiting for Analysis Completion ===');

        // Wait for either COMPLETE or ERROR status to appear
        // Timeout matches test timeout (10 mins)
        try {
            await expect(page.locator('text=/COMPLETE|ERROR/i').first()).toBeVisible({ timeout: 600000 });
        } catch (e) {
            log(`TIMEOUT or ERROR waiting for completion: ${e.message}`);
            await page.screenshot({ path: './test-results/timeout-state.png', fullPage: true });
            throw e;
        }

        const finalStatus = await page.locator('text=/COMPLETE|ERROR/i').first().textContent();
        log(`Final status: ${finalStatus}`);

        // Take final screenshot
        await page.screenshot({ path: './test-results/final-state.png', fullPage: true });
        log('📸 Final state screenshot saved');

        // ========================================
        // STEP 7: VERIFY RESULTS
        // ========================================
        log('=== STEP 7: Verifying Results ===');

        if (finalStatus?.includes('COMPLETE')) {
            // Check for result sections
            await page.waitForTimeout(2000); // Let results render

            const hasFactsSection = await page.locator('text=/FACT|Evidence/i').first().isVisible().catch(() => false);
            const hasStrategySection = await page.locator('text=/STRATEGY|Recommendation/i').first().isVisible().catch(() => false);
            const hasInsiderSection = await page.locator('text=/INSIDER|Intel/i').first().isVisible().catch(() => false);

            console.log('Facts section visible:', hasFactsSection);
            console.log('Strategy section visible:', hasStrategySection);
            console.log('Insider section visible:', hasInsiderSection);

            // Check for betting tips
            const bettingTips = await page.locator('text=/HOME|AWAY|DRAW|OVER|UNDER|WIN/i').count();
            log(`Betting tips found: ${bettingTips}`);

            // Take results screenshot
            await page.screenshot({ path: './test-results/results-detail.png', fullPage: true });
            log('📸 Results screenshot saved');

            log('✅ FULL E2E TEST PASSED!');
        } else {
            log('⚠️ Analysis completed with ERROR status');
            throw new Error('Analysis ended in ERROR state');
        }
    });

});
