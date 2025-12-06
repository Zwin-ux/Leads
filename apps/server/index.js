const express = require('express');
require('dotenv').config({ path: '.env.server' });
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all origins
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://localhost:3000',
    'http://localhost:3001',
    'https://leads-production-e11a.up.railway.app'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());

// ---------------------------------------------------------
// LOGGING MIDDLEWARE
// ---------------------------------------------------------
app.use((req, res, next) => {
    const start = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    req.id = requestId;

    console.log(`[${new Date().toISOString()}] [REQ] [${requestId}] ${req.method} ${req.url} [Origin: ${req.headers.origin || 'None'}]`);

    // Hook into response finish to log duration and status
    res.on('finish', () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 400 ? 'ERROR' : 'INFO';
        console.log(`[${new Date().toISOString()}] [${level}] [${requestId}] ${req.method} ${req.url} ${res.statusCode} (${duration}ms)`);
    });

    next();
});

// Helper for comprehensive error logging
const logError = (context, error, req) => {
    console.error(`[${new Date().toISOString()}] [ERROR] [${req?.id || 'SYSTEM'}] [${context}]`, {
        message: error.message,
        stack: error.stack,
        url: req?.url,
        body: req?.body,
        query: req?.query
    });
};

// Google Places Proxy
app.get('/api/search/google', async (req, res) => {
    const { query, type } = req.query;
    const apiKey = process.env.GOOGLE_MAPS_KEY || process.env.VITE_GOOGLE_MAPS_KEY;

    if (!apiKey) return res.status(500).json({ error: 'Google API key not configured' });

    try {
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        logError('GoogleMaps Failed', error, req);
        res.status(500).json({ error: error.message });
    }
});

// In-Memory Leads Store (for production demo resilience)
let leadsStore = [];

app.get('/api/leads', (req, res) => {
    res.json(leadsStore);
});

app.post('/api/leads', (req, res) => {
    const lead = req.body;
    leadsStore.push(lead);
    res.json(lead);
});

app.put('/api/leads', (req, res) => {
    const updatedLead = req.body;
    leadsStore = leadsStore.map(l => l.id === updatedLead.id ? updatedLead : l);
    res.json(updatedLead);
});

app.delete('/api/leads/:id', (req, res) => {
    const { id } = req.params;
    leadsStore = leadsStore.filter(l => l.id !== id);
    res.json({ success: true });
});

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
        logError('SerpAPI Failed', error, req);
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
        logError('OpenAI Failed', error, req);
        res.status(500).json({ error: error.message });
    }
});

// SEC Proxy
app.get('/api/sec/submissions/:cik', async (req, res) => {
    const { cik } = req.params;
    try {
        const response = await fetch(`https://data.sec.gov/submissions/CIK${cik}.json`, {
            headers: {
                'User-Agent': 'AmPac Capital underwriting@ampaccapital.com', // Required by SEC
                'Accept-Encoding': 'gzip, deflate',
                'Host': 'data.sec.gov'
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: 'SEC API Error' });
        }
        const data = await response.json();
        res.json(data);
    } catch (error) {
        logError('SEC Proxy Error', error, req);
        res.status(500).json({ error: 'Proxy Request Failed' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Lead Scout API Server running on port ${PORT}`);
    console.log(`   SerpAPI: ${process.env.SERPAPI_KEY ? '✓ Configured' : '✗ Not configured'}`);
    console.log(`   OpenAI:  ${process.env.OPENAI_API_KEY ? '✓ Configured' : '✗ Not configured'}`);
});
