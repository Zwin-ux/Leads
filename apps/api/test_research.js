const axios = require('axios');
async function test() {
    try {
        console.log("Testing research endpoint...");
        const res = await axios.post('http://localhost:7071/api/research', {
            query: 'Machine Shop',
            type: 'business'
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
