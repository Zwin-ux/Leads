
import { dealPhysics } from './src/services/dealPhysicsService';
import type { Lead } from '@leads/shared';

// Test Cases
const testLeads: any[] = [
    {
        company: "Healthy Deal Corp",
        loanAmount: 1000000,
        financials: {
            noi: 150000,
            existingDebtService: 0,
            appraisedValue: 1500000 // LTV < 70%
        }
    },
    {
        company: "Critical DSCR Inc",
        loanAmount: 1000000,
        financials: {
            noi: 60000, // Too low
            existingDebtService: 0,
            appraisedValue: 1500000
        }
    },
    {
        company: "High LTV LLC",
        loanAmount: 1000000,
        financials: {
            noi: 150000,
            existingDebtService: 0,
            appraisedValue: 1050000 // LTV ~95%
        }
    }
];

async function runTest() {
    console.log("🏛️ Testing The Deal Desk Physics Engine...\n");

    testLeads.forEach(lead => {
        console.log(`--- Analyzing: ${lead.company} ---`);
        const result = dealPhysics.analyze(lead);

        console.log(`DSCR: ${result.dscr}x`);
        console.log(`LTV:  ${(result.ltv * 100).toFixed(1)}%`);
        console.log(`Status: ${result.status}`);

        if (result.suggestions.length > 0) {
            console.log("Suggestions:");
            result.suggestions.forEach(s => console.log(`  - 💡 ${s}`));
        }
        console.log("\n");
    });
}

runTest();
