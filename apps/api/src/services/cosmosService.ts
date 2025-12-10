
import { CosmosClient, Database, Container } from '@azure/cosmos';

const endpoint = process.env.COSMOS_ENDPOINT || '';
const key = process.env.COSMOS_KEY || '';
const databaseId = process.env.COSMOS_DATABASE || 'leads';
const containerId = process.env.COSMOS_CONTAINER || 'leads';

class CosmosService {
    private client: CosmosClient;
    private database!: Database;
    private container!: Container;
    private initialized = false;

    constructor() {
        this.client = new CosmosClient({ endpoint, key });
    }

    async ensureInitialized(): Promise<void> {
        if (this.initialized) return;

        console.log('🔄 Initializing Cosmos DB connection...');
        try {
            // Create database if it doesn't exist
            const { database } = await this.client.databases.createIfNotExists({ id: databaseId });
            this.database = database;

            // Create container if it doesn't exist
            const { container } = await this.database.containers.createIfNotExists({
                id: containerId,
                partitionKey: { paths: ['/id'] }
            });
            this.container = container;

            this.initialized = true;
            console.log('✅ Cosmos DB connected:', databaseId, '/', containerId);
        } catch (error) {
            console.error('❌ Cosmos DB initialization failed:', error);
            throw error;
        }
    }

    async getAll<T>(): Promise<T[]> {
        await this.ensureInitialized();
        const { resources } = await this.container.items.readAll<T>().fetchAll();
        return resources;
    }

    async getById<T>(id: string): Promise<T | null> {
        await this.ensureInitialized();
        try {
            const { resource } = await this.container.item(id, id).read<T>();
            return resource || null;
        } catch (e: any) {
            if (e.code === 404) return null;
            throw e;
        }
    }

    async create<T extends { id?: string }>(item: T): Promise<T> {
        await this.ensureInitialized();
        // Generate ID if not provided
        const doc = { ...item, id: item.id || crypto.randomUUID() };
        const { resource } = await this.container.items.create(doc);
        return resource as unknown as T;
    }

    async update<T extends { id: string }>(item: T): Promise<T> {
        await this.ensureInitialized();
        const { resource } = await this.container.item(item.id, item.id).replace(item);
        return resource as unknown as T;
    }

    async upsert<T extends { id?: string }>(item: T): Promise<T> {
        await this.ensureInitialized();
        const doc = { ...item, id: item.id || crypto.randomUUID() };
        const { resource } = await this.container.items.upsert(doc);
        return resource as unknown as T;
    }

    async delete(id: string): Promise<void> {
        await this.ensureInitialized();
        await this.container.item(id, id).delete();
    }

    async query<T>(querySpec: string): Promise<T[]> {
        await this.ensureInitialized();
        const { resources } = await this.container.items.query<T>(querySpec).fetchAll();
        return resources;
    }
}

export const cosmosService = new CosmosService();
