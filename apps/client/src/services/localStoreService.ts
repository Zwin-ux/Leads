import type { Lead } from "@leads/shared";
import { mockLeads } from "../mockData";

const STORAGE_KEY = "leads_demo_data_v3";
const BRAIN_SERVICE_URL = import.meta.env.VITE_BRAIN_SERVICE_URL || "https://brain-service-952649324958.us-central1.run.app";

export class LocalStoreService {
    private getStoredLeads(userEmail: string): Lead[] {
        const key = `${STORAGE_KEY}_${userEmail.toLowerCase()}`;
        const stored = localStorage.getItem(key);
        if (!stored) {
            // Initialize with mock data if empty, but give them fresh IDs
            const freshMocks = mockLeads.map(l => ({ ...l, id: Date.now() + Math.random().toString() }));
            localStorage.setItem(key, JSON.stringify(freshMocks));
            return freshMocks;
        }
        return JSON.parse(stored);
    }

    private saveLeads(userEmail: string, leads: Lead[]) {
        const key = `${STORAGE_KEY}_${userEmail.toLowerCase()}`;
        localStorage.setItem(key, JSON.stringify(leads));
    }

    async getLeads(userEmail: string): Promise<Lead[]> {
        // Simulate network delay for realism
        await new Promise(resolve => setTimeout(resolve, 600));
        return this.getStoredLeads(userEmail);
    }

    async createLead(userEmail: string, lead: Lead): Promise<Lead> {
        await new Promise(resolve => setTimeout(resolve, 400));
        const leads = this.getStoredLeads(userEmail);
        const newLead = { ...lead, id: Date.now().toString() };
        leads.push(newLead);
        this.saveLeads(userEmail, leads);
        return newLead;
    }

    async updateLead(userEmail: string, lead: Lead): Promise<Lead> {
        await new Promise(resolve => setTimeout(resolve, 300));
        const leads = this.getStoredLeads(userEmail);
        const index = leads.findIndex(l => l.id === lead.id);
        if (index !== -1) {
            leads[index] = lead;
            this.saveLeads(userEmail, leads);
            return lead;
        }
        throw new Error("Lead not found");
    }

    async deleteLead(userEmail: string, leadId: string): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 300));
        const leads = this.getStoredLeads(userEmail);
        const filtered = leads.filter(l => l.id !== leadId);
        this.saveLeads(userEmail, filtered);
    }

    async importLeads(userEmail: string, newLeads: Lead[]): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const leads = this.getStoredLeads(userEmail);
        // Assign IDs if missing
        const leadsWithIds = newLeads.map(l => ({
            ...l,
            id: l.id || Date.now().toString() + Math.random()
        }));
        this.saveLeads(userEmail, [...leads, ...leadsWithIds]);
    }

    // --- Real AI Calls ---

    async generateEmail(lead: Lead): Promise<string> {
        // Try the brain service first, fall back to local template
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            const response = await fetch(`${BRAIN_SERVICE_URL}/v1/agents/trigger`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    agent: "copywriter",
                    input: {
                        lead,
                        type: "intro",
                        context: `Write a professional intro email for ${lead.firstName} from ${lead.company}. Program: ${lead.loanProgram || 'SBA'}.`
                    }
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) throw new Error("AI Service failed");
            const data = await response.json();
            return data.content || this.getLocalEmailTemplate(lead);
        } catch (e) {
            console.warn("AI Brain unavailable, using local template:", e);
            return this.getLocalEmailTemplate(lead);
        }
    }

    private getLocalEmailTemplate(lead: Lead): string {
        const program = lead.loanProgram || 'SBA 504';
        const firstName = lead.firstName || 'there';
        const company = lead.company || 'your business';

        return `Hi ${firstName},

I hope this message finds you well! I came across ${company} and was impressed by what you've built.

I'm reaching out from AmPac Business Capital — we specialize in ${program} loans and help business owners like yourself access capital for growth, real estate, and equipment.

Would you be open to a brief call this week to explore if this might be a fit for your goals?

Looking forward to connecting.

Best regards,
[Your Name]
AmPac Business Capital
📞 [Your Phone]`;
    }

    async analyzeDeal(lead: Lead): Promise<string> {
        try {
            const response = await fetch(`${BRAIN_SERVICE_URL}/v1/agents/trigger`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    agent: "underwriter",
                    input: {
                        lead,
                        task: "analyze_eligibility"
                    }
                })
            });

            if (!response.ok) throw new Error("AI Service failed");
            const data = await response.json();
            return data.content || "Analysis unavailable.";
        } catch (e) {
            console.error("AI Error:", e);
            return "Error connecting to AI Brain. Please check CORS or service status.";
        }
    }
    async research(query: string, type: 'business' | 'banker'): Promise<any> {
        await new Promise(resolve => setTimeout(resolve, 1500));
        if (type === 'business') {
            return {
                summary: `${query} is a leading provider in the local sector.`,
                headcount: "10-50 employees",
                flags: ["Recent office expansion", "No lawsuits found"],
                news: "Featured in local business journal last month."
            };
        } else {
            return {
                winRate: "85%",
                speed: "Fast (21 days avg)",
                leverage: "Loves 504 construction deals. Often waives points for repeat clients."
            };
        }
    }
}

export const localStoreService = new LocalStoreService();
