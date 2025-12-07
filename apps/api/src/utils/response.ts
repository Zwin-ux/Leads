import { HttpResponseInit } from "@azure/functions";

export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400'
};

export function createResponse(status: number, body?: any): HttpResponseInit {
    // Determine if body is JSON or text
    const response: HttpResponseInit = {
        status,
        headers: { ...corsHeaders }
    };

    if (body) {
        if (typeof body === 'string') {
            response.body = body;
        } else {
            response.jsonBody = body;
        }
    }

    return response;
}
