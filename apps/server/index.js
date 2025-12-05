const express = require('express');
require('dotenv').config({ path: '.env.server' });
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SerpAPI Proxy - avoids CORS issues
app.get('/api/search/businesses', async (req, res) => {
    const { query, location, depth } = req.query;
    const apiKey = process.env.SERPAPI_KEY || process.env.VITE_SERPAPI_KEY;

    if (!apiKey) {
        return res.status(500).json({
            error: 'SerpAPI key not configured',
            demo: true,
            local_results: []
        });
    }

    if (!query || !location) {
        return res.status(400).json({ error: 'query and location are required' });
    }

    try {
        const searchQuery = `${query} in ${location}`;
        const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(searchQuery)}&api_key=${apiKey}`;

        console.log(`[SerpAPI] Searching: ${searchQuery}`);

        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error('[SerpAPI] Error:', data.error);
            return res.status(500).json({ error: data.error, local_results: [] });
        }

        console.log(`[SerpAPI] Found ${data.local_results?.length || 0} results`);
        res.json(data);
    } catch (error) {
        console.error('[SerpAPI] Failed:', error.message);
        res.status(500).json({ error: error.message, local_results: [] });
    }
});

// OpenAI Proxy for AI enrichment
app.post('/api/ai/enrich', async (req, res) => {
    const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'OpenAI key not configured' });
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('[OpenAI] Failed:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Lead Scout API Server running on port ${PORT}`);
    console.log(`   SerpAPI: ${process.env.SERPAPI_KEY ? '✓ Configured' : '✗ Not configured'}`);
    console.log(`   OpenAI:  ${process.env.OPENAI_API_KEY ? '✓ Configured' : '✗ Not configured'}`);
});
