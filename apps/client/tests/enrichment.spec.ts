import { test, expect } from '@playwright/test';

test.describe('Enrichment Service Integration', () => {

    test.beforeEach(async ({ page }) => {
        // Set user as BDO initially to allow creating leads
        await page.addInitScript(() => {
            localStorage.setItem('currentUser', JSON.stringify({
                id: 'user_1',
                name: 'Alex Rivera',
                email: 'alex.rivera@ampac.com',
                role: 'bdo'
            }));
            // Clear leads to avoid clutter
        });
        await page.goto('/');
    });

    test('should trigger enrichment and display data in Underwriter Workspace', async ({ page }) => {
        const uniqueCompany = `Enriched Entity ${Date.now()}`;

        // 1. Open Add Lead Form
        await page.getByRole('button', { name: '+ New Lead' }).click();

        // 2. Fill in Form
        await page.getByPlaceholder('First Name').fill('Test');
        await page.getByPlaceholder('Last Name').fill('Enrich');
        await page.getByPlaceholder('Email').fill('enrich@test.com');
        await page.getByPlaceholder('Company (Display Name)').fill(uniqueCompany); // Unique name
        await page.getByPlaceholder('Property Address (Street)').fill('123 Main St');
        await page.getByPlaceholder('City').fill('Sacramento');
        await page.getByPlaceholder('State (e.g. CA)').fill('CA');
        await page.getByPlaceholder('NAICS Code').fill('722511'); // Restaurant - Full Service

        // 3. Set Stage to Underwriting
        await page.locator('select').filter({ hasText: 'Prospecting' }).selectOption('Underwriting');

        // 4. Submit
        await page.getByRole('button', { name: 'Save & Enrich' }).click();

        // 5. Verify Lead appeared in list (as BDO)
        await expect(page.getByText(uniqueCompany)).toBeVisible();

        // 6. Switch to Underwriter Role
        await page.evaluate(() => {
            localStorage.setItem('currentUser', JSON.stringify({
                id: 'user_3',
                name: 'Sarah Chen',
                email: 'sarah.chen@ampac.com',
                role: 'underwriter'
            }));
        });
        await page.reload();

        // 7. Verify Underwriter Dashboard and Open Deal
        await expect(page.getByText('Credit Command')).toBeVisible();

        // Find the lead row and click "Work Deal"
        const row = page.locator('tr').filter({ hasText: uniqueCompany });
        await expect(row).toBeVisible();

        await row.getByRole('button', { name: 'Work Deal' }).click();

        // 8. Verify Enrichment Card (OpenCorporates Data)
        await expect(page.getByText('🚀 Intelligence Brief')).toBeVisible();
        await expect(page.getByText('ELIGIBLE (LMI)')).toBeVisible();
        // Expect "Active" from new OpenCorporates fixtures
        await expect(page.getByText('Active', { exact: true })).toBeVisible();
        await expect(page.getByText('Loans in Area')).toBeVisible();
    });
});
