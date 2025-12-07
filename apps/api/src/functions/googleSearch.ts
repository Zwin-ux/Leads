import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import axios from "axios";
import { createResponse } from "../utils/response";

const SERPAPI_KEY = process.env.VITE_SERPAPI_KEY || process.env.SERPAPI_KEY;

export async function googleSearch(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for googleSearch "${request.url}"`);

    if (request.method === 'OPTIONS') {
        return createResponse(204);
    }

    const query = request.query.get('query');

    if (!query) {
        return createResponse(400, "Missing query parameter");
    }

    if (!SERPAPI_KEY) {
        return createResponse(200, {
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
        });
    }

    try {
        let smartQuery = query;
        const lowerQuery = query.toLowerCase();

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
                ll: "@33.9533,-117.3962,11z"
            }
        });

        const results = response.data.local_results || [];

        const mappedResults = results.map((place: any) => ({
            name: place.title,
            formatted_address: place.address,
            rating: place.rating,
            user_ratings_total: place.reviews,
            types: [place.type],
            place_id: place.place_id || place.data_id
        }));

        return createResponse(200, {
            status: "OK",
            results: mappedResults
        });

    } catch (error: any) {
        context.log(`Error calling SerpApi: ${error}`);
        return createResponse(500, `Failed to fetch search data: ${error.message}`);
    }
};

app.http('googleSearch', {
    methods: ['GET', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'search/google',
    handler: googleSearch
});
