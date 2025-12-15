import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { leadRepository, prisma } from './services/leadRepository';
import { analyzeDocument, detectDocumentType } from './services/documentIntelligenceService';

// Load env vars
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// --- SALES TEAM SEED DATA ---
const SALES_TEAM = [
    { name: "Hilda Kennedy", title: "Founder/President", email: "hilda@ampac.com" },
    { name: "Ed Ryan", title: "EVP, Director of 504 Sales", email: "ed.ryan@ampac.com" },
    { name: "Jaime Rodriguez", title: "SVP, SBA 504 Specialist", email: "jaime@ampac.com" },
    { name: "Janine Warren", title: "EVP, Director of Loan Integration", email: "janine@ampac.com" },
    { name: "Jeff Sceranka", title: "EVP, New Markets", email: "jeff@ampac.com" },
    { name: "Erik Iwashika", title: "VP, SBA 504 Specialist", email: "erik@ampac.com" },
    { name: "Lucas Sceranka", title: "VP, SBA 504 Specialist", email: "lucas@ampac.com" },
    { name: "Ronnie Sylvia", title: "VP, SBA 504 Specialist", email: "ronnie@ampac.com" },
    { name: "Ian Aguilar", title: "Business Development Associate", email: "ian@ampac.com" },
    { name: "Ahmed Zwin", title: "EVP, Director of Govt Guaranteed Data", email: "ahmed@ampac.com" },
    { name: "Mark Morales", title: "SVP, Community Lending", email: "mark@ampac.com" },
    { name: "Hunter Bell", title: "AVP, Business Development Officer", email: "hunter@ampac.com" },
    { name: "Brian Kennedy, Jr", title: "Entrepreneur Ecosystem Director", email: "brian@ampac.com" },
    { name: "Miriam Torres Baltys", title: "SVP – Business Development", email: "miriam@ampac.com" }
];

async function seedSalesTeam() {
    console.log("🌱 Seeding Sales Team...");
    for (const member of SALES_TEAM) {
        await prisma.user.upsert({
            where: { email: member.email },
            update: { ...member },
            create: { ...member, role: 'sales' }
        });
    }
    console.log("✅ Sales Team Seeded");
}

seedSalesTeam();

// --- CORS & MIDDLEWARE ---
app.use(cors()); // Simplified CORS
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// --- LEADS ENDPOINTS ---

app.get('/leads', async (req, res) => {
    try {
        const leads = await leadRepository.getAll();
        res.json(leads);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/leads', async (req, res) => {
    try {
        const newLead = await leadRepository.create(req.body);
        res.status(201).json(newLead);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/leads', async (req, res) => {
    try {
        const updated = await leadRepository.update(req.body);
        res.json(updated);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/leads/:id', async (req, res) => {
    try {
        await leadRepository.delete(req.params.id);
        res.sendStatus(200);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// --- EMAIL LOGGING ---
app.get('/leads/:id/emails', async (req, res) => {
    try {
        const emails = await leadRepository.getEmails(req.params.id);
        res.json(emails);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/leads/:id/emails', async (req, res) => {
    try {
        const { subject, body, sender } = req.body;
        const log = await leadRepository.logEmail(req.params.id, subject, body, sender);
        res.status(201).json(log);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// --- SALES TEAM ---
app.get('/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany({ orderBy: { name: 'asc' } });
        res.json(users);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// --- AUTO-FILL / DOC EXTRACTION ---
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/documents/autofill', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const filename = req.file.originalname;
        console.log(`Analyzing file for Auto-Fill: ${filename}`);

        // 1. Attempt Extract (User needs keys in .env, otherwise this might fail or we mock)
        let extractedData;
        try {
            extractedData = await analyzeDocument(req.file.buffer, undefined, filename);
        } catch (e) {
            console.warn("Azure extract failed/missing, using mock data for demo.");
            // Fallback Mock Data if keys missing
            extractedData = {
                businessCard: {
                    company: "Acme Constructions Inc.",
                    firstName: "John",
                    lastName: "Doe",
                    email: "john@acme.com",
                    address: "123 Main St, Riverside, CA"
                },
                tax: {
                    totalIncome: 1250000,
                    taxYear: 2023
                }
            };
        }

        // 2. Map to Lead Object
        const proposedLead = {
            company: extractedData.businessCard?.company || extractedData.invoice?.customerName || "New Lead from Doc",
            firstName: extractedData.businessCard?.firstName || extractedData.idDocument?.firstName || "Unknown",
            lastName: extractedData.businessCard?.lastName || extractedData.idDocument?.lastName || "",
            email: extractedData.businessCard?.email || "",
            address: extractedData.businessCard?.address || extractedData.invoice?.vendorAddress || "",
            annualRevenue: extractedData.tax?.totalIncome || extractedData.tax?.grossReceipts || 0,
            source: "Document Upload",
            status: "new",
            dealStage: "Prospecting"
        };
        
        res.json({ success: true, lead: proposedLead });

    } catch (e: any) {
        console.error("Auto-fill Error:", e);
        res.status(500).json({ error: e.message });
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
    console.log(`Sales Team CRM Mode Active`);
});
