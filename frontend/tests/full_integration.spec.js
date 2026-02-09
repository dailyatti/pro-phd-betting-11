import { test, expect } from '@playwright/test';

// BYOK: Users must provide their own API keys
// For E2E testing, set these environment variables: TEST_OPENAI_KEY, TEST_PERPLEXITY_KEY
const OPENAI_KEY = process.env.TEST_OPENAI_KEY || 'sk-YOUR_OPENAI_KEY_HERE';
const PERPLEXITY_KEY = process.env.TEST_PERPLEXITY_KEY || 'pplx-YOUR_PERPLEXITY_KEY_HERE';

test.describe('Full Integration Test (REAL API)', () => {

    test('should run complete analysis pipeline with real APIs', async ({ page }) => {
        test.setTimeout(180000); // 3 minutes for real API calls

        // Capture browser console for debugging
        const logs = [];
        page.on('console', msg => {
            logs.push(`[${msg.type()}] ${msg.text()}`);
            if (msg.type() === 'error') console.error('BROWSER ERROR:', msg.text());
        });

        // 1. Visit App
        console.log('Step 1: Loading app...');
        await page.goto('/', { waitUntil: 'networkidle' });

        // 2. Open Settings and Enter API Keys
        console.log('Step 2: Opening Settings...');
        await page.getByRole('button', { name: 'Configuration' }).click();
        await expect(page.locator('text=API Configuration')).toBeVisible({ timeout: 5000 });

        // Enter OpenAI Key
        console.log('Step 3: Entering API keys...');
        const openaiInput = page.locator('input[placeholder="sk-..."]');
        await openaiInput.fill(OPENAI_KEY);

        // Enter Perplexity Key
        const perplexityInput = page.locator('input[placeholder="pplx-..."]');
        await perplexityInput.fill(PERPLEXITY_KEY);

        // Save
        console.log('Step 4: Saving API keys...');
        await page.getByRole('button', { name: 'Save & Close' }).click();
        await page.waitForTimeout(500);

        // 3. Upload Test Image
        console.log('Step 5: Uploading betting screenshot...');
        const fileInput = page.locator('input[type="file"]').first();
        await fileInput.setInputFiles('./tests/test-betting-screenshot.png');

        // Wait for image to be processed
        console.log('Step 6: Waiting for image processing...');
        await page.waitForTimeout(3000);

        // Check if any match was detected
        const matchDetected = await page.locator('text=/Detected|Match|Group/i').first().isVisible().catch(() => false);
        console.log('Match detected:', matchDetected);

        // 4. Start Analysis
        console.log('Step 7: Starting analysis...');
        const runButton = page.locator('button:has-text("Run Intelligence")');

        // Check if button is enabled
        const isEnabled = await runButton.isEnabled().catch(() => false);
        console.log('Run button enabled:', isEnabled);

        if (!isEnabled) {
            // Print browser logs to diagnose
            console.log('Browser logs:', logs.slice(-20).join('\n'));

            // Check for error messages on page
            const errorText = await page.locator('.text-red-500, .text-red-400, [class*="error"]').first().textContent().catch(() => 'No error visible');
            console.log('Visible error:', errorText);
        }

        await expect(runButton).toBeEnabled({ timeout: 10000 });
        await runButton.click();

        // 5. Wait for Analysis Phases
        console.log('Step 8: Waiting for VISION phase...');

        // Wait for status to change from IDLE
        await expect(page.locator('text=/VISION|FACTS|STRATEGY|COMPLETE|ERROR/i').first()).toBeVisible({ timeout: 30000 });

        console.log('Step 9: Waiting for analysis to complete...');
        // Wait for COMPLETE or ERROR
        await expect(page.locator('text=/COMPLETE|ERROR/i').first()).toBeVisible({ timeout: 120000 });

        // 6. Verify Results
        const status = await page.locator('text=/COMPLETE|ERROR/i').first().textContent();
        console.log('Final status:', status);

        if (status?.includes('COMPLETE')) {
            console.log('✅ Full integration test PASSED!');
        } else {
            // Print final logs
            console.log('Final browser logs:', logs.slice(-30).join('\n'));
            throw new Error('Analysis did not complete successfully');
        }
    });

});
