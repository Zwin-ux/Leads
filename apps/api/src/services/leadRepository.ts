import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import type { Lead } from "@leads/shared";

// Create a single instance of Prisma Client
// Create a single instance of Prisma Client
const prisma = new PrismaClient();

export class LeadRepository {

    constructor() {
        console.log("Initializing Prisma Lead Repository...");
    }

    async getAll(): Promise<Lead[]> {
        try {
            const leads = await prisma.lead.findMany();
            // Prisma returns 'Json' types which need casting to compatible TS interfaces if strict
            // But usually it just works at runtime. We might need 'as unknown as Lead[]' if types don't align perfectly.
            return leads as unknown as Lead[];
        } catch (e) {
            console.error("Prisma getAll Error:", e);
            return [];
        }
    }

    async create(lead: Lead): Promise<Lead> {
        // Remove 'id' if it's undefined/null so Prisma generates a UUID
        // OR preserve it if we want to set it manually (unlikely for new leads)
        const { id, ...data } = lead;

        try {
            const created = await prisma.lead.create({
                data: {
                    ...data,
                    financials: lead.financials as any,
                    aiAnalysis: lead.aiAnalysis as any,
                    stips: lead.stips as any
                }
            });
            return created as unknown as Lead;
        } catch (e) {
            console.error("Prisma create Error:", e);
            throw e;
        }
    }

    async update(lead: Lead): Promise<Lead> {
        if (!lead.id) throw new Error("Cannot update lead without ID");

        try {
            const updated = await prisma.lead.update({
                where: { id: lead.id },
                data: {
                    company: lead.company,
                    firstName: lead.firstName,
                    lastName: lead.lastName,
                    email: lead.email,
                    phone: lead.phone,
                    address: lead.address,
                    city: lead.city,
                    state: lead.state,
                    zip: lead.zip,
                    source: lead.source,
                    status: lead.status,
                    financials: lead.financials as any,
                    aiAnalysis: lead.aiAnalysis as any,
                    stips: lead.stips as any
                }
            });
            return updated as unknown as Lead;
        } catch (e) {
            console.error("Prisma update Error:", e);
            throw e;
        }
    }

    async bulkCreate(leads: Lead[]): Promise<void> {
        // Prisma createMany is faster
        try {
            await prisma.lead.createMany({
                data: leads.map(l => {
                    const lead = l as any;
                    const { id, ...rest } = lead;
                    return {
                        ...rest,
                        financials: lead.financials,
                        aiAnalysis: lead.aiAnalysis,
                        stips: lead.stips
                    };
                })
            });
        } catch (e) {
            console.error("Prisma bulkCreate Error:", e);
        }
    }
}

export const leadRepository = new LeadRepository();
