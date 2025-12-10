import 'dotenv/config';
import OpenAI from "openai";

// Data Models
interface FinancialContext {
    businessName: string;
    financials: any; // Using flexible type for now
    ratios: { dscr: number; ltv: number };
}

export interface CouncilOpinion {
    persona: "Skeptic" | "Deal Maker" | "Chairman";
    recommendation: "Approve" | "Decline" | "Review";
    score: number; // 1-5
    reasoning: string;
    keyPoints: string[];
}

export interface CouncilResult {
    skeptic: CouncilOpinion;
    dealMaker: CouncilOpinion;
    chairman: CouncilOpinion;
}

export class CouncilAgent {
    private openai: OpenAI;

    constructor() {
        const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
        const azureKey = process.env.AZURE_OPENAI_API_KEY;
        const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

        if (azureEndpoint && azureKey) {
            this.openai = new OpenAI({
                baseURL: azureEndpoint,
                apiKey: azureKey,
                defaultHeaders: { "api-key": azureKey },
                dangerouslyAllowBrowser: false
            });
            console.log(`CouncilAgent configured with Azure OpenAI (Deployment: ${deployment})`);
        } else {
            console.warn("WARNING: Azure OpenAI Credentials missing. CouncilAgent will fail.");
            // Fallback for local dev without Azure keys if needed, or just stay broken until config
            const apiKey = process.env.OPENAI_API_KEY || "missing_key";
            this.openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: false });
        }
    }

    async conveneCouncil(context: FinancialContext): Promise<CouncilResult> {
        console.log(`Convening AI Council for ${context.businessName}...`);

        // 1. Parallel Debate (Skeptic vs Deal Maker)
        const [skepticRaw, dealMakerRaw] = await Promise.all([
            this.getPersonaOpinion("Skeptic", context),
            this.getPersonaOpinion("Deal Maker", context)
        ]);

        // 2. Synthesis (Chairman)
        const chairmanRaw = await this.getChairmanVerdict(context, skepticRaw, dealMakerRaw);

        return {
            skeptic: skepticRaw,
            dealMaker: dealMakerRaw,
            chairman: chairmanRaw
        };
    }

    private async getPersonaOpinion(persona: "Skeptic" | "Deal Maker", context: FinancialContext): Promise<CouncilOpinion> {
        let systemPrompt = "";

        if (persona === "Skeptic") {
            systemPrompt = `You are the Chief Credit Officer (Risk Officer) at a conservative bank. 
            Your goal is to PROTECT CAPITAL. Look for DOWNSIDE risks. 
            Be cynical. Focus on high leverage, weak cash flow, or industry headwinds.
            If the DSCR is < 1.20x, be extremely critical.
            Output JSON only.`;
        } else {
            systemPrompt = `You are a Senior Relationship Manager (Sales) at a commercial bank.
            Your goal is to FUND DEALS. Look for UPSIDE and strengths.
            Highlight management experience, collateral, or growth potential.
            If the DSCR is > 1.10x, argue that it's workable.
            Output JSON only.`;
        }

        const userPrompt = `Analyze this deal:
        Business: ${context.businessName}
        Ratios: DSCR ${context.ratios.dscr}x, LTV ${context.ratios.ltv}%
        Financials: ${JSON.stringify(context.financials)}
        
        Return JSON format:
        {
            "recommendation": "Approve" | "Decline",
            "score": number (1-5),
            "reasoning": "short paragraph",
            "keyPoints": ["bullet 1", "bullet 2"]
        }`;

        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4o", // Use high intelligence model
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                response_format: { type: "json_object" }
            });

            const content = completion.choices[0].message.content || "{}";
            const parsed = JSON.parse(content);
            return { persona, ...parsed };

        } catch (e) {
            console.error(`Council Persona ${persona} Failed:`, e);
            return {
                persona,
                recommendation: "Review",
                score: 3,
                reasoning: "Agent failed to analyze.",
                keyPoints: []
            };
        }
    }

    private async getChairmanVerdict(context: FinancialContext, skeptic: CouncilOpinion, dealMaker: CouncilOpinion): Promise<CouncilOpinion> {
        const systemPrompt = `You are the Chairman of the Credit Committee.
        Review the arguments from the Skeptic (Risk) and Deal Maker (Sales).
        Synthesize a final, balanced verdict. You are the 'Judge'.
        Output JSON only.`;

        const userPrompt = `
        Business: ${context.businessName}
        
        Skeptic Says: ${skeptic.reasoning} (Score: ${skeptic.score})
        Key Risks: ${skeptic.keyPoints.join(", ")}
        
        Deal Maker Says: ${dealMaker.reasoning} (Score: ${dealMaker.score})
        Key Strengths: ${dealMaker.keyPoints.join(", ")}
        
        Your Job: Decide.
        Return JSON format:
        {
            "recommendation": "Approve" | "Decline" | "Review",
            "score": number (1-5),
            "reasoning": "Balanced executive summary (~3 sentences)",
            "keyPoints": ["Final Conclusion 1", "Final Conclusion 2"]
        }`;

        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                response_format: { type: "json_object" }
            });

            const content = completion.choices[0].message.content || "{}";
            const parsed = JSON.parse(content);
            return { persona: "Chairman", ...parsed };

        } catch (e) {
            console.error("Chairman Failed:", e);
            return {
                persona: "Chairman",
                recommendation: "Review",
                score: 3,
                reasoning: "Chairman failed to convene.",
                keyPoints: []
            };
        }
    }
}

export const councilAgent = new CouncilAgent();
