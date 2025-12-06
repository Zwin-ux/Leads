import { test, expect } from '@playwright/test';

test.describe('Accounting Control Center', () => {

    test('should be visible for Senior Loan Administrator', async ({ page }) => {
        // Mock Senior Loan Admin User
        await page.addInitScript(() => {
            localStorage.setItem('leads_current_user', JSON.stringify({
                name: 'Jennifer Salazar',
                email: 'JSalazar@ampac.com',
                title: 'Senior Loan Administrator',
                role: 'processor'
            }));
        });

        await page.goto('/');

        // Expect Accounting Header
        await expect(page.getByText('Accounting Control Center')).toBeVisible();
        await expect(page.getByText('Restricted Access: Senior Loan Admin / Sr. Accountant')).toBeVisible();
    });

    test('should NOT be visible for regular Processor', async ({ page }) => {
        // Mock Regular Processor
        await page.addInitScript(() => {
            localStorage.setItem('leads_current_user', JSON.stringify({
                name: 'Jennifer Premana',
                email: 'JPremana@ampac.com',
                title: 'VP, Loan Processing Manager',
                role: 'processor'
            }));
        });

        await page.goto('/');

        // Expect Processing Dashboard but NO Accounting Header
        await expect(page.getByText('Processing Queue')).toBeVisible();
        await expect(page.getByText('Accounting Control Center')).not.toBeVisible();
    });

    test('should calculate fees correctly', async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem('leads_current_user', JSON.stringify({
                name: 'Jennifer Salazar',
                email: 'JSalazar@ampac.com',
                title: 'Senior Loan Administrator',
                role: 'processor'
            }));
        });

        await page.goto('/');

        // Go to Fee Tab
        await page.click('button:has-text("Fee Calculator")');

        // Input Loan Amount $1,000,000
        await page.fill('input[type="number"]', '1000000');
        await page.click('button:has-text("Calculate Fees")');

        // Check Results
        // CDC Fee 1.5% = 15,000
        await expect(page.getByText('$15,000.00')).toBeVisible();
        // Funding Fee 0.25% = 2,500
        await expect(page.getByText('$2,500.00')).toBeVisible();
    });

    test('should log wire transfers', async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem('leads_current_user', JSON.stringify({
                name: 'Jennifer Salazar',
                email: 'JSalazar@ampac.com',
                title: 'Senior Loan Administrator',
                role: 'processor'
            }));
        });

        await page.goto('/');

        // Wire Log is default tab
        // Add a wire
        const amountInput = page.getByPlaceholder('Amount');
        const descInput = page.getByPlaceholder('Description / Client');
        const refInput = page.getByPlaceholder('Ref #');

        await amountInput.fill('500000');
        await descInput.fill('Test Borrower Injection');
        await refInput.fill('WIRE-999');
        await page.click('button:has-text("Add Log")');

        // Verify in table
        await expect(page.locator('table')).toContainText('Test Borrower Injection');
        await expect(page.locator('table')).toContainText('$500,000');
        await expect(page.locator('table')).toContainText('PENDING');

        // Toggle Status
        await page.click('button:has-text("PENDING")');
        await expect(page.locator('table')).toContainText('CLEARED');
    });

});
