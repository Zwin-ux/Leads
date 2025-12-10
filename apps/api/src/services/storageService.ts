
import { BlobServiceClient } from '@azure/storage-blob';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

if (!connectionString) {
    console.warn("Azure Storage configuration missing.");
}

const blobServiceClient = connectionString
    ? BlobServiceClient.fromConnectionString(connectionString)
    : null;

const CONTAINER_NAME = "loan-documents";

export class StorageService {

    private containerClient = blobServiceClient?.getContainerClient(CONTAINER_NAME);

    constructor() {
        // optimistically try to create it
        this.ensureContainer();
    }

    private async ensureContainer() {
        if (!this.containerClient) return;
        try {
            await this.containerClient.createIfNotExists();
        } catch (error: any) {
            // Ignore if it already exists
            if (error.code !== "ContainerAlreadyExists") {
                console.error("Error ensuring container exists:", error.message);
            }
        }
    }

    async uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> {
        if (!blobServiceClient || !this.containerClient) throw new Error("Storage not configured");

        // Ensure container exists before upload
        await this.ensureContainer();

        const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);

        console.log(`Uploading ${fileName} to Azure Blob Storage...`);

        await blockBlobClient.uploadData(fileBuffer, {
            blobHTTPHeaders: { blobContentType: mimeType }
        });

        return blockBlobClient.url;
    }

    async listFiles(): Promise<string[]> {
        if (!blobServiceClient || !this.containerClient) return [];

        await this.ensureContainer();

        const files: string[] = [];
        for await (const blob of this.containerClient.listBlobsFlat()) {
            files.push(blob.name);
        }
        return files;
    }
}

export const storageService = new StorageService();
