
import { BrainService } from "./brainService";
import { SpreadingResult } from "./spreadingService";
import { Lead } from "@leads/shared";

export interface CouncilOpinion {
    persona: 'Skeptic' | 'Deal Maker' | 'Chairman';
    verdict: 'Approve' | 'Decline' | 'Review';
    confidence: number; // 0-100
    analysis: string;
    keyPoints: string[];
}

export interface CouncilReport {
    opinions: CouncilOpinion[];
    finalRecommendation: string;
    riskScore: number; // 1-10 (10 = High Risk)
}

export class CouncilService {

    // We reuse the existing BrainService for LLM calls
    // But we need to instantiate it or import the singleton.
    // Assuming we can import the singleton `brainService` from `./brainService`

    async conveneCouncil(lead: Lead, financials: SpreadingResult): Promise<CouncilReport> {
        const { brainService } = await import('./brainService');

        const dealContext = `
            Lead: ${lead.company || lead.firstName}
            Loan Request: $${lead.loanAmount?.toLocaleString()}
            Program: ${lead.loanProgram || 'SBA 504'}
            
            Financials (Recasted):
            Revenue: $${financials.revenue.toLocaleString()}
            EBITDA: $${financials.ebitda.toLocaleString()}
            SDE: $${financials.sde.toLocaleString()}
            DSCR: ${financials.dscr}x
            Add-backs: ${financials.addBacks.map(a => `${a.label} ($${a.amount})`).join(', ')}
        `;

        console.log("⚖️ Convening The AI Council...");

        // Parallel Execution of Personas
        const [skepticOpinion, dealMakerOpinion] = await Promise.all([
            this.getSkepticOpinion(brainService, dealContext),
            this.getDealMakerOpinion(brainService, dealContext)
        ]);

        // Chairman synthesizes the arguments
        const chairmanOpinion = await this.getChairmanOpinion(brainService, dealContext, skepticOpinion, dealMakerOpinion);

        return {
            opinions: [skepticOpinion, dealMakerOpinion, chairmanOpinion],
            finalRecommendation: chairmanOpinion.analysis,
            riskScore: chairmanOpinion.confidence // using confidence as risk proxy inverted or separate score? 
            // Actually let's parse risk score from Chairman
        };
    }

    private cleanJson(text: string): string {
        try {
            // Remove markdown code blocks if present
            let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return clean;
        } catch (e) {
            return text;
        }
    }

    private async getSkepticOpinion(brain: BrainService, context: string): Promise<CouncilOpinion> {
        const prompt = `
            You are "The Skeptic", a conservative Risk Officer.
            Your job is to protect the bank's capital. Find every flaw.
            Focus on: Low DSCR, unproven add-backs, industry risks, lack of collateral.
            
            Analyze this deal:
            ${context}
            
            Output strictly JSON:
            { "verdict": "Decline"|"Review", "confidence": number, "analysis": "short paragraph", "keyPoints": ["risk 1", "risk 2"] }
        `;
        const res = await brain.triggerAgent(prompt, "The Skeptic", true);
        const data = JSON.parse(this.cleanJson(res));
        return { persona: 'Skeptic', ...data };
    }

    private async getDealMakerOpinion(brain: BrainService, context: string): Promise<CouncilOpinion> {
        const prompt = `
            You are "The Deal Maker", a senior BDO.
            Your job is to find a way to make the deal work.
            Focus on: Potential growth, borrower strength, strong SDE, government guarantee.
            
            Analyze this deal:
            ${context}
            
            Output strictly JSON:
            { "verdict": "Approve"|"Review", "confidence": number, "analysis": "short paragraph", "keyPoints": ["strength 1", "strength 2"] }
        `;
        const res = await brain.triggerAgent(prompt, "The Deal Maker", true);
        const data = JSON.parse(this.cleanJson(res));
        return { persona: 'Deal Maker', ...data };
    }

    private async getChairmanOpinion(brain: BrainService, context: string, skeptic: CouncilOpinion, dealMaker: CouncilOpinion): Promise<CouncilOpinion> {
        const prompt = `
            You are "The Chairman", the final credit authority.
            Review the arguments from your council:
            
            SKEPTIC SAYS: ${skeptic.analysis} (${skeptic.keyPoints.join(', ')})
            DEAL MAKER SAYS: ${dealMaker.analysis} (${dealMaker.keyPoints.join(', ')})
            
            DEAL CONTEXT: ${context}
            
            Make a final ruling. Be balanced but decisive.
            Output strictly JSON:
            { "verdict": "Approve"|"Decline"|"Review", "confidence": number, "analysis": "Final detailed ruling", "keyPoints": ["Decision Factor 1", "Decision Factor 2"] }
        `;
        const res = await brain.triggerAgent(prompt, "The Chairman", true);
        const data = JSON.parse(this.cleanJson(res));
        return { persona: 'Chairman', ...data };
    }
}

export const councilService = new CouncilService();
