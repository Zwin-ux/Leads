
import { AzureKeyCredential, DocumentAnalysisClient } from "@azure/ai-form-recognizer";
import { BrainService } from "./brainService";

const ENDPOINT = process.env.AZURE_FORM_RECOGNIZER_ENDPOINT || "https://ampac.cognitiveservices.azure.com/";
const KEY = process.env.AZURE_FORM_RECOGNIZER_KEY || "";

export class DocIntelligenceService {
    private client: DocumentAnalysisClient;

    constructor() {
        if (!KEY) {
            console.warn("⚠️ AZURE_FORM_RECOGNIZER_KEY not set. Document Extraction will fail in production.");
        }
        this.client = new DocumentAnalysisClient(ENDPOINT, new AzureKeyCredential(KEY || "demo"));
    }

    /**
     * Extracts text and structure from a document (PDF/Image).
     * Uses 'prebuilt-layout' to get raw content for AI processing.
     */
    async extractDocument(fileUrl: string): Promise<string> {
        if (!KEY || KEY === "demo") return "Simulated Document Content: Gross Revenue $1,000,000. Net Income $150,000.";

        try {
            const poller = await this.client.beginAnalyzeDocumentFromUrl("prebuilt-layout", fileUrl);
            const { content } = await poller.pollUntilDone();

            return content || "";
        } catch (error: any) {
            console.error("DocIntelligence Error:", error.message);
            throw new Error(`Failed to extract document: ${error.message}`);
        }
    }

    /**
     * Higher-level function: Extracts Tax Return Data safely.
     * 1. Layout Extraction (Microsoft).
     * 2. Intelligent Parsing (OpenAI).
     */
    async analyzeTaxReturn(fileUrl: string) {
        console.log("📄 Extracting Raw Text from Tax Return...");
        const rawText = await this.extractDocument(fileUrl);

        // Truncate if too long (Tax returns can be huge, just grab the first few pages of text usually containing the core Form 1065/1120)
        const truncatedText = rawText.slice(0, 15000);

        console.log("🧠 Analyzing with AI Underwriter...");
        const prompt = `
        You are an Expert SBA Underwriter.
        Analyze the following text extracted from a Business Tax Return (Form 1065, 1120, or 1120S).
        
        Task: Extract the key financial figures for the "Spread".
        
        Return JSON ONLY:
        {
            "formType": "1065" | "1120" | "1120S" | "Unknown",
            "year": number,
            "grossRevenue": number,
            "netIncome": number,
            "depreciation": number,
            "interestExpense": number,
            "officerCompensation": number,
            "rentExpense": number,
            "notes": "Any warnings or observations"
        }

        Extracted Text:
        ${truncatedText}
        `;

        // We reuse the BrainService implementation style here, but simplified call
        // Assuming brainService is available globally or we import the instance
        // For now, we return the prompt-ready data, or if we want to call LLM here we need BrainService instance.
        // Let's import the singleton if possible.

        try {
            const { brainService } = await import('./brainService');
            const result = await brainService.triggerAgent(prompt, "Extract Tax Data", true); // true = json mode ideally
            return JSON.parse(result);
        } catch (e) {
            console.error("AI Parse Error", e);
            return { error: "Failed to parse tax return data." };
        }
    }
}

export const docService = new DocIntelligenceService();
