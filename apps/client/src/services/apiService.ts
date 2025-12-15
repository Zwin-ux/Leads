import type { Lead, User } from "@leads/shared";


import { scoringService } from "./scoringService";


const getApiUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (!envUrl) return 'http://localhost:3001';
    if (envUrl.startsWith('http')) return envUrl;
    return `https://${envUrl}`;
};
const API_URL = getApiUrl();
// For this focused CRM, we prefer API mode, but keep demo flag if needed
const IS_DEMO = import.meta.env.VITE_DEMO_MODE === "true";

export class ApiService {
    constructor() {
        console.log("ApiService initialized with URL:", API_URL);
    }

    async getSalesTeam(): Promise<User[]> {
        if (IS_DEMO) return []; // Or mock
        const response = await fetch(`${API_URL}/users`);
        return await response.json();
    }

    async getLeads(): Promise<Lead[]> {
        const response = await fetch(`${API_URL}/leads`);
        if (!response.ok) throw new Error("Failed to fetch leads");
        return await response.json();
    }

    async createLead(lead: Lead): Promise<Lead> {
        const response = await fetch(`${API_URL}/leads`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(lead)
        });
        if (!response.ok) throw new Error("Failed to create lead");
        return await response.json();
    }

    async updateLead(lead: Lead): Promise<Lead> {
        const response = await fetch(`${API_URL}/leads`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(lead)
        });
        if (!response.ok) throw new Error("Failed to update lead");
        return await response.json();
    }

    async deleteLead(leadId: string): Promise<void> {
        const response = await fetch(`${API_URL}/leads/${leadId}`, {
            method: "DELETE"
        });
        if (!response.ok) throw new Error("Failed to delete lead");
    }

    async importLeads(leads: Lead[]): Promise<void> {
        // Simple loop for now since we don't have bulk endpoint exposed
        for (const lead of leads) {
            await this.createLead(lead);
        }
    }

    // --- New Auto-Fill ---
    async uploadAndAutoFill(file: File): Promise<{ success: boolean, lead: Lead }> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_URL}/api/documents/autofill`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error("Auto-fill failed");
        return await response.json();
    }

    // --- Email Organization ---
    async getEmails(leadId: string): Promise<any[]> {
        const response = await fetch(`${API_URL}/leads/${leadId}/emails`);
        if (!response.ok) return [];
        return await response.json();
    }

    async logEmail(leadId: string, email: { subject: string, body: string, sender: string }): Promise<{ id: string, subject: string, body: string, sender: string, timestamp: string }> {
        const response = await fetch(`${API_URL}/leads/${leadId}/emails`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(email)
        });
        if (!response.ok) throw new Error("Failed to log email");
        return await response.json();
    }

    // --- Legacy / Stubs ---
    async generateEmail(lead: Lead): Promise<string> {
        // Simple template fallback since we cut the "Brain"
        return `Hi ${lead.firstName},\n\nHope you are well.\n\nBest,\nAmPac Team`;
    }

    async analyzeDeal(lead: Lead): Promise<string> {
        const scoreResult = scoringService.calculateScore(lead);
        return JSON.stringify(scoreResult);
    }

    // --- Legacy / Stubs for Build Compatibility ---
    async analyzeLeadPhysics(_lead: Lead, _token?: string): Promise<any> {
        return { momentum: 85, friction: 10, probability: 0.75 };
    }

    async scheduleHandoff(_lead: Lead, _token?: string, _bdo?: string, _uw?: string): Promise<any> {
        return { status: 'scheduled', time: new Date().toISOString() };
    }
    
    async triggerWorkflow(_leadId: string, workflow: string): Promise<any> {
        return { status: 'triggered', workflow };
    }

    async triggerGreenlight(_lead: Lead, _token: string): Promise<any> {
        return { path: '/Leads/MockLead', webUrl: 'https://onedrive.live.com' };
    }

    async generateSmartEmail(_lead: Lead, _token: string, type: string): Promise<{ subject: string, body: string }> {
        return { 
            subject: `${type}: ${_lead.company} - 504 Loan Opportunity`, 
            body: `Hi there,\n\nThis is a generated draft for ${type} regarding ${_lead.company}.\n\nBest,\nAmPac Team`
        };
    }
}

export const apiService = new ApiService();
