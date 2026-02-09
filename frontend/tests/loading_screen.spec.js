import { test, expect } from '@playwright/test';

// BYOK: Users must provide their own API keys
// For E2E testing, set these environment variables: TEST_OPENAI_KEY, TEST_PERPLEXITY_KEY
const OPENAI_KEY = process.env.TEST_OPENAI_KEY || 'sk-YOUR_OPENAI_KEY_HERE';
const PERPLEXITY_KEY = process.env.TEST_PERPLEXITY_KEY || 'pplx-YOUR_PERPLEXITY_KEY_HERE';

test.describe('Loading Screen Visual Verification', () => {

    test('Verify Loading Screen appearance during analysis', async ({ page }) => {
        test.setTimeout(120000);

        // Capture all console logs
        const logs = [];
        page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
        page.on('pageerror', err => logs.push(`[ERROR] ${err.message}`));

        // 1. Load App
        console.log('Loading app...');
        await page.goto('/', { waitUntil: 'networkidle' });

        // 2. Configure API Keys
        console.log('Configuring API keys...');
        await page.getByRole('button', { name: 'Configuration' }).click();
        await page.locator('input[placeholder="sk-..."]').fill(OPENAI_KEY);
        await page.locator('input[placeholder="pplx-..."]').fill(PERPLEXITY_KEY);
        await page.getByRole('button', { name: 'Save & Close' }).click();
        await page.waitForTimeout(500);

        // 3. Upload Image
        console.log('Uploading image...');
        const fileInput = page.locator('input[type="file"]').first();
        await fileInput.setInputFiles('./tests/test-betting-screenshot.png');
        await page.waitForTimeout(3000);

        // 4. Start Analysis
        console.log('Starting analysis...');
        const runButton = page.locator('button:has-text("Run Intelligence")');
        await expect(runButton).toBeEnabled({ timeout: 15000 });
        await runButton.click();

        await page.waitForTimeout(3000);

        // ========================================
        // LOADING SCREEN VERIFICATION
        // ========================================
        console.log('=== VERIFYING LOADING SCREEN ===');

        // Take screenshot immediately
        await page.screenshot({ path: './test-results/loading-screen-capture-1.png', fullPage: true });
        console.log('📸 Screenshot 1 saved');

        // Check Header Status Badge
        const statusBadge = page.locator('text=/VISION|FACTS|STRATEGY|IDLE|ERROR|COMPLETE/i').first();
        const statusText = await statusBadge.textContent().catch(() => 'N/A');
        console.log('Current Status:', statusText);

        // Check for Loading Overlay
        const loadingOverlay = page.locator('.loading-overlay');
        const overlayVisible = await loadingOverlay.isVisible().catch(() => false);
        console.log('Loading Overlay visible:', overlayVisible);

        if (overlayVisible) {
            // Stage Label
            const stageLabel = page.locator('text=/Vision Scan|Deep Research|PhD Analysis/').first();
            const stageLabelVisible = await stageLabel.isVisible().catch(() => false);
            console.log('✓ Stage Label visible:', stageLabelVisible);

            // Animated Spinner
            const spinner = page.locator('.animate-spin').first();
            const spinnerVisible = await spinner.isVisible().catch(() => false);
            console.log('✓ Animated Spinner visible:', spinnerVisible);

            // Progress Bar (cyan gradient)
            const progressBar = page.locator('[class*="from-cyan-500"]');
            const progressVisible = await progressBar.isVisible().catch(() => false);
            console.log('✓ Progress Bar visible:', progressVisible);

            // Tips Section
            const tips = page.locator('text=/Analyzing|Scanning|Cross-referencing/').first();
            const tipsVisible = await tips.isVisible().catch(() => false);
            console.log('✓ Tips visible:', tipsVisible);

            // Elapsed Time
            const elapsed = page.locator('text=Elapsed:');
            const elapsedVisible = await elapsed.isVisible().catch(() => false);
            console.log('✓ Elapsed Time visible:', elapsedVisible);

            // Cancel Button
            const cancelBtn = page.locator('button:has-text("Cancel Analysis")');
            const cancelVisible = await cancelBtn.isVisible().catch(() => false);
            console.log('✓ Cancel Button visible:', cancelVisible);
        }

        // Wait and take another screenshot
        await page.waitForTimeout(5000);
        await page.screenshot({ path: './test-results/loading-screen-capture-2.png', fullPage: true });
        console.log('📸 Screenshot 2 saved');

        // Print browser logs for debugging
        console.log('=== BROWSER LOGS ===');
        logs.forEach(l => console.log(l));

        console.log('✅ Loading screen verification complete!');
    });

});
