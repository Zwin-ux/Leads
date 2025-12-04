import { CosmosClient, Container, Database } from "@azure/cosmos";
import { Lead } from "@leads/shared";

const CONNECTION_STRING = process.env.COSMOS_CONNECTION_STRING;
const DATABASE_ID = "LeadSheetsDB";
const CONTAINER_ID = "Leads";

export class LeadRepository {
    private client: CosmosClient | null = null;
    private database: Database | null = null;
    private container: Container | null = null;

    constructor() {
        if (CONNECTION_STRING) {
            this.client = new CosmosClient(CONNECTION_STRING);
        } else {
            console.warn("COSMOS_CONNECTION_STRING is not defined. Persistence will fail.");
        }
    }

    private async init() {
        if (!this.client) throw new Error("Cosmos Client not initialized");
        if (!this.database) {
            const { database } = await this.client.databases.createIfNotExists({ id: DATABASE_ID });
            this.database = database;
        }
        if (!this.container) {
            const { container } = await this.database.containers.createIfNotExists({ id: CONTAINER_ID });
            this.container = container;
        }
    }

    async getAll(): Promise<Lead[]> {
        await this.init();
        if (!this.container) throw new Error("Container not initialized");

        const { resources } = await this.container.items
            .query("SELECT * FROM c")
            .fetchAll();
        return resources as Lead[];
    }

    async create(lead: Lead): Promise<Lead> {
        await this.init();
        if (!this.container) throw new Error("Container not initialized");

        const { resource } = await this.container.items.create(lead);
        return resource as Lead;
    }

    async update(lead: Lead): Promise<Lead> {
        await this.init();
        if (!this.container) throw new Error("Container not initialized");

        const { resource } = await this.container.item(lead.id, lead.id).replace(lead);
        return resource as Lead;
    }

    async bulkCreate(leads: Lead[]): Promise<void> {
        await this.init();
        if (!this.container) throw new Error("Container not initialized");

        // Simple serial implementation for now. 
        // For large datasets, consider using Bulk support or parallel promises.
        for (const lead of leads) {
            await this.container.items.create(lead);
        }
    }
}

export const leadRepository = new LeadRepository();
