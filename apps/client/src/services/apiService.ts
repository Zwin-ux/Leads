import type { Lead } from "@leads/shared";

import { localStoreService } from "./localStoreService";
import { authService } from "./authService";
import { scoringService } from "./scoringService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7071/api";
const IS_DEMO = import.meta.env.VITE_DEMO_MODE === "true";

export class ApiService {
    async getLeads(): Promise<Lead[]> {
        if (IS_DEMO) {
            const user = authService.getCurrentUser();
            if (!user) throw new Error("User not authenticated");
            return localStoreService.getLeads(user.email);
        }
        const response = await fetch(`${API_URL}/leads`);
        if (!response.ok) throw new Error("Failed to fetch leads");
        return await response.json();
    }

    async createLead(lead: Lead): Promise<Lead> {
        if (IS_DEMO) {
            const user = authService.getCurrentUser();
            if (!user) throw new Error("User not authenticated");
            return localStoreService.createLead(user.email, lead);
        }
        const response = await fetch(`${API_URL}/leads`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(lead)
        });
        if (!response.ok) throw new Error("Failed to create lead");
        return await response.json();
    }

    async updateLead(lead: Lead): Promise<Lead> {
        if (IS_DEMO) {
            const user = authService.getCurrentUser();
            if (!user) throw new Error("User not authenticated");
            return localStoreService.updateLead(user.email, lead);
        }
        const response = await fetch(`${API_URL}/leads`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(lead)
        });
        if (!response.ok) throw new Error("Failed to update lead");
        return await response.json();
    }

    async deleteLead(leadId: string): Promise<void> {
        if (IS_DEMO) {
            const user = authService.getCurrentUser();
            if (!user) throw new Error("User not authenticated");
            return localStoreService.deleteLead(user.email, leadId);
        }
        const response = await fetch(`${API_URL}/leads/${leadId}`, {
            method: "DELETE"
        });
        if (!response.ok) throw new Error("Failed to delete lead");
    }

    async importLeads(leads: Lead[]): Promise<void> {
        if (IS_DEMO) {
            const user = authService.getCurrentUser();
            if (!user) throw new Error("User not authenticated");
            return localStoreService.importLeads(user.email, leads);
        }
        const response = await fetch(`${API_URL}/leads`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(leads)
        });
        if (!response.ok) throw new Error("Failed to import leads");
    }

    async generateEmail(lead: Lead): Promise<string> {
        if (IS_DEMO) return localStoreService.generateEmail(lead);
        const response = await fetch(`${API_URL}/processLead`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lead, action: 'sendEmail', accessToken: 'mock_token' })
        });
        const data = await response.json();
        return data.emailContent;
    }

    async analyzeDeal(lead: Lead): Promise<string> {
        // In both Demo and Real modes, we use the local scoring engine for now
        // since it's a heuristic engine running on the client/server.
        // Later this could move to a Python backend.
        const scoreResult = scoringService.calculateScore(lead);
        return JSON.stringify(scoreResult);
    }

    async research(query: string, type: 'business' | 'banker'): Promise<any> {
        if (IS_DEMO) return localStoreService.research(query, type);

        const response = await fetch(`${API_URL}/research`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, type })
        });

        if (!response.ok) throw new Error("Research API failed");
        return await response.json();
    }
}

export const apiService = new ApiService();
