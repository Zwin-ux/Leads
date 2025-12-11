import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.server from apps/server
dotenv.config({ path: path.resolve(__dirname, '../../apps/server/.env.server') });

// Blank IRS Form 1065 to test connectivity and OCR
const TEST_URL = "https://www.irs.gov/pub/irs-pdf/f1065.pdf";

async function runTest() {
    console.log("🤖 Testing AI Underwriter (Tax Extraction)...\n");
    console.log(`Target: ${TEST_URL}`);

    // Dynamic import to ensure env vars are loaded first
    const { docService } = await import('./src/services/docIntelligenceService');

    try {
        const result = await docService.analyzeTaxReturn(TEST_URL);
        console.log("\nSuccess! Result:");
        console.log(JSON.stringify(result, null, 2));

        if (result.formType) {
            const type = typeof result.formType === 'string' ? result.formType : JSON.stringify(result.formType);
            if (type.includes("1065") || type.includes("1120")) {
                console.log("✅ Correctly identified form type.");
            }
        }
    } catch (e: any) {
        console.error("❌ Test Failed:", e.message);
    }
}

runTest();
