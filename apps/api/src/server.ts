import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { leadRepository } from './services/leadRepository';
import { brainService } from './services/brainService';
import { graphService } from './services/graphService';
import { graphToolbox } from './services/graphToolbox';
import type { Lead, AdRequest, SalesPerson } from "@leads/shared";

// Load env vars
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// --- NUCLEAR CORS SETUP ---
// We are manually injecting headers to ensure they are ALWAYS present.
// This bypasses the 'cors' library logic which might be filtering origins unexpectedly.
app.use((req, res, next) => {
    // Log for debugging
    const origin = req.headers.origin;
    console.log(`[REQUEST] ${req.method} ${req.path} | Origin: ${origin}`);

    // If Origin is present, echo it back. Otherwise allow ALL (for non-browser tools).
    if (origin) {
        res.header("Access-Control-Allow-Origin", origin);
    } else {
        res.header("Access-Control-Allow-Origin", "*");
    }

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

// --- FILE UPLOAD (MULTER) ---
import multer from 'multer';
import { analyzeStream, analyzeDocument, detectDocumentType, type DocumentModelType } from './services/documentIntelligenceService';

const upload = multer({ storage: multer.memoryStorage() });

// Legacy endpoint (backwards compatible)
app.post('/api/documents/extract', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        console.log(`Processing file: ${req.file.originalname} (${req.file.size} bytes)`);
        const result = await analyzeStream(req.file.buffer);

        if (!result) {
            return res.status(422).json({ error: "Could not extract data from document" });
        }

        res.json({ success: true, data: result });

    } catch (e: any) {
        console.error("Doc Extraction Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// NEW: Enhanced document analysis endpoint with all models
app.post('/api/documents/analyze', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const filename = req.file.originalname;
        const requestedModel = req.body.model as DocumentModelType | undefined;

        // Auto-detect or use requested model
        const model = requestedModel || detectDocumentType(filename);

        console.log(`Analyzing file: ${filename} (${req.file.size} bytes) with model: ${model}`);
        const result = await analyzeDocument(req.file.buffer, model, filename);

        res.json({
            success: true,
            detectedModel: model,
            requestedModel: requestedModel || 'auto',
            data: result
        });

    } catch (e: any) {
        console.error("Enhanced Doc Analysis Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// GET available models
app.get('/api/documents/models', (req, res) => {
    res.json({
        models: [
            { id: 'prebuilt-tax.us.1040', name: 'Form 1040 (Personal Tax)', category: 'tax' },
            { id: 'prebuilt-tax.us.1120', name: 'Form 1120 (Corporate Tax)', category: 'tax' },
            { id: 'prebuilt-invoice', name: 'Invoice', category: 'financial' },
            { id: 'prebuilt-receipt', name: 'Receipt', category: 'financial' },
            { id: 'prebuilt-businessCard', name: 'Business Card', category: 'contact' },
            { id: 'prebuilt-idDocument', name: 'ID Document', category: 'identity' },
            { id: 'prebuilt-document', name: 'General Document (OCR)', category: 'general' }
        ]
    });
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
            // Trigger "Jump Ball" notification
            await teamsService.sendNewLeadNotification(newLead);
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

// --- PORTED AZURE FUNCTIONS ---

// Mock Sales Team Data
const SALES_TEAM: Partial<SalesPerson>[] = [
    { id: 'sp1', name: 'Ed Ryan', title: 'SVP, Business Development', phone: '909-258-4585', email: 'ed.ryan@ampac.com' },
    { id: 'sp3', name: 'Sarah Jenkins', title: 'Business Development Officer', phone: '909-555-0103', email: 'sarah.j@ampac.com' }
];

app.post('/generateAd', async (req, res) => {
    try {
        console.log("Generating ad script...");
        const body = req.body as AdRequest;
        const { product, goal, tone, length, salesPersonId, notes } = body;

        let salesPersonContext = "Contact: AmPac Business Capital (909) 915-1706";
        if (salesPersonId) {
            const sp = SALES_TEAM.find(s => s.id === salesPersonId);
            if (sp) {
                salesPersonContext = `
                Call to Action Contact:
                Name: ${sp.name}
                Title: ${sp.title}
                Phone: ${sp.phone}
                Email: ${sp.email}
                `;
            }
        }

        let targetContext = "";
        if (body.targetBusiness) {
            targetContext = `
            Target Business Context:
            Name: ${body.targetBusiness.name}
            Industry: ${body.targetBusiness.industry || 'Unknown'}
            Location: ${body.targetBusiness.city || ''}, ${body.targetBusiness.state || ''}
            
            Instruction: Tailor the script specifically to address pain points common in the ${body.targetBusiness.industry} industry. 
            Mention the business name "${body.targetBusiness.name}" naturally in the script if appropriate.
            `;
        }

        const prompt = `
        Create a ${length} video ad script for AmPac Business Capital.
        Product: ${product}
        Goal: ${goal}
        Tone: ${tone}
        ${notes ? `Additional Notes: ${notes}` : ''}
        ${targetContext}
        ${salesPersonContext}

        Format Requirements:
        - Return strictly valid JSON.
        - Structure: { "hooks": ["..."], "beats": ["..."], "caption": "..." }
        - Hooks: 3 punchy opening lines options.
        - Beats: The visual/audio flow of the ad (step by step).
        - Caption: A social media caption with hashtags.
        `;

        let result;
        try {
            result = await brainService.generateAdScript({ prompt });
        } catch (e) {
            console.log("Brain service failed, using fallback mock.");
            result = {
                hooks: [
                    "Stop renting, start owning.",
                    "The SBA 504 loan uses your rent money to buy your building.",
                    "AmPac makes buying your own building easy."
                ],
                beats: [
                    "Visual: Business owner looking at a 'For Lease' sign frustrate.",
                    "Audio: Tired of rent hikes killing your profits?",
                    "Visual: AmPac logo slides in with a confident handshake.",
                    "Audio: With AmPac's SBA 504 Program, you can buy your building with just 10% down.",
                    `Visual: Text appears - Call ${salesPersonContext.split('\n')[2]?.split(':')[1]?.trim() || 'AmPac'} today.`,
                    "Audio: Stop renting. Start building wealth."
                ],
                caption: `Why rent when you can own? 🏢 The SBA 504 loan helps you buy your business property with low down payments. Call us today! #SmallBusiness #AmPac #SBA504`
            };
        }

        res.json(result);
    } catch (error: any) {
        console.error(`Error generating ad: ${error}`);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/processLead', async (req, res) => {
    try {
        console.log("Processing lead request");
        const { lead, action, accessToken, toolName, args } = req.body;

        if (!lead || !action) {
            return res.status(400).send("Missing lead or action");
        }

        let result: any = {};

        if (action === "getNextAction") {
            const nextAction = await brainService.getNextAction(lead);
            result = { nextAction };
        } else if (action === "sendEmail") {
            if (!accessToken) return res.status(401).send("Missing access token");

            // 1. Fetch Context from Graph
            let lastEmails: string[] = [];
            let slots: string[] = [];

            try {
                if (lead.email) {
                    lastEmails = await graphService.listEmailsFrom(accessToken, lead.email);
                }
                slots = await graphService.getAvailableSlots(accessToken);
            } catch (err) {
                console.warn("Graph Context Fetch Failed:", err);
            }

            // 2. Generate Smart Email
            const emailType = (req.body.type as string) || "Intro";
            const content = await brainService.generateSmartEmail(lead, emailType, {
                lastEmails,
                slots
            });
            result = { emailContent: content.body, subject: content.subject };



        } else if (action === "analyzePhysics") {
            const { dealPhysics } = await import('./services/dealPhysicsService');
            const analysis = dealPhysics.analyze(lead);
            result = { analysis };



        } else if (action === "analyzeDocument") {
            const { fileUrl } = req.body;
            if (!fileUrl) throw new Error("fileUrl required");

            const { docService } = await import('./services/docIntelligenceService');
            const taxData = await docService.analyzeTaxReturn(fileUrl);
            result = { taxData };



        } else if (action === "spreadFinancials") {
            const { taxData, proposedDebt } = req.body;
            if (!taxData) throw new Error("taxData required");

            const { spreadingService } = await import('./services/spreadingService');
            const spread = spreadingService.spread(taxData, proposedDebt || 0);
            result = { spread };



        } else if (action === "conveneCouncil") {
            const { lead, spread } = req.body;
            if (!lead || !spread) throw new Error("lead and spread result required");

            const { councilService } = await import('./services/councilService');
            const councilReport = await councilService.conveneCouncil(lead, spread);
            result = { councilReport };

        } else if (action === "analyzeDeal") {
            const analysis = await brainService.analyzeDeal(lead);
            result = { analysis };
        } else if (action === "executeGraphTool") {
            if (!accessToken) return res.status(401).send("Missing access token");
            if (!toolName || !args) return res.status(400).send("Missing toolName or args");

            try {
                const toolResult = await graphToolbox.executeTool(accessToken, toolName, args);
                result = { toolResult };
            } catch (err: any) {
                return res.status(500).send(`Tool execution failed: ${err.message}`);
            }
        } else if (action === "getGraphTools") {
            result = { tools: graphToolbox.getTools() };
        }

        res.json(result);
    } catch (error: any) {
        console.error(`Error processing lead: ${error.message}`);
        res.status(500).send(error.message);
    }
});

app.post('/research', async (req, res) => {
    try {
        const { query, type } = req.body;
        const SERPAPI_KEY = process.env.SERPAPI_KEY || "demo_key";

        if (!query) return res.status(400).send("Missing query");

        if (SERPAPI_KEY === "demo_key" || !SERPAPI_KEY) {
            // DEMO MODE: Provide consistent but labeled mock data due to missing API Key
            console.log("Using Mock Research Data (Missing SERPAPI_KEY)");
            await new Promise(resolve => setTimeout(resolve, 800)); // Simulate latency

            if (type === 'business') {
                return res.json({
                    summary: `[DEMO] ${query} is a verified business. (Add SERPAPI_KEY for real data)`,
                    headcount: "10-50 employees (est)",
                    flags: ["No recent bankruptcies", "Active entity"],
                    news: "Featured in local news for community service."
                });
            } else {
                return res.json({
                    winRate: "High (est. 80%) [DEMO]",
                    speed: "Fast (avg 25 days)",
                    leverage: "Known for SBA 504 deals in this region."
                });
            }
        }

        const response = await axios.get("https://serpapi.com/search", {
            params: {
                engine: "google",
                q: query,
                api_key: SERPAPI_KEY,
                num: 3
            }
        });

        const results = response.data;
        if (type === 'business') {
            const snippet = results.organic_results?.[0]?.snippet || "No summary found.";
            const title = results.organic_results?.[0]?.title || "";
            const knowledgeGraph = results.knowledge_graph;
            const revenue = knowledgeGraph?.revenue || "Unknown";
            const owner = knowledgeGraph?.founder || knowledgeGraph?.ceo || "Unknown";

            res.json({
                summary: `${title}: ${snippet}`,
                headcount: "Check LinkedIn for exact numbers",
                flags: ["Verify entity status manually"],
                revenue: revenue,
                owner: owner,
                news: results.news_results?.[0]?.title || "No recent news found."
            });
        } else {
            const snippet = results.organic_results?.[0]?.snippet || "No public profile found.";
            res.json({
                winRate: "Unknown (Requires internal data)",
                speed: "Unknown",
                leverage: `Public info: ${snippet}`
            });
        }
    } catch (error: any) {
        console.error(`Error fetching research: ${error}`);
        res.status(500).send("Failed to fetch research data");
    }
});

// --- TEAMS NOTIFICATION ---
import { teamsService } from './services/teamsService';

app.post('/api/notify/teams', async (req, res) => {
    try {
        const lead = req.body;
        if (!lead || !lead.company) {
            return res.status(400).send("Invalid lead data");
        }
        await teamsService.sendDealFundedNotification(lead);
        res.json({ success: true, message: "Notification sent" });
    } catch (error: any) {
        console.error("Teams Notification Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/greenlight', async (req, res) => {
    try {
        const { leadId, companyName, accessToken } = req.body;
        if (!accessToken) return res.status(401).json({ error: "Missing access token" });
        if (!companyName) return res.status(400).json({ error: "Missing company name" });

        console.log(`Greenlighting ${companyName}...`);
        const result = await graphService.createLeadStructure(accessToken, companyName);

        // Ideally update Lead with the Folder URL here
        // await leadRepository.update({ id: leadId, folderUrl: result.webUrl });

        res.json(result);
    } catch (error: any) {
        console.error("Greenlight Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/handoff', async (req, res) => {
    try {
        const { leadId, companyName, bdoEmail, uwEmail, accessToken } = req.body;

        if (!accessToken) return res.status(401).json({ error: "Missing access token" });
        if (!bdoEmail || !uwEmail) return res.status(400).json({ error: "Missing emails for attendees" });

        console.log(`Scheduling Handoff for ${companyName}...`);
        const result = await graphService.scheduleHandoff(accessToken, bdoEmail, uwEmail, companyName);

        res.json({ success: true, event: result });
    } catch (error: any) {
        console.error("Handoff Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/scenario', async (req, res) => {
    try {
        const { industry, amount, collateral, story, bdo } = req.body;
        console.log(`Processing Scenario from ${bdo}...`);

        await teamsService.sendScenarioCard({ industry, amount, collateral, story, bdo });

        res.json({ success: true, message: "Scenario sent to Underwriting Desk" });
    } catch (error: any) {
        console.error("Scenario Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- JOBS (Cron) ---
app.post('/api/jobs/check-stalled', async (req, res) => {
    try {
        console.log("Running Stalled Deal Check...");
        const leads = await leadRepository.getAll();
        const STALL_THRESHOLD_DAYS = 10;
        const now = new Date();

        let notifiedCount = 0;

        for (const lead of leads) {
            if (lead.stage === 'In Process' && lead.loanAmount && lead.loanAmount > 500000) {
                const lastContact = lead.lastContactDate ? new Date(lead.lastContactDate) : new Date(lead.createdAt || now);
                const diffTime = Math.abs(now.getTime() - lastContact.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > STALL_THRESHOLD_DAYS) {
                    console.log(`Stalled Deal: ${lead.company} (${diffDays} days)`);
                    await teamsService.sendStalledDealNotification(lead, diffDays);
                    notifiedCount++;
                }
            }
        }

        res.json({ success: true, notified: notifiedCount });
    } catch (error: any) {
        console.error("Job Error:", error);
        res.status(500).json({ error: error.message });
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
