import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { leadRepository } from "../services/leadRepository";
import { Lead } from "@leads/shared";
import { createResponse } from "../utils/response";

export async function leads(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Processing leads request: ${request.method}`);

    // Preflight safety
    if (request.method === 'OPTIONS') {
        return createResponse(204);
    }

    try {
        if (request.method === "GET") {
            const leads = await leadRepository.getAll();
            return createResponse(200, leads);
        } else if (request.method === "POST") {
            const body = await request.json() as any;

            // Check if it's a bulk import (array) or single create
            if (Array.isArray(body)) {
                await leadRepository.bulkCreate(body as Lead[]);
                return createResponse(201, "Bulk import successful");
            } else {
                const newLead = await leadRepository.create(body as Lead);
                return createResponse(201, newLead);
            }
        } else if (request.method === "PUT") {
            const body = await request.json() as Lead;
            const updatedLead = await leadRepository.update(body);
            return createResponse(200, updatedLead);
        }

        return createResponse(405, "Method not allowed");
    } catch (error: any) {
        context.log(`Error: ${error.message}`);
        return createResponse(500, error.message);
    }
};

app.http('leads', {
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: leads
});
