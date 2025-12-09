require('dotenv').config();
const axios = require('axios');

async function testFirecrawl() {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
        console.error("❌ FIRECRAWL_API_KEY is missing in .env");
        return;
    }

    console.log(`Checking Firecrawl API with key: ${apiKey.substring(0, 5)}...`);

    try {
        const response = await axios.post(
            "https://api.firecrawl.dev/v1/search",
            {
                query: "manufacturing businesses in Riverside CA",
                limit: 5,
                scrapeOptions: {
                    formats: ["markdown"]
                }
            },
            {
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                }
            }
        );

        if (response.data.success) {
            console.log("✅ Firecrawl Search Successful!");
            console.log(`Found ${response.data.data.length} results.`);
            console.log("Sample Result 1:", response.data.data[0].title);
        } else {
            console.error("❌ Firecrawl returned success: false");
            console.log(response.data);
        }
    } catch (error) {
        console.error("❌ Firecrawl Request Failed:");
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error("Data:", error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

testFirecrawl();
