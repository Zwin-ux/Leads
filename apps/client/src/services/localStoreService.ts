import type { Lead } from "@leads/shared";
import { mockLeads } from "../mockData";

const STORAGE_KEY = "leads_demo_data";
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
        try {
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
                })
            });

            if (!response.ok) throw new Error("AI Service failed");
            const data = await response.json();
            return data.content || "Could not generate email.";
        } catch (e) {
            console.error("AI Error:", e);
            return "Error connecting to AI Brain. Please check CORS or service status.";
        }
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
}

export const localStoreService = new LocalStoreService();
