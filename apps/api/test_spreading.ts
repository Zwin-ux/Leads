
import { spreadingService } from './src/services/spreadingService';

const mockTaxReturn = {
    formType: "1120S",
    year: 2023,
    grossRevenue: 1000000,
    netIncome: 150000,
    depreciation: 50000,
    interestExpense: 20000,
    officerCompensation: 100000,
    rentExpense: 60000,
    notes: "Simulation"
};

const PROPOSED_DEBT = 180000; // $15k/mo

async function runTest() {
    console.log("🧠 Testing Smart Spreading Engine...\n");
    console.log("Input Data:");
    console.log(mockTaxReturn);
    console.log(`Proposed Debt Service: $${PROPOSED_DEBT.toLocaleString()}/yr\n`);

    const result = spreadingService.spread(mockTaxReturn, PROPOSED_DEBT);

    console.log("--- SPREAD RESULTS ---");
    console.log(`EBITDA: $${result.ebitda.toLocaleString()}  (Should be 220,000)`);
    console.log(`SDE:    $${result.sde.toLocaleString()}  (Should be 320,000)`);
    console.log(`DSCR:   ${result.dscr}x  (Should be ~1.22)`);

    console.log("\nAdd Backs:");
    result.addBacks.forEach(ab => console.log(` + ${ab.label}: $${ab.amount.toLocaleString()}`));

    if (result.ebitda === 220000 && result.dscr > 1.2) {
        console.log("\n✅ Calculation Verified.");
    } else {
        console.error("\n❌ Calculation Mismatch.");
    }
}

runTest();
