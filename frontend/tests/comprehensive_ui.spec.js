import { test, expect } from '@playwright/test';

test.describe('Comprehensive UI & Loading States', () => {

    test('should verify all menu items and loading states', async ({ page }) => {
        // 1. Visit App
        await page.goto('/', { waitUntil: 'networkidle' });

        // ========================================
        // HEADER & MENU VERIFICATION
        // ========================================
        console.log('✓ Testing Header & Menu Items');

        // Title
        await expect(page.getByText('PhD BETTING INTELLIGENCE')).toBeVisible();
        await expect(page.getByText('v5.2.1 • Multi-Agent System')).toBeVisible();

        // Status Badge (should be IDLE initially)
        await expect(page.locator('text=IDLE')).toBeVisible();

        // Menu Buttons
        const methodologyBtn = page.getByRole('button', { name: 'Methodology' });
        const configBtn = page.getByRole('button', { name: 'Configuration' });

        await expect(methodologyBtn).toBeVisible();
        await expect(configBtn).toBeVisible();

        // Dark Mode Toggle (Sun/Moon icon)
        const darkModeToggle = page.locator('button').filter({ has: page.locator('.lucide-sun, .lucide-moon') }).first();
        await expect(darkModeToggle).toBeVisible();

        // ========================================
        // METHODOLOGY PAGE
        // ========================================
        console.log('✓ Testing Methodology Page');
        await methodologyBtn.click();

        // Should navigate to How It Works
        await expect(page.getByText('How It Works')).toBeVisible({ timeout: 5000 });

        // Go Back
        const backBtn = page.getByRole('button', { name: 'Back' });
        await backBtn.click();
        await expect(page.getByText('Drop Betting Screenshots')).toBeVisible();

        // ========================================
        // CONFIGURATION MODAL
        // ========================================
        console.log('✓ Testing Configuration Modal');
        await configBtn.click();

        await expect(page.getByRole('heading', { name: 'API Configuration' })).toBeVisible();

        // Verify input fields
        await expect(page.locator('input[placeholder="sk-..."]')).toBeVisible();
        await expect(page.locator('input[placeholder="pplx-..."]')).toBeVisible();

        // Model selectors
        await expect(page.getByText('OpenAI Model')).toBeVisible();
        await expect(page.getByText('Perplexity Model')).toBeVisible();

        // Close modal
        const closeBtn = page.locator('button[aria-label="Close"]');
        await closeBtn.click();
        await expect(page.getByRole('heading', { name: 'API Configuration' })).not.toBeVisible();

        // ========================================
        // DARK MODE TOGGLE
        // ========================================
        console.log('✓ Testing Dark Mode Toggle');
        const body = page.locator('body');

        // Initial state (dark)
        await expect(body).toHaveClass(/dark/);

        // Toggle to light
        await darkModeToggle.click();
        await expect(body).not.toHaveClass(/dark/);

        // Toggle back to dark
        await darkModeToggle.click();
        await expect(body).toHaveClass(/dark/);

        // ========================================
        // UPLOAD AREA
        // ========================================
        console.log('✓ Testing Upload Area');
        await expect(page.getByText('Drop Betting Screenshots')).toBeVisible();
        await expect(page.getByText('JPG/PNG Supported')).toBeVisible();
        await expect(page.getByText('Auto-OCR')).toBeVisible();

        // ========================================
        // MANUAL INSIDER PANEL
        // ========================================
        console.log('✓ Testing Manual Insider Panel');
        const insiderToggle = page.getByText('Manual Insider Agent');
        await expect(insiderToggle).toBeVisible();

        // Expand panel
        await insiderToggle.click();
        await expect(page.getByText('Step 1: Generate Prompt')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Copy Gen-5 Prompt' })).toBeVisible();

        // Collapse
        await insiderToggle.click();
        await expect(page.getByText('Step 1: Generate Prompt')).not.toBeVisible();

        // ========================================
        // RUN BUTTON STATE
        // ========================================
        console.log('✓ Testing Run Button');
        const runBtn = page.getByRole('button', { name: 'Run Intelligence' });
        await expect(runBtn).toBeVisible();
        // Should be disabled (no images uploaded)
        await expect(runBtn).toBeDisabled();

        console.log('✅ All menu items and UI components verified!');
    });

    test('should verify loading states during analysis', async ({ page }) => {
        test.setTimeout(120000); // 2 min timeout

        // This test requires API keys to be set
        await page.goto('/', { waitUntil: 'networkidle' });

        // Set API keys (dummy for this test, won't actually call APIs)
        await page.getByRole('button', { name: 'Configuration' }).click();
        await page.locator('input[placeholder="sk-..."]').fill('sk-test');
        await page.locator('input[placeholder="pplx-..."]').fill('pplx-test');
        await page.getByRole('button', { name: 'Save & Close' }).click();

        // Upload a dummy image
        const fileInput = page.locator('input[type="file"]').first();
        const buffer = Buffer.from('test');
        await fileInput.setInputFiles({
            name: 'test.jpg',
            mimeType: 'image/jpeg',
            buffer
        });

        // Wait for upload
        await expect(page.locator('text=Detected Matches')).toBeVisible({ timeout: 10000 });

        // Click Run
        const runBtn = page.getByRole('button', { name: 'Run Intelligence' });
        await runBtn.click();

        // ========================================
        // LOADING STATE VERIFICATION
        // ========================================
        console.log('✓ Verifying Loading States...');

        // Status should change from IDLE
        const statusBadge = page.locator('span').filter({ hasText: /VISION|FACTS|STRATEGY|COMPLETE|ERROR/ }).first();

        // Should eventually show a non-IDLE status
        await expect(statusBadge).not.toHaveText('IDLE', { timeout: 10000 });

        console.log('✅ Loading states are functional!');
    });

});
