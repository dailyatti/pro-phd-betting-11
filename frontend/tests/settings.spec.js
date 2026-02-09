import { test, expect } from '@playwright/test';

test.describe('Settings Modal E2E', () => {

    test('should allow entering API keys and saving', async ({ page }) => {
        // 1. Visit App
        await page.goto('/', { waitUntil: 'networkidle' });

        // 2. Open Settings
        console.log('Clicking Configuration button...');
        const settingsButton = page.getByRole('button', { name: 'Configuration' });
        await expect(settingsButton).toBeVisible();
        await settingsButton.click({ force: true });

        // 3. Verify Modal Open
        console.log('Waiting for modal header...');
        const modalHeader = page.getByRole('heading', { name: 'API Configuration', level: 3 });
        await expect(modalHeader).toBeVisible({ timeout: 5000 });

        // 4. Input API Key (OpenAI)
        // Use more specific selector to avoid ambiguity
        const openaiInput = page.locator('input[placeholder="sk-..."]');
        await expect(openaiInput).toBeVisible();
        await openaiInput.click(); // Ensure focus

        // Clear and Type
        await openaiInput.fill('');
        await openaiInput.pressSequentially('sk-test-key-12345', { delay: 100 });

        // 5. Verify Value
        await expect(openaiInput).toHaveValue('sk-test-key-12345');

        // 6. Save
        const saveButton = page.getByRole('button', { name: 'Save & Close' });
        await saveButton.click();

        // 7. Verify Modal Closed
        await expect(modalHeader).not.toBeVisible();

        // 8. Re-open and Verify Persistence
        console.log('Re-opening Configuration...');
        await settingsButton.click({ force: true });
        await expect(modalHeader).toBeVisible();
        await expect(openaiInput).toHaveValue('sk-test-key-12345');
    });

});
