
import 'dotenv/config';
import { PrismaClient, Lead } from '@prisma/client';

const prisma = new PrismaClient();

export class LeadRepository {

    constructor() {
        console.log("Initializing Prisma Lead Repository (SQLite)...");
    }

    async getAll(): Promise<Lead[]> {
        try {
            // Prisma returns strings for JSON fields in SQLite. We might need to parse them if the app expects objects.
            // However, the shared type expects objects.
            const leads = await prisma.lead.findMany({
                orderBy: { updatedAt: 'desc' }, 
                include: { assignedTo: true, emails: true }
            });
            return leads.map(this.parseLead);
        } catch (e) {
            console.error("Prisma getAll Error:", e);
            return [];
        }
    }

    async create(data: Partial<Lead>): Promise<Lead> {
        try {
             // Handle JSON fields
            const formatted = this.formatForSave(data);
            const lead = await prisma.lead.create({
                data: formatted
            });
            return this.parseLead(lead);
        } catch (e) {
            console.error("Prisma create Error:", e);
            throw e;
        }
    }

    async update(data:  Partial<Lead> & { id: string }): Promise<Lead> {
        if (!data.id) throw new Error("Cannot update lead without ID");
        try {
            const formatted = this.formatForSave(data);
            const lead = await prisma.lead.update({
                where: { id: data.id },
                data: formatted
            });
            return this.parseLead(lead);
        } catch (e) {
            console.error("Prisma update Error:", e);
            throw e;
        }
    }

    async bulkCreate(leads:  Partial<Lead>[]): Promise<void> {
        try {
            for (const lead of leads) {
                await this.create(lead);
            }
        } catch (e) {
            console.error("Prisma bulkCreate Error:", e);
        }
    }

    async delete(id: string): Promise<void> {
        try {
            await prisma.lead.delete({ where: { id } });
        } catch (e) {
            console.error("Prisma delete Error:", e);
        }
    }

    // --- Email Logging ---
    async logEmail(leadId: string, subject: string, body: string, sender: string) {
        return await prisma.emailLog.create({
            data: {
                leadId,
                subject,
                body,
                sender
            }
        });
    }

    async getEmails(leadId: string) {
        return await prisma.emailLog.findMany({
            where: { leadId },
            orderBy: { sentAt: 'desc' }
        });
    }

    // --- Helpers for SQLite JSON ---
    private formatForSave(data: any): any {
        const out = { ...data };
        // Clean up undefined
        Object.keys(out).forEach(key => out[key] === undefined && delete out[key]);

        // Stringify JSON fields
        ['financials', 'aiAnalysis', 'stips', 'closingItems', 'dealStructure', 'qualificationData'].forEach(field => {
            if (out[field] && typeof out[field] === 'object') {
                out[field] = JSON.stringify(out[field]);
            }
        });
        return out;
    }

    private parseLead(lead: any): Lead {
        const out = { ...lead };
        // Parse JSON fields
        ['financials', 'aiAnalysis', 'stips', 'closingItems', 'dealStructure', 'qualificationData'].forEach(field => {
            if (out[field] && typeof out[field] === 'string') {
                try {
                    out[field] = JSON.parse(out[field]);
                } catch {
                    out[field] = null;
                }
            }
        });
        return out as Lead;
    }
}

export const leadRepository = new LeadRepository();
export { prisma }; // Export prisma instance for seeders
