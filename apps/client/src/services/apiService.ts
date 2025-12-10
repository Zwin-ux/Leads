import type { Lead } from "@leads/shared";

import { localStoreService } from "./localStoreService";
import { authService } from "./authService";
import { scoringService } from "./scoringService";

const getApiUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (!envUrl) return 'http://localhost:3001';
    if (envUrl.startsWith('http')) return envUrl;
    return `https://${envUrl}`;
};
const API_URL = getApiUrl();
const IS_DEMO = import.meta.env.VITE_DEMO_MODE === "true";

export class ApiService {
    constructor() {
        console.log("ApiService initialized with URL:", API_URL);
    }

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


    async generateAd(request: any): Promise<any> {
        // request is AdRequest from shared
        if (IS_DEMO) {
            // Mock response in demo mode if API not running
            return new Promise(resolve => setTimeout(() => resolve({
                hooks: ["Demo Hook 1", "Demo Hook 2"],
                beats: ["Beat 1", "Beat 2"],
                caption: "Demo Caption"
            }), 1000));
        }

        const response = await fetch(`${API_URL}/generateAd`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request)
        });

        if (!response.ok) throw new Error("Ad generation failed");
        return await response.json();
    }

    async triggerGreenlight(lead: Lead, accessToken: string): Promise<any> {
        if (IS_DEMO) return { success: true, path: '/Demo/Path', webUrl: '#' };

        const response = await fetch(`${API_URL}/api/greenlight`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                leadId: lead.id,
                companyName: lead.company,
                accessToken
            })
        });

        if (!response.ok) throw new Error("Failed to greenlight");
        return await response.json();
    }

    async scheduleHandoff(lead: Lead, accessToken: string, bdoEmail: string, uwEmail: string): Promise<any> {
        if (IS_DEMO) return { success: true, event: { subject: 'Demo Meeting' } };

        const response = await fetch(`${API_URL}/api/handoff`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                leadId: lead.id,
                companyName: lead.company,
                bdoEmail,
                uwEmail,
                accessToken
            })
        });

        if (!response.ok) throw new Error("Failed to schedule handoff");
        return await response.json();
    }
    async triggerScenario(data: any, accessToken: string): Promise<any> {
        if (IS_DEMO) return { success: true };
        const response = await fetch(`${API_URL}/api/scenario`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, accessToken })
        });
        if (!response.ok) throw new Error("Scenario failed");
        return await response.json();
    }

    async generateSmartEmail(lead: Lead, accessToken: string, type: string): Promise<{ subject: string, body: string }> {
        if (IS_DEMO) return { subject: "Demo Subject", body: "Demo Body" };

        const response = await fetch(`${API_URL}/processLead`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'sendEmail',
                lead,
                type,
                accessToken
            })
        });

        if (!response.ok) throw new Error("Generation failed");
        const data = await response.json();
        return { subject: data.subject || "Draft", body: data.emailContent };
    }

    async updateStipulations(_leadId: string, _stips: any[], _accessToken: string): Promise<any> {
        // In a real app, PATCH /leads/:id
        // For now, we simulate success
        if (IS_DEMO) return { success: true };

        // If we had a real endpoint:
        /*
        await fetch(`${API_URL}/leads/${leadId}`, {
            method: 'PATCH',
            body: JSON.stringify({ stipulations: stips })
        });
        */
        return { success: true };
    }

    async analyzeLeadPhysics(lead: Lead, accessToken: string): Promise<any> {
        if (IS_DEMO) {
            // Mock Physics for Demo
            const loan = lead.loanAmount || 0;
            const rev = lead.annualRevenue || 0;
            const noi = rev * 0.15; // Assume 15% margin
            const debt = loan * 0.08; // Rough debt service
            const dscr = debt > 0 ? (noi / debt) : 0;

            return {
                dscr: Number(dscr.toFixed(2)),
                ltv: 0.85,
                status: dscr < 1.15 ? 'Caution' : 'Healthy',
                flags: dscr < 1.15 ? ['DSCR Low'] : [],
                suggestions: dscr < 1.15 ? ['Increase Down Payment'] : []
            };
        }

        const response = await fetch(`${API_URL}/processLead`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'analyzePhysics',
                lead,
                accessToken
            })
        });

        if (!response.ok) throw new Error("Analysis failed");
        const data = await response.json();
        return data.analysis;
    }
}

export const apiService = new ApiService();
