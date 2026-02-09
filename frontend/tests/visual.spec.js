import { test, expect } from '@playwright/test';

test.describe('Visual & UI Checks', () => {

    test('should verify menu items and toggle dark mode', async ({ page }) => {
        // 1. Visit App
        await page.goto('/', { waitUntil: 'networkidle' });

        // 2. CHECK MENU ITEMS
        // Verify Header Title
        await expect(page.getByText('PhD BETTING INTELLIGENCE')).toBeVisible();
        await expect(page.getByText('v5.2.1 • Multi-Agent System')).toBeVisible();

        // Verify Buttons
        await expect(page.getByRole('button', { name: 'Methodology' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Configuration' })).toBeVisible();

        // Verify Dropzone Text
        await expect(page.getByText('Drop Betting Screenshots')).toBeVisible();

        // 3. CHECK DARK MODE TOGGLE
        // Initial state should be dark (based on App.jsx default)
        const bodyHandler = await page.locator('body');
        // Check if body has 'dark' class initially (App.jsx adds it to body or parent div)
        // In App.jsx: document.body.classList.toggle('dark', darkMode);
        // So we check the body element for class 'dark'

        // Note: Playwright checks specific element classes
        await expect(bodyHandler).toHaveClass(/dark/);
        console.log('Verified: Initial state is Dark Mode');

        // Toggle to Light Mode
        // Look for the sun/moon icon button. It's the first button in the right group usually.
        // We can find it by the SVG or order.
        // The button contains either <Sun> or <Moon>.
        // Let's use a selector for the button that contains the SVG
        const themeToggle = page.locator('header button').first(); // Adjust if needed, or use specific attribute
        // Better: The theme toggle is the one that calls setDarkMode.
        // In DOM it likely has a generic class. 
        // Let's assume it's the 3rd button in the header container or verify by icon.
        // Actually, let's use the .lucide-sun or .lucide-moon class to find it.
        const sunIcon = page.locator('.lucide-sun');
        if (await sunIcon.count() > 0) {
            await sunIcon.click();
        } else {
            const moonIcon = page.locator('.lucide-moon');
            await moonIcon.click();
        }

        // Wait for removal of 'dark' class
        await expect(bodyHandler).not.toHaveClass(/dark/);
        console.log('Verified: Toggled to Light Mode');

        // Toggle back to Dark
        await page.locator('.lucide-moon').click();
        await expect(bodyHandler).toHaveClass(/dark/);
        console.log('Verified: Toggled back to Dark Mode');
    });

});
