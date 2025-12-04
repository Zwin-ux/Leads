import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import axios from "axios";

// TODO: Move to environment variables
const SERPAPI_KEY = process.env.SERPAPI_KEY || "demo_key";

export async function research(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const body = await request.json() as { query: string; type: 'business' | 'banker' };
    const { query, type } = body;

    if (!query) {
        return { status: 400, body: "Missing query" };
    }

    try {
        // If we don't have a real key, return mock data to avoid breaking the demo
        if (SERPAPI_KEY === "demo_key") {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (type === 'business') {
                return {
                    status: 200,
                    jsonBody: {
                        summary: `(Mock) ${query} is a verified business in the local sector.`,
                        headcount: "10-50 employees (est)",
                        flags: ["No recent bankruptcies", "Active entity"],
                        news: "Featured in local news for community service."
                    }
                };
            } else {
                return {
                    status: 200,
                    jsonBody: {
                        winRate: "High (est. 80%)",
                        speed: "Fast (avg 25 days)",
                        leverage: "Known for SBA 504 deals in this region."
                    }
                };
            }
        }

        // Real SerpApi Call
        const response = await axios.get("https://serpapi.com/search", {
            params: {
                engine: "google",
                q: query,
                api_key: SERPAPI_KEY,
                num: 3
            }
        });

        const results = response.data;

        // Parse results based on type
        if (type === 'business') {
            const snippet = results.organic_results?.[0]?.snippet || "No summary found.";
            const title = results.organic_results?.[0]?.title || "";

            return {
                status: 200,
                jsonBody: {
                    summary: `${title}: ${snippet}`,
                    headcount: "Check LinkedIn for exact numbers",
                    flags: ["Verify entity status manually"],
                    news: results.news_results?.[0]?.title || "No recent news found."
                }
            };
        } else {
            // Banker logic (simplified for search)
            const snippet = results.organic_results?.[0]?.snippet || "No public profile found.";
            return {
                status: 200,
                jsonBody: {
                    winRate: "Unknown (Requires internal data)",
                    speed: "Unknown",
                    leverage: `Public info: ${snippet}`
                }
            };
        }

    } catch (error) {
        context.log(`Error fetching research: ${error}`);
        return { status: 500, body: "Failed to fetch research data" };
    }
};

app.http('research', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: research
});
