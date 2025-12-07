import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { brainService } from "../services/brainService";
import { AdRequest, SalesPerson } from "@leads/shared";

// Mock Sales Team Data (Mirroring Client for Context Injection)
const SALES_TEAM: Partial<SalesPerson>[] = [
    { id: 'sp1', name: 'Ed Ryan', title: 'SVP, Business Development', phone: '909-258-4585', email: 'ed.ryan@ampac.com' },

    { id: 'sp3', name: 'Sarah Jenkins', title: 'Business Development Officer', phone: '909-555-0103', email: 'sarah.j@ampac.com' }
];

export async function generateAd(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Generating ad script...`);

    try {
        const body = await request.json() as AdRequest;
        const { product, goal, tone, length, salesPersonId, notes } = body;

        let salesPersonContext = "Contact: AmPac Business Capital (909) 915-1706";
        if (salesPersonId) {
            const sp = SALES_TEAM.find(s => s.id === salesPersonId);
            if (sp) {
                salesPersonContext = `
                Call to Action Contact:
                Name: ${sp.name}
                Title: ${sp.title}
                Phone: ${sp.phone}
                Email: ${sp.email}
                `;
            }
        }

        const prompt = `
        Create a ${length} video ad script for AmPac Business Capital.
        Product: ${product}
        Goal: ${goal}
        Tone: ${tone}
        ${notes ? `Additional Notes: ${notes}` : ''}
        ${salesPersonContext}

        Format Requirements:
        - Return strictly valid JSON.
        - Structure: { "hooks": ["..."], "beats": ["..."], "caption": "..." }
        - Hooks: 3 punchy opening lines options.
        - Beats: The visual/audio flow of the ad (step by step).
        - Caption: A social media caption with hashtags.
        `;

        // Call Brain Service
        // Note: In a real scenario, we might want to fail if the brain service is down
        // But for this demo, the brainService wrapper usually handles errors or we can mock fallback here.
        let result;
        try {
            result = await brainService.generateAdScript({
                prompt: prompt
            });
        } catch (e) {
            context.log("Brain service failed, using fallback mock.");
            // Mock Fallback
            result = {
                hooks: [
                    "Stop renting, start owning.",
                    "The SBA 504 loan uses your rent money to buy your building.",
                    "AmPac makes buying your own building easy."
                ],
                beats: [
                    "Visual: Business owner looking at a 'For Lease' sign frustrate.",
                    "Audio: Tired of rent hikes killing your profits?",
                    "Visual: AmPac logo slides in with a confident handshake.",
                    "Audio: With AmPac's SBA 504 Program, you can buy your building with just 10% down.",
                    `Visual: Text appears - Call ${salesPersonContext.split('\n')[2]?.split(':')[1]?.trim() || 'AmPac'} today.`,
                    "Audio: Stop renting. Start building wealth."
                ],
                caption: `Why rent when you can own? 🏢 The SBA 504 loan helps you buy your business property with low down payments. Call us today! #SmallBusiness #AmPac #SBA504`
            };
        }

        return {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            jsonBody: result
        };

    } catch (error) {
        context.log(`Error generating ad: ${error}`);
        return {
            status: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: "Internal Server Error"
        };
    }
};

app.http('generateAd', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        if (request.method === 'OPTIONS') {
            return {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            };
        }
        return generateAd(request, context);
    }
});
