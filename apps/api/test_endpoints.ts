import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

async function testEndpoint(name: string, url: string, data: any) {
    try {
        console.log(`Testing ${name} at ${url}...`);
        const response = await axios.post(url, data);
        console.log(`✅ ${name}: Status ${response.status}`);
        // console.log(response.data);
    } catch (e: any) {
        if (e.response) {
            console.log(`⚠️ ${name}: Status ${e.response.status} (server reachable)`);
            console.log("   Error Data:", JSON.stringify(e.response.data).substring(0, 100));
        } else {
            console.log(`❌ ${name}: unreachable or network error`, e.message);
        }
    }
}

async function main() {
    await testEndpoint('Generate Ad', `${BASE_URL}/generateAd`, {
        product: "504",
        goal: "Leads",
        tone: "Professional",
        length: "Short"
    });

    await testEndpoint('Research', `${BASE_URL}/research`, {
        query: "Test Company",
        type: "business"
    });

    await testEndpoint('Process Lead', `${BASE_URL}/processLead`, {
        action: "sendEmail",
        lead: { id: "test", firstName: "Test", email: "test@example.com" }
    });

    try {
        console.log(`Testing Firecrawl Search at ${BASE_URL}/api/search/firecrawl...`);
        const searchRes = await axios.get(`${BASE_URL}/api/search/firecrawl?query=construction companies in california`);
        console.log(`✅ Firecrawl Search: Status ${searchRes.status}`);
        console.log(`   Data Preview: ${JSON.stringify(searchRes.data).substring(0, 100)}...`);
    } catch (e: any) {
        console.log(`❌ Firecrawl Search Failed: ${e.message}`);
        if (e.response) console.log(`   Response: ${JSON.stringify(e.response.data)}`);
    }
}

main();
