import axios from 'axios';

const BRAIN_SERVICE_URL = process.env.BRAIN_SERVICE_URL || "https://brain-service-952649324958.us-central1.run.app";

export class BrainService {
    async getNextAction(lead: any): Promise<string> {
        try {
            const response = await axios.post(`${BRAIN_SERVICE_URL}/v1/agents/trigger`, {
                agent: "sales_coach",
                input: { lead }
            });
            return response.data.action || "Check in";
        } catch (error) {
            console.error("Error calling Brain Service:", error);
            return "Review manually";
        }
    }

    async generateEmail(lead: any, type: string): Promise<string> {
        try {
            const context = {
                program: lead.loanProgram || 'General',
                stage: lead.dealStage || 'Prospecting',
                topic: type,
                financials: {
                    revenue: lead.annualRevenue,
                    netIncome: lead.netIncome
                },
                deal: {
                    projectCost: lead.projectCost,
                    useOfFunds: lead.useOfFunds,
                    propertyType: lead.propertyType
                },
                recentNotes: lead.notes?.slice(0, 3).map((n: any) => n.content).join('; ')
            };

            const prompt = `
                Write a ${context.program} SBA email for a lead in ${context.stage} stage. 
                Topic: ${context.topic}.
                Context:
                - Financials: Rev $${context.financials.revenue || '?'}, NI $${context.financials.netIncome || '?'}
                - Deal: ${context.program === '504' ? `Cost $${context.deal.projectCost}, Type ${context.deal.propertyType}` : `Use: ${context.deal.useOfFunds}`}
                - Recent Notes: ${context.recentNotes || 'None'}
            `;

            const response = await axios.post(`${BRAIN_SERVICE_URL}/v1/agents/trigger`, {
                agent: "copywriter",
                input: {
                    lead,
                    type,
                    context: prompt
                }
            });
            return response.data.content || "Draft email...";
        } catch (error) {
            console.error("Error calling Brain Service:", error);
            return "Error generating email.";
        }
    }

    async analyzeDeal(lead: any): Promise<string> {
        try {
            const response = await axios.post(`${BRAIN_SERVICE_URL}/v1/agents/trigger`, {
                agent: "underwriter",
                input: {
                    lead,
                    task: "analyze_eligibility"
                }
            });
            return response.data.content || "Analysis pending...";
        } catch (error) {
            console.error("Error analyzing deal:", error);
            return "Could not analyze deal.";
        }
    }
}

export const brainService = new BrainService();
