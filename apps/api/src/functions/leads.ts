import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { leadRepository } from "../services/leadRepository";
import { Lead } from "@leads/shared";

export async function leads(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Processing leads request: ${request.method}`);

    try {
        if (request.method === "GET") {
            const leads = await leadRepository.getAll();
            return { status: 200, jsonBody: leads };
        } else if (request.method === "POST") {
            const body = await request.json() as any;

            // Check if it's a bulk import (array) or single create
            if (Array.isArray(body)) {
                await leadRepository.bulkCreate(body as Lead[]);
                return { status: 201, body: "Bulk import successful" };
            } else {
                const newLead = await leadRepository.create(body as Lead);
                return { status: 201, jsonBody: newLead };
            }
        } else if (request.method === "PUT") {
            const body = await request.json() as Lead;
            const updatedLead = await leadRepository.update(body);
            return { status: 200, jsonBody: updatedLead };
        }

        return { status: 405, body: "Method not allowed" };
    } catch (error: any) {
        context.log(`Error: ${error.message}`);
        return { status: 500, body: error.message };
    }
};

app.http('leads', {
    methods: ['GET', 'POST', 'PUT'],
    authLevel: 'anonymous',
    handler: leads
});
