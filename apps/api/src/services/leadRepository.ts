
import 'dotenv/config';
import { cosmosService } from './cosmosService';
import type { Lead } from "@leads/shared";

export class LeadRepository {

    constructor() {
        console.log("Initializing Cosmos Lead Repository...");
    }

    async getAll(): Promise<Lead[]> {
        try {
            return await cosmosService.getAll<Lead>();
        } catch (e) {
            console.error("Cosmos getAll Error:", e);
            return [];
        }
    }

    async create(lead: Lead): Promise<Lead> {
        try {
            return await cosmosService.create<Lead>(lead);
        } catch (e) {
            console.error("Cosmos create Error:", e);
            throw e;
        }
    }

    async update(lead: Lead): Promise<Lead> {
        if (!lead.id) throw new Error("Cannot update lead without ID");
        try {
            return await cosmosService.update<Lead>(lead as Lead & { id: string });
        } catch (e) {
            console.error("Cosmos update Error:", e);
            throw e;
        }
    }

    async bulkCreate(leads: Lead[]): Promise<void> {
        try {
            for (const lead of leads) {
                await cosmosService.create<Lead>(lead);
            }
        } catch (e) {
            console.error("Cosmos bulkCreate Error:", e);
        }
    }

    async delete(id: string): Promise<void> {
        try {
            await cosmosService.delete(id);
        } catch (e) {
            console.error("Cosmos delete Error:", e);
        }
    }
}

export const leadRepository = new LeadRepository();
