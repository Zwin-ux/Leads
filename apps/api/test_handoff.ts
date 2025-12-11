
import { graphService } from './src/services/graphService';

async function testHandoff() {
    console.log('📅 Testing Smart Handoff (Calendar)...');

    // Mock Data
    const accessToken = process.env.TEST_ACCESS_TOKEN; // Needs a real token to work fully, or mocking
    if (!accessToken) {
        console.warn('⚠️ No TEST_ACCESS_TOKEN env var found. Skipping real graph call.');
        console.log('In real scenario, this would book a meeting between BDO and UW.');
        return;
    }

    try {
        const result = await graphService.scheduleHandoff(
            accessToken,
            'ed.ryan@ampac.com',
            'doug.underwriter@ampac.com',
            'ACME Test Corp'
        );
        console.log('✅ Handoff Scheduled:', result);
    } catch (e: any) {
        console.error('❌ Failed:', e.message);
    }
}

testHandoff();
