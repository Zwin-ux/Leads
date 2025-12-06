import { test, expect } from '@playwright/test';

test.describe('SEC EDGAR Integration Verification', () => {

    test.beforeEach(async ({ page }) => {
        // Setup User
        await page.addInitScript(() => {
            localStorage.setItem('leads_current_user', JSON.stringify({
                id: 'user_1',
                name: 'Alex Rivera',
                email: 'alex.rivera@ampac.com',
                role: 'general_user'
            }));
            // We rely on "clean" or unique leads
        });
        await page.goto('/');
    });

    test('should fetch and display SEC data for a public company (Apple Inc)', async ({ page }) => {
        const publicCompany = `Apple Inc ${Date.now()}`; // "Apple Inc" triggers ticker guess "AAPL"

        // 1. Create Lead "Apple Inc"
        await page.getByRole('button', { name: '+ New Lead' }).click();
        await page.getByPlaceholder('First Name').fill('Tim');
        await page.getByPlaceholder('Last Name').fill('Cook');
        await page.getByPlaceholder('Email').fill('tim@apple.com');
        await page.getByPlaceholder('Company (Display Name)').fill(publicCompany);
        await page.getByPlaceholder('Property Address (Street)').fill('One Apple Park Way');
        await page.getByPlaceholder('City').fill('Cupertino');
        await page.getByPlaceholder('State (e.g. CA)').fill('CA');
        await page.getByPlaceholder('NAICS Code').fill('334111'); // Electronic Computer Manufacturing

        // 2. Set to Underwriting
        await page.locator('select').filter({ hasText: 'Prospecting' }).selectOption('Underwriting');

        // 3. Save & Enrich
        await page.getByRole('button', { name: 'Save & Enrich' }).click();

        // Listen for console logs
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));

        // 4. Verify Lead in List and Wait for Enrichment
        await expect(page.getByText(publicCompany)).toBeVisible({ timeout: 10000 });
        console.log('Lead created, waiting for enrichment...');
        await page.waitForTimeout(5000); // 5s wait for background process
        console.log('Enrichment wait complete. Reloading...');

        // 5. Switch to Underwriter
        await page.evaluate(() => {
            localStorage.setItem('leads_current_user', JSON.stringify({
                id: 'user_3',
                name: 'Sarah Chen',
                email: 'sarah.chen@ampac.com',
                role: 'underwriter'
            }));
        });
        await page.reload();

        // 6. Navigate to Deal Workspace
        await expect(page.getByText('Credit Command')).toBeVisible({ timeout: 15000 });

        // Debug: Dump LocalStorage
        const storage = await page.evaluate(() => JSON.stringify(localStorage));
        console.log('LOCAL STORAGE DUMP:', storage);

        const row = page.locator('tr').filter({ hasText: publicCompany });
        await expect(row).toBeVisible({ timeout: 10000 });
        await row.getByRole('button', { name: 'Work Deal' }).click();

        // 7. Verify SEC Data on Card
        await expect(page.getByText('🚀 Intelligence Brief')).toBeVisible();
        console.log('Intelligence Brief Card Visible');

        // Check for SEC Section headers
        await expect(page.getByText('PUBLIC MARKETS (SEC EDGAR)')).toBeVisible();
        console.log('Public Markets Section Visible');

        await expect(page.getByText('AAPL', { exact: true })).toBeVisible();

        // Verify CIK and Filing
        await expect(page.getByText('0000320193')).toBeVisible(); // Apple CIK
        await expect(page.getByText('10-K')).toBeVisible(); // Filing Type
    });
});
