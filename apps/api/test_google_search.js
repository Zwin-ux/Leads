const axios = require('axios');
async function test() {
    try {
        console.log("Testing googleSearch endpoint (SerpApi Proxy)...");
        const res = await axios.get('http://localhost:7071/api/search/google', {
            params: { query: 'Machine Shop in Riverside' }
        });
        console.log("Status:", res.status);
        console.log("Data:", JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error("Error:", e.message);
        if (e.response) {
            console.error("Response:", e.response.status, e.response.data);
        }
    }
}
test();
