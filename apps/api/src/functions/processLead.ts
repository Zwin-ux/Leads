import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { brainService } from "../services/brainService";
import { graphService } from "../services/graphService";
import { graphToolbox } from "../services/graphToolbox";

export async function processLead(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Processing lead request.`);

    try {
        const body = await request.json() as any;
        const { lead, action, accessToken } = body;

        if (!lead || !action) {
            return { status: 400, body: "Missing lead or action" };
        }

        let result: any = {};

        if (action === "getNextAction") {
            const nextAction = await brainService.getNextAction(lead);
            result = { nextAction };
        } else if (action === "sendEmail") {
            if (!accessToken) return { status: 401, body: "Missing access token" };
            const content = await brainService.generateEmail(lead, "intro");
            // Optionally send immediately or just return draft
            result = { emailContent: content };
        } else if (action === "analyzeDeal") {
            const analysis = await brainService.analyzeDeal(lead);
            result = { analysis };
        } else if (action === "executeGraphTool") {
            if (!accessToken) return { status: 401, body: "Missing access token" };
            const { toolName, args } = body;
            if (!toolName || !args) return { status: 400, body: "Missing toolName or args" };

            try {
                const toolResult = await graphToolbox.executeTool(accessToken, toolName, args);
                result = { toolResult };
            } catch (err: any) {
                return { status: 500, body: `Tool execution failed: ${err.message}` };
            }
        } else if (action === "getGraphTools") {
            result = { tools: graphToolbox.getTools() };
        }

        return { status: 200, jsonBody: result };
    } catch (error: any) {
        context.log(`Error: ${error.message}`);
        return { status: 500, body: error.message };
    }
};

app.http('processLead', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: processLead
});
