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

app.post('/api/underwriting/financials', (req, res) => {
    try {
        const result = financialAgent.calculateRatios(req.body);
        res.json(result);
    } catch (e: any) {
        console.error("Financial Calc Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// --- ROUTES ---

// 1. Google Search (SerpApi Proxy)
app.get('/api/search/google', async (req, res) => {
    const query = req.query.query as string;
    const SERPAPI_KEY = process.env.VITE_SERPAPI_KEY || process.env.SERPAPI_KEY;

    if (!query) return res.status(400).json({ error: "Missing query parameter" });

    if (!SERPAPI_KEY) {
        // Demo Fallback
        return res.json({
            status: "OK",
            results: [{
                name: "Demo Machine Shop (No API Key)",
                formatted_address: "123 Industrial Way, Riverside, CA 92501",
                rating: 4.5,
                user_ratings_total: 120,
                types: ["point_of_interest"],
                place_id: "demo_id_1"
            }]
        });
    }

    try {
        let smartQuery = query;
        const lowerQuery = query.toLowerCase();
        if (!lowerQuery.includes('shop') && !lowerQuery.includes('hotel')) {
            if (lowerQuery.includes('machine') || lowerQuery.includes('manufacturing')) {
                smartQuery += " OR Machine Shop OR Manufacturer";
            }
        }

        console.log(`Searching SerpApi: ${smartQuery}`);
        const response = await axios.get("https://serpapi.com/search", {
            params: {
                engine: "google_maps",
                q: smartQuery,
                api_key: SERPAPI_KEY,
                type: "search",
                ll: "@33.9533,-117.3962,11z"
            }
        });

        const results = response.data.local_results || [];
        const mappedResults = results.map((place: any) => ({
            name: place.title,
            formatted_address: place.address,
            rating: place.rating,
            user_ratings_total: place.reviews,
            types: [place.type],
            place_id: place.place_id || place.data_id
        }));

        res.json({ status: "OK", results: mappedResults });
    } catch (error: any) {
        console.error("Search Error:", error.message);
        res.status(500).json({ error: error.message });
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
