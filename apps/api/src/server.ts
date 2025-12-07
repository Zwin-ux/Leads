import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { leadRepository } from './services/leadRepository'; // Assuming this exists or will need checking
import type { Lead } from "@leads/shared";

// Load env vars
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- NUCLEAR CORS SETUP ---
// We are manually injecting headers to ensure they are ALWAYS present.
// This bypasses the 'cors' library logic which might be filtering origins unexpectedly.
app.use((req, res, next) => {
    // Log for debugging
    console.log(`[REQUEST] ${req.method} ${req.path} | Origin: ${req.headers.origin}`);

    res.header("Access-Control-Allow-Origin", "*"); // Allow ALL
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle Preflight
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// --- UNDERWRITING ROUTES ---
import { financialAgent } from './services/financialAgent';
import { councilAgent } from './services/councilAgent';

app.post('/api/underwriting/financials', (req, res) => {
    try {
        const result = financialAgent.calculateRatios(req.body);
        res.json(result);
    } catch (e: any) {
        console.error("Financial Calc Error:", e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/underwriting/council', async (req, res) => {
    try {
        const { businessName, financials } = req.body;

        // 1. Get "Financial Truth" (Ratios) first
        // We reuse the deterministic logic to ensure the AI has accurate math.
        const mathResult = financialAgent.calculateRatios(financials);

        // 2. Convene the Council
        const councilResult = await councilAgent.conveneCouncil({
            businessName: businessName || "Unknown Business",
            financials: financials,
            ratios: mathResult.ratios
        });

        res.json(councilResult);
    } catch (e: any) {
        console.error("Council Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// --- ROUTES ---

// 1. Firecrawl Search (Proxy)
app.get('/api/search/firecrawl', async (req, res) => {
    const query = req.query.query as string;
    const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

    if (!query) return res.status(400).json({ error: "Missing query parameter" });

    if (!FIRECRAWL_API_KEY) {
        console.error("Missing FIRECRAWL_API_KEY");
        return res.status(500).json({ error: "Server missing Firecrawl API Key" });
    }

    try {
        console.log(`Searching Firecrawl: ${query}`);
        const response = await axios.post(
            "https://api.firecrawl.dev/v1/search",
            {
                query: query,
                limit: 10,
                scrapeOptions: {
                    formats: ["markdown"]
                }
            },
            {
                headers: {
                    "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        if (response.data.success) {
            res.json({ status: "OK", data: response.data.data });
        } else {
            throw new Error("Firecrawl returned unsuccessful status");
        }

    } catch (error: any) {
        console.error("Firecrawl Search Error:", error.message);
        console.error("Firecrawl Response:", error.response?.data);
        res.status(500).json({ error: error.message, details: error.response?.data });
    }
});

// 2. Leads CRUD
app.get('/leads', async (req, res, next) => {
    try {
        const leads = await leadRepository.getAll();
        res.json(leads);
    } catch (e) {
        console.error("Leads GET Error:", e);
        // Fallback for Demo if DB fails
        res.json([]);
    }
});

app.post('/leads', async (req, res, next) => {
    try {
        const body = req.body;
        if (Array.isArray(body)) {
            await leadRepository.bulkCreate(body as Lead[]);
            res.status(201).send("Bulk import successful");
        } else {
            const newLead = await leadRepository.create(body as Lead);
            res.status(201).json(newLead);
        }
    } catch (e) {
        next(e);
    }
});

app.put('/leads', async (req, res, next) => {
    try {
        const body = req.body;
        const updated = await leadRepository.update(body);
        res.json(updated);
    } catch (e) {
        next(e);
    }
});

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
    console.error("Global API Error:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`CORS enabled for all origins`);
});
