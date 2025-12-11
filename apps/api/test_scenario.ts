
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function testScenario() {
    console.log('🎭 Testing Scenario Desk...');
    const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

    try {
        const payload = {
            industry: "Car Wash",
            amount: 3500000,
            collateral: "Land + Building",
            story: "Strong cash flow, but owner has a tax lien being resolved.",
            bdo: "Ed Ryan"
        };

        console.log(`Sending to ${API_URL}/api/scenario...`);
        const res = await axios.post(`${API_URL}/api/scenario`, payload);
        console.log('✅ Result:', res.data);

    } catch (e: any) {
        console.error('❌ Failed:', e.message);
        if (e.response) console.error('Response:', e.response.data);
    }
}

testScenario();
