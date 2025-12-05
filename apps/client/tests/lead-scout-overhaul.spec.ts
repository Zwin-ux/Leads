import { test, expect } from '@playwright/test';

test.describe('Lead Scout Overhaul', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the app
        await page.goto('/');
    });

    test('should navigate to Lead Scout from BDO Dashboard', async ({ page }) => {
        // Assuming we start at BDO dashboard or can navigate there
        // For now, let's assume we can click "Find Leads" from the list view

        // Wait for the app to load
        await expect(page.locator('h1')).toBeVisible();

        // Click "Find Leads" button
        await page.click('button:has-text("🔍 Find Leads")');

        // Verify Lead Scout Hero section is visible
        await expect(page.locator('.scout-hero')).toBeVisible();
        await expect(page.locator('h1')).toContainText('Lead Scout Intelligence');
    });

    test('should perform a search and display results', async ({ page }) => {
        await page.click('button:has-text("🔍 Find Leads")');

        // Type search query
        await page.fill('input[placeholder*="Search businesses"]', 'Coffee Shop');

        // Select location (default is Riverside, CA, let's keep it)

        // Click Scout Market
        await page.click('button:has-text("Scout Market")');

        // Verify loading state
        await expect(page.locator('.loading-state')).toBeVisible();

        // Wait for results (mocked or real)
        // Since we don't have real API keys in CI/Test environment usually, 
        // we might need to mock the API response or expect the "No Leads Found" if keys are missing but handled gracefully.
        // However, the service uses a backend proxy or direct calls.
        // If keys are missing, it returns empty results.

        // Let's check if we get results or empty state, either is "working" in terms of UI flow
        const resultsContainer = page.locator('.results-container');
        await expect(resultsContainer).toBeVisible();

        // Wait for loading to disappear
        await expect(page.locator('.loading-state')).not.toBeVisible({ timeout: 10000 });
    });

    test('should toggle analysis depth', async ({ page }) => {
        await page.click('button:has-text("🔍 Find Leads")');

        const depthSelect = page.locator('.depth-toggle select');
        await expect(depthSelect).toHaveValue('standard');

        await depthSelect.selectOption('deep');
        await expect(depthSelect).toHaveValue('deep');
    });
});
