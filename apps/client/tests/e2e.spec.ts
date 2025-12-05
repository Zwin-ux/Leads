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

test.describe('AmPac CRM E2E', () => {

    test('should load the admin dashboard by default', async ({ page }) => {
        await setUserRole(page, 'admin');
        await expect(page).toHaveTitle(/AmPac CRM/i);
        await expect(page.getByText('Pipeline')).toBeVisible();
    });

    test('should load BDO Dashboard', async ({ page }) => {
        await setUserRole(page, 'bdo');
        await expect(page.getByText('Business Development')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Find New Leads' })).toBeVisible();
        await expect(page.getByText('My Pipeline')).toBeVisible();
    });

    test('should load Loan Officer Dashboard', async ({ page }) => {
        await setUserRole(page, 'loan_officer');
        await expect(page.getByText('Loan Officer Command')).toBeVisible();
        await expect(page.getByText('Active Portfolio')).toBeVisible();
        // Check for the structure button (using title attribute or icon text if accessible, here relying on visual presence check via text if possible or generic)
        // Since we used emojis/icons, we can check for text content if it's rendered as text
        await expect(page.getByRole('button', { name: 'View Details' }).first()).toBeVisible();
    });

    test('should load Processor Dashboard with new widgets', async ({ page }) => {
        await setUserRole(page, 'processor');
        await expect(page.getByText('The Chase List')).toBeVisible();
        await expect(page.getByText('Closing Calendar')).toBeVisible();
        await expect(page.getByText('Third Party Orders')).toBeVisible();
    });

    test('should toggle Stale Only filter (Admin)', async ({ page }) => {
        await setUserRole(page, 'admin');
        const staleButton = page.getByRole('button', { name: '⚠️ Stale Only' });
        await expect(staleButton).toBeVisible();
        await staleButton.click();
        await expect(staleButton).toBeVisible();
    });

    test('should open lead detail and check SBA Scanner (Admin)', async ({ page }) => {
        await setUserRole(page, 'admin');
        // Click the first lead card
        const firstLead = page.locator('.lead-card').first();
        await expect(firstLead).toBeVisible();
        await firstLead.click();

        // Check modal opens
        await expect(page.locator('.modal')).toBeVisible();

        // Navigate to Qualification tab
        const qualTab = page.getByRole('button', { name: 'Qualification' });
        await expect(qualTab).toBeVisible();
        await qualTab.click();

        // Check SBA Scanner is present
        await expect(page.getByText('SBA Eligibility Scanner')).toBeVisible();
    });

    test('should check Document Templates (Admin)', async ({ page }) => {
        await setUserRole(page, 'admin');
        // Click the first lead card
        const firstLead = page.locator('.lead-card').first();
        await firstLead.click();

        // Navigate to Documents tab
        const docTab = page.getByRole('button', { name: 'Documents' });
        await docTab.click();

        // Check for Required Documents header
        await expect(page.getByText('Required Documents')).toBeVisible();
    });

    test('should view Manager Dashboard and Referral Stats (Admin)', async ({ page }) => {
        await setUserRole(page, 'admin');
        // Switch to Dashboard view
        const dashboardBtn = page.getByRole('button', { name: '📈 Dashboard' });
        await dashboardBtn.click();

        // Check for Referral Intelligence section
        await expect(page.getByText('Referral Intelligence')).toBeVisible();
        await expect(page.getByText('Top Referring Bankers')).toBeVisible();
    });
});
