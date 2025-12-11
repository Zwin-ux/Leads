
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.server from apps/server
dotenv.config({ path: path.resolve(__dirname, './src/.env.server') }); // Path might need adjustment depending on where ts-node runs
// Actually standard simple path for test scripts in root of api:
dotenv.config({ path: path.resolve(__dirname, '../../apps/server/.env.server') });

import { councilService } from './src/services/councilService';
import { Lead } from '@leads/shared';
import { SpreadingResult } from './src/services/spreadingService';

const MOCK_LEAD: Partial<Lead> = {
    firstName: "John",
    lastName: "Doe",
    company: "Acme Logistics LLC",
    loanAmount: 1200000,
    loanProgram: "504"
};

const MOCK_SPREAD: SpreadingResult = {
    year: 2023,
    revenue: 1000000,
    ebitda: 140000, // Low-ish for a $1.2M loan
    sde: 140000,
    dscr: 0.95,     // Under 1.0! This should trigger the Skeptic.
    addBacks: [],
    cashFlowAvailable: 140000,
    debtServiceCoverage: 0.95
};

async function runTest() {
    console.log("⚖️  Convening The AI Council (Test Mode)...\n");
    console.log(`Lead: ${MOCK_LEAD.company}`);
    console.log(`DSCR: ${MOCK_SPREAD.dscr}x (Expect Skepticism)\n`);

    try {
        const report = await councilService.conveneCouncil(MOCK_LEAD as Lead, MOCK_SPREAD);

        console.log("\n--- SKEPTIC ---");
        const skeptic = report.opinions.find(o => o.persona === 'Skeptic');
        console.log(`Verdict: ${skeptic?.verdict}`);
        console.log(`Says: ${skeptic?.analysis}`);

        console.log("\n--- DEAL MAKER ---");
        const dealer = report.opinions.find(o => o.persona === 'Deal Maker');
        console.log(`Verdict: ${dealer?.verdict}`);
        console.log(`Says: ${dealer?.analysis}`);

        console.log("\n--- CHAIRMAN (FINAL) ---");
        const chair = report.opinions.find(o => o.persona === 'Chairman');
        console.log(`VERDICT: ${chair?.verdict}`);
        console.log(`RULING: ${chair?.analysis}`);

    } catch (e: any) {
        console.error("❌ Council Failed:", e.message);
    }
}

runTest();
