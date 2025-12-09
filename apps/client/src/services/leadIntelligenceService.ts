/**
 * Lead Intelligence Service
 * Firecrawl + GPT Pipeline for High Quality Leads
 */

// Source types
export type DataSource = 'firecrawl' | 'gpt_reasoning';

// Enriched result after AI reasoning
export interface EnrichedLead {
    id: string;
    company: string;
    legalName?: string;
    address: string;
    city: string;
    state: string;
    phone?: string;
    website?: string;
    industry: string;

    // AI-assessed fields
    sbaFit: '504' | '7a' | 'Both' | 'Unknown';
    sbaFitReason: string;
    estimatedRevenue?: string;
    estimatedEmployees?: string;
    leadScore: number;  // 1-100

    // Source attribution
    sources: DataSource[];
    confidence: 'high' | 'medium' | 'low';

    // Contact (if found by AI)
    contactName?: string;
    contactRole?: string;
    contactEmail?: string;
}

// API Keys from environment
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
// Firecrawl is handled by backend proxy

// Backend API URL
// Backend API URL
const envUrl = import.meta.env.VITE_API_URL;
const BACKEND_API_URL = (envUrl && envUrl.startsWith('http')) ? envUrl : 'http://localhost:3001';

// Check which sources are available
export function getAvailableSources(): DataSource[] {
    return ['firecrawl', 'gpt_reasoning'];
}

// =====================================================
// FIRECRAWL SEARCH (via Backend Proxy)
// =====================================================

interface FirecrawlResult {
    url: string;
    title: string;
    content?: string; // Markdown or snippet
    description?: string;
}

async function searchFirecrawl(query: string): Promise<FirecrawlResult[]> {
    try {
        console.log('🔥 Searching Firecrawl via proxy:', query);
        const url = `${BACKEND_API_URL}/api/search/firecrawl`;
        console.log("🔥 Fetching Firecrawl URL:", url);

        const response = await fetch(url + `?query=${encodeURIComponent(query)}`);

        if (!response.ok) {
            console.error('Firecrawl Proxy search error:', response.status);
            return [];
        }

        const json = await response.json();
        const data = json.data || [];

        // Map to simpler structure
        return data.map((item: any) => ({
            url: item.url,
            title: item.title,
            content: item.markdown || item.content || item.description || ''
        }));

    } catch (e) {
        console.error('Firecrawl search failed:', e);
        return [];
    }
}

// =====================================================
// AI REASONING LAYER
// =====================================================
async function aiProcessFirecrawlResults(
    results: FirecrawlResult[],
    query: string,
    location: string
): Promise<EnrichedLead[]> {
    if (!OPENAI_API_KEY || results.length === 0) {
        return [];
    }

    try {
        // Construct a context string from Firecrawl results
        const searchContext = results.map((r, i) =>
            `Result ${i + 1}:\nTitle: ${r.title}\nURL: ${r.url}\nExcerpt: ${r.content?.substring(0, 500)}...`
        ).join('\n\n---\n\n');

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o', // Use powerful model for extraction
                messages: [
                    {
                        role: 'system',
                        content: `You are a Senior SBA Loan Underwriter & Business Development Officer. 
Your goal is to extract valid business leads from the provided search results.

TARGET: High Quality Borrowers for SBA 504 (Real Estate/Equip) and 7(a) (Working Capital) loans.

CRITERIA:
- Must be a real operating business.
- Exclude directories (Yelp, YellowPages) unless you can extract a specific business from the listing title/snippet.
- Exclude government agencies, non-profits, or informational articles.

OUTPUT FORMAT: JSON Array of objects.
Fields:
- company: Business Name
- legalName: (if apparent)
- address: (Infer city/state from context if full address missing)
- city: (Required)
- state: (Required)
- website: (URL from result)
- industry: (e.g. "Manufacturing", "Medical")
- sbaFit: "504", "7a", "Both", or "Unknown"
- sbaFitReason: One sentence justification.
- leadScore: 1-100 (based on likelihood of needing capital & business quality)
- confidence: "high", "medium", "low" (based on data quality)
- estimatedRevenue: (Guess based on industry/size, e.g. "$2M+")
- estimatedEmployees: (Guess, e.g. "10-20")

If a result is a "List of..." or directory, try to extract specific companies mentioned if possible, otherwise skip it.`
                    },
                    {
                        role: 'user',
                        content: `Search Query: "${query}" in ${location}

SEARCH RESULTS (Firecrawl):
${searchContext}

Extract and analyze leads. Return strict JSON.`
                    }
                ],
                max_tokens: 3000,
                temperature: 0.1
            })
        });

        if (!response.ok) {
            console.error('OpenAI reasoning failed:', response.status);
            return [];
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content || '[]';

        try {
            const enriched = JSON.parse(content.replace(/```json\n?|\n?```/g, ''));
            return enriched.map((e: any) => ({
                id: crypto.randomUUID(),
                company: e.company || 'Unknown',
                legalName: e.legalName,
                address: e.address || `${e.city}, ${e.state}`,
                city: e.city || location.split(',')[0],
                state: e.state || 'CA',
                phone: e.phone,
                website: e.website,
                industry: e.industry || 'Business',
                sbaFit: e.sbaFit || 'Unknown',
                sbaFitReason: e.sbaFitReason || 'ai assessment',
                estimatedRevenue: e.estimatedRevenue,
                estimatedEmployees: e.estimatedEmployees,
                leadScore: e.leadScore || 50,
                sources: ['firecrawl', 'gpt_reasoning'],
                confidence: e.confidence || 'medium',
                contactName: e.contactName,
            }));
        } catch {
            console.error('Failed to parse AI response');
            return [];
        }
    } catch (e) {
        console.error('AI enrichment failed:', e);
        return [];
    }
}

// =====================================================
// MAIN SEARCH FUNCTION
// =====================================================
export interface SearchResult {
    leads: EnrichedLead[];
    sources: DataSource[];
    searchTime: number;
    isDemoMode: boolean;
    error?: string;
}

export async function searchLeads(
    query: string,
    location: string,
    _depth: any = 'standard' // Deprecated param, kept for signature comp
): Promise<SearchResult> {
    const startTime = Date.now();

    // 1. Firecrawl Search
    const firecrawlResults = await searchFirecrawl(`${query} ${location}`);

    if (firecrawlResults.length === 0) {
        return {
            leads: [],
            sources: ['firecrawl'],
            searchTime: Date.now() - startTime,
            isDemoMode: false,
            error: "No results found from Firecrawl"
        };
    }

    // 2. GPT Extraction & Reasoning
    const leads = await aiProcessFirecrawlResults(firecrawlResults, query, location);

    return {
        leads: leads,
        sources: ['firecrawl', 'gpt_reasoning'],
        searchTime: Date.now() - startTime,
        isDemoMode: false
    };
}
