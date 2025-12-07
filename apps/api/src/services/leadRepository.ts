import type { Lead } from "@leads/shared";

// --- IN-MEMORY REPOSITORY (No Database Required) ---
// This serves as a "Demo/Dev" mode so the app works immediately.
// Data is stored in RAM and will reset when the server restarts.

export class LeadRepository {
    // Determine initial state or empty
    private leads: Map<string, Lead> = new Map();

    constructor() {
        console.log("Initializing In-Memory Lead Repository...");
        // Add some dummy data for testing?
        // Optional: Pre-populate
    }

    async getAll(): Promise<Lead[]> {
        return Array.from(this.leads.values());
    }

    async create(lead: Lead): Promise<Lead> {
        // Ensure ID
        if (!lead.id) {
            lead.id = Math.random().toString(36).substring(7);
        }
        this.leads.set(lead.id, lead);
        return lead;
    }

    async update(lead: Lead): Promise<Lead> {
        if (!this.leads.has(lead.id)) {
            throw new Error(`Lead with ID ${lead.id} not found`);
        }
        this.leads.set(lead.id, lead);
        return lead;
    }

    async bulkCreate(leads: Lead[]): Promise<void> {
        for (const lead of leads) {
            if (!lead.id) {
                lead.id = Math.random().toString(36).substring(7);
            }
            this.leads.set(lead.id, lead);
        }
    }
}

export const leadRepository = new LeadRepository();
