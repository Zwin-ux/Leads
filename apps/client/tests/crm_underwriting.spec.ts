import { test, expect } from '@playwright/test';

const setUserRole = async (page: any, role: string) => {
    await page.addInitScript((role) => {
        localStorage.setItem("leads_current_user", JSON.stringify({
            name: "Test User",
            email: "test@ampac.com",
            title: "Tester",
            role: role
        }));
    }, role);
    await page.goto('/');
};

test.describe('BDO CRM & Underwriting Features', () => {

    test.describe('BDO CRM Dashboard', () => {
        test.beforeEach(async ({ page }) => {
            await setUserRole(page, 'bdo');
        });

        test('should display BDO specific layout', async ({ page }) => {
            await expect(page.getByText('Business Development')).toBeVisible();
            await expect(page.getByText('My Tasks')).toBeVisible();
            await expect(page.getByText('Recent Activity')).toBeVisible();
            await expect(page.getByText('Quick Fee Calc')).toBeVisible();
        });

        test('should allow creating a task', async ({ page }) => {
            // Locate the "My Tasks" section
            const tasksHeader = page.getByText('My Tasks');
            await expect(tasksHeader).toBeVisible();

            // Click the '+' button to show input
            await page.locator('.sidebar-section .icon-btn').click();

            // Type task name and submit
            const input = page.locator('.quick-task-form input');
            await expect(input).toBeVisible();
            await input.fill('Follow up with lead');
            await input.press('Enter');

            // Verify task appears in list
            await expect(page.getByText('Follow up with lead')).toBeVisible();
        });

        test('should toggle between Pipeline and List views', async ({ page }) => {
            // Default view is Pipeline
            await expect(page.locator('.pipeline-container')).toBeVisible();

            // Switch to List View
            await page.getByText('List View').click();
            await expect(page.locator('table')).toBeVisible();
            await expect(page.getByText('Last Contact')).toBeVisible(); // Column header

            // Switch back
            await page.getByText('Kanban Pipeline').click();
            await expect(page.locator('.pipeline-container')).toBeVisible();
        });
    });

    test.describe('Underwriter Workspace', () => {
        test.beforeEach(async ({ page }) => {
            await setUserRole(page, 'underwriter');
        });

        test('should open Deal Workspace from dashboard', async ({ page }) => {
            await expect(page.getByText('Credit Command')).toBeVisible();

            // Find a "Work Deal" button and click it
            const workDealBtn = page.getByRole('button', { name: 'Work Deal' }).first();
            await expect(workDealBtn).toBeVisible();
            await workDealBtn.click();

            // Verify Workspace headers
            await expect(page.getByText('Financial Analysis')).toBeVisible();
            await expect(page.getByText('RISK RATING')).toBeVisible();
        });

        test('should navigate tabs and calculate financials', async ({ page }) => {
            // Open Deal
            await page.getByRole('button', { name: 'Work Deal' }).first().click();

            // 1. Financials Tab (Default)
            await expect(page.getByText('Gross Revenue')).toBeVisible();

            // Input Revenue and Debt Service to check DSCR
            // Note: Inputs might be pre-filled or empty. We'll fill them.
            // Using semantic locators where possible, else fallback to labeled inputs

            // Find inputs relative to labels
            const revenueInput = page.locator('.input-group', { hasText: 'Gross Revenue' }).locator('input');
            const debtInput = page.locator('.input-group', { hasText: 'Proposed Debt Service' }).locator('input');
            const dscrDisplay = page.locator('.input-group', { hasText: 'DSCR' }).locator('.value');

            await revenueInput.fill('100000'); // Clean input
            // Update other fields to simplified numbers if needed, but for now assuming 0 expenses = 100k NOI
            // Wait for React to process state
            await debtInput.fill('50000');

            // DSCR should be 2.0x (100k / 50k)
            // Note: We might need to zero out CoGS/OpEx if they have random defaults. 
            // In our mock, they init to 0.

            await expect(dscrDisplay).toContainText('2'); // Check for 2.0 or 2.00x

            // 2. Stips Tab
            await page.getByText('Stipulations').click();
            await expect(page.getByText('Required Documents')).toBeVisible();
            await expect(page.getByText('Tax Returns')).toBeVisible();

            // 3. SBA Tab
            await page.getByText('SBA Eligibility').click();
            await expect(page.getByText('SBA Eligibility Scanner')).toBeVisible();

            // 4. Memo Tab
            await page.getByText('Credit Memo').click();
            await expect(page.getByText('Credit Memorandum Draft')).toBeVisible();
            await expect(page.getByRole('textbox')).toBeVisible(); // Textarea
        });

        test('should have Location Verification button', async ({ page }) => {
            await page.getByRole('button', { name: 'Work Deal' }).first().click();

            // Check for Location Check component in sidebar
            await expect(page.getByText('Site Verification')).toBeVisible();
            const verifyBtn = page.getByRole('button', { name: 'Verify Address' });
            await expect(verifyBtn).toBeVisible();

            // Optional: Click verification (might fail if simulated address is bad or network blocked, 
            // but we can check the button state)
            // await verifyBtn.click();
            // await expect(page.getByText('Verifying...')).toBeVisible();
        });
    });
});
