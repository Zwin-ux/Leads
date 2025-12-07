import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import axios from "axios";

const SERPAPI_KEY = process.env.VITE_SERPAPI_KEY || process.env.SERPAPI_KEY;

export async function googleSearch(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for googleSearch "${request.url}"`);

    const query = request.query.get('query');

    if (!query) {
        return { status: 400, body: "Missing query parameter" };
    }

    if (!SERPAPI_KEY) {
        context.log("Missing SERPAPI_KEY");
        // Fallback demo
        return {
            status: 200,
            jsonBody: {
                status: "OK",
                results: [
                    {
                        name: "Demo Machine Shop (No API Key)",
                        formatted_address: "123 Industrial Way, Riverside, CA 92501",
                        rating: 4.5,
                        user_ratings_total: 120,
                        types: ["point_of_interest", "establishment"],
                        place_id: "demo_id_1"
                    }
                ]
            }
        };
    }

    try {
        // Smart Query Logic (Moved from Client)
        let smartQuery = query;
        const lowerQuery = query.toLowerCase();

        // If query seems to be requesting 504 type businesses but is generic, add keywords
        if (!lowerQuery.includes('shop') && !lowerQuery.includes('hotel') && !lowerQuery.includes('warehouse')) {
            if (lowerQuery.includes('machine') || lowerQuery.includes('manufacturing')) {
                smartQuery += " OR Machine Shop OR Manufacturer";
            }
        }

        context.log(`Searching SerpApi (Maps) for: ${smartQuery}`);

        const response = await axios.get("https://serpapi.com/search", {
            params: {
                engine: "google_maps",
                q: smartQuery,
                api_key: SERPAPI_KEY,
                type: "search",
                ll: "@33.9533,-117.3962,11z" // Default to Riverside area if no location provided (or let query handle it)
            }
        });

        // Map SerpApi Local Results to Client Format
        // SerpApi 'local_results' usually contains the list
        const results = response.data.local_results || [];

        const mappedResults = results.map((place: any) => ({
            name: place.title,
            formatted_address: place.address,
            rating: place.rating,
            user_ratings_total: place.reviews,
            types: [place.type], // SerpApi gives a string 'type', client expects array
            place_id: place.place_id || place.data_id
        }));

        return {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            jsonBody: {
                status: "OK",
                results: mappedResults
            }
        };

    } catch (error) {
        context.log(`Error calling SerpApi: ${error}`);
        return {
            status: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: "Failed to fetch search data"
        };
    }
};

app.http('googleSearch', {
    methods: ['GET', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'search/google',
    handler: async (request, context) => {
        if (request.method === 'OPTIONS') {
            return {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            };
        }
        const response: any = await googleSearch(request, context);
        response.headers = {
            ...(response.headers || {}),
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        };
        return response;
    }
});
