import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

// Azure Config
const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
const azureKey = process.env.AZURE_OPENAI_API_KEY;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "Kimi-K2-Thinking";

const client = (azureEndpoint && azureKey)
    ? new OpenAI({
        baseURL: azureEndpoint,
        apiKey: azureKey,
        defaultHeaders: { "api-key": azureKey } // Often required for Azure direct usage if SDK doesn't auth automatically
    })
    : null;

export class BrainService {

    // Core Agent Runner
    public async triggerAgent(systemPrompt: string, userContent: string, jsonMode = false): Promise<string> {
        if (!client) {
            console.warn("BrainService: Azure OpenAI not configured. Using fallback.");
            // Return JSON-like string if jsonMode is requested to prevent JSON.parse crashes
            if (jsonMode) return JSON.stringify({ hooks: [], beats: [], caption: "AI Service Unavailable (Missing Key)" });
            return "AI Service Unavailable. Please configure Azure OpenAI keys.";
        }

        try {
            console.log(`🧠 Brain Thinking... (Model: ${deployment})`);
            const completion = await client.chat.completions.create({
                model: deployment,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userContent }
                ],
                response_format: jsonMode ? { type: "json_object" } : undefined,
                temperature: 0.7,
            });

            return completion.choices[0].message.content || "";
        } catch (error: any) {
            console.error("BrainService Error:", error.message);
            throw error;
        }
    }

    async getNextAction(lead: any): Promise<string> {
        const prompt = `You are a sales coach. Analyze this lead and suggest the SINGLE most important next action (max 5 words).`;
        const content = `Lead: ${lead.firstName} ${lead.lastName}, Company: ${lead.company}. Notes: ${JSON.stringify(lead.notes)}`;
        const result = await this.triggerAgent(prompt, content);
        return result.replace(/['"]/g, '').trim() || "Check in";
    }

    async generateSmartEmail(lead: any, type: string, context: { lastEmails?: string[], slots?: string[], senderName?: string }): Promise<{ subject: string, body: string }> {
        const prompt = `
        You are a top-tier BDO (Business Development Officer) for AmPac Business Capital (SBA 504 Loans).
        Write a short, professional email.
        
        Mode: ${type}
        Sender: ${context.senderName || "AmPac BDO"}
        
        Context:
        - Lead: ${lead.company} (${lead.firstName} ${lead.lastName})
        - Industry: ${lead.industry || 'Unknown'}
        - Need: ${lead.useOfFunds?.join(', ') || 'Capital'}
        - Recent Communication: ${context.lastEmails?.join('\n') || "None"}
        - Available Slots: ${context.slots?.join(', ') || "Flexible"}

        Goal:
        - If 'Intro': highlight SBA 504 benefits (low down payment).
        - If 'FollowUp': Reference recent communication if any.
        - If 'Revival': Short check-in.
        - ALWAYS offer the specific slots if provided.
        
        Output JSON: { "subject": "...", "body": "HTML string..." }
        `;

        const result = await this.triggerAgent(prompt, "Generate email.", true);
        try {
            return JSON.parse(result);
        } catch {
            return { subject: "Error Generating", body: "Could not generate email." };
        }
    }

    async analyzeDeal(lead: any): Promise<string> {
        const prompt = `You are a credit underwriter. Analyze the eligibility of this deal for SBA 504 or 7a financing. Output markdown.`;
        const content = JSON.stringify(lead);
        return await this.triggerAgent(prompt, content);
    }

    async generateAdScript(context: any): Promise<any> {
        const prompt = `You are a scriptwriter. Create a 30s ad script. Return JSON format: { "hooks": [], "beats": [], "caption": "" }`;
        const result = await this.triggerAgent(prompt, JSON.stringify(context), true);
        try {
            return JSON.parse(result);
        } catch {
            return { hooks: [], beats: [], caption: "Error parsing script" };
        }
    }
}

export const brainService = new BrainService();
