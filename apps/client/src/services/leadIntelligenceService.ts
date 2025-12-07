/**
 * Lead Intelligence Service
 * Multi-source search with AI reasoning for real business leads
 */

// Search depth levels
export type SearchDepth = 'quick' | 'standard' | 'deep';

// Source types
// Source types
export type DataSource = 'google_places' | 'sos_api' | 'hunter_io' | 'ai_enriched';

// Raw result from any source before AI processing
export interface RawBusinessResult {
    source: DataSource;
    name: string;
    address?: string;
    city?: string;
    state?: string;
    phone?: string;
    website?: string;
    rating?: number;
    reviewCount?: number;
    categories?: string[];
    placeId?: string;  // Google Places ID
    sosEntityNumber?: string; // CA SOS Entity Number
    sosStatus?: string; // Active, Suspended, etc.
    hunterEmail?: string;
    hunterConfidence?: number;
}

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

    // Contact (if found)
    contactName?: string;
    contactRole?: string;
    contactEmail?: string;

    // Verification
    sosVerified?: boolean;
    sosStatus?: string;
    sosEntityNumber?: string;
    hunterEmail?: string;
    hunterConfidence?: number;
}

// API Keys from environment
const SOS_API_KEY = import.meta.env.VITE_SOS_API_KEY || '';
const HUNTER_API_KEY = import.meta.env.VITE_HUNTER_API_KEY || '';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

// Backend API URL for proxy (avoids CORS)
const BACKEND_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Check which sources are available
export function getAvailableSources(): DataSource[] {
    const sources: DataSource[] = [];
    sources.push('google_places');
    if (SOS_API_KEY) sources.push('sos_api');
    if (HUNTER_API_KEY) sources.push('hunter_io');
    sources.push('ai_enriched');
    return sources;
}

// =====================================================
// GOOGLE PLACES API (via Backend Proxy)
// =====================================================


async function searchGooglePlaces(query: string, location: string): Promise<RawBusinessResult[]> {
    try {
        // Smart Query Logic: Append industry terms if generic
        let smartQuery = query;
        const lowerQuery = query.toLowerCase();

        // If query seems to be requesting 504 type businesses but is generic, add keywords
        if (!lowerQuery.includes('shop') && !lowerQuery.includes('hotel') && !lowerQuery.includes('warehouse')) {
            if (lowerQuery.includes('machine') || lowerQuery.includes('manufacturing')) {
                smartQuery += " OR Machine Shop OR Manufacturer";
            }
        }

        const fullQuery = `${smartQuery} in ${location}`;
        const url = `${BACKEND_API_URL}/api/search/google?query=${encodeURIComponent(fullQuery)}`;

        console.log('🔍 Searching Google via proxy:', url);

        const response = await fetch(url);

        if (!response.ok) {
            console.error('Google Proxy search error:', response.status);
            return [];
        }

        const data = await response.json();

        if (data.status === 'ZERO_RESULTS') {
            console.log("No results found for", fullQuery);
            return [];
        }

        if (data.status !== 'OK' && data.results === undefined) {
            // Some proxies return results directly, others inside 'results'
            // If we implemented the proxy correctly it returns { results: [] }
            console.error('Google Places API status:', data.status || 'Unknown');
            return [];
        }

        const results = data.results || [];

        return results.slice(0, 15).map((place: any) => ({
            source: 'google_places' as DataSource,
            name: place.name,
            address: place.formatted_address,
            city: extractCity(place.formatted_address),
            state: extractState(place.formatted_address),
            phone: undefined, // Google Text Search often doesn't return phone, Details would needed
            website: undefined,
            rating: place.rating,
            reviewCount: place.user_ratings_total,
            categories: place.types || [],
            placeId: place.place_id
        }));
    } catch (e) {
        console.error('Google Places proxy search failed:', e);
        return [];
    }
}

// =====================================================
// CA SECRETARY OF STATE API
// =====================================================
async function searchSOS(name: string): Promise<RawBusinessResult | null> {
    if (!SOS_API_KEY) return null;

    try {
        // Keyword Search
        const url = `https://calico.sos.ca.gov/cbc/v1/api/BusinessEntityKeywordSearch?search-term=${encodeURIComponent(name)}`;

        const response = await fetch(url, {
            headers: {
                'Ocp-Apim-Subscription-Key': SOS_API_KEY
            }
        });

        if (!response.ok) return null;

        const data = await response.json();
        // Assuming data structure based on typical Azure APIM responses, need to verify actual shape
        // For now, let's assume it returns a list and we take the best match
        const bestMatch = data[0]; // Simplification

        if (!bestMatch) return null;

        return {
            source: 'sos_api',
            name: bestMatch.EntityName,
            sosEntityNumber: bestMatch.EntityNumber,
            sosStatus: bestMatch.EntityStatus,
            // Add other fields if available
        } as RawBusinessResult;

    } catch (e) {
        console.error('SOS search failed:', e);
        return null;
    }
}

// =====================================================
// HUNTER.IO API
// =====================================================
async function searchHunter(domain: string): Promise<RawBusinessResult | null> {
    if (!HUNTER_API_KEY) return null;

    try {
        const url = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_API_KEY}`;
        const response = await fetch(url);

        if (!response.ok) return null;

        const data = await response.json();
        const emails = data.data?.emails || [];

        if (emails.length === 0) return null;

        const bestEmail = emails[0];

        return {
            source: 'hunter_io',
            name: domain, // Placeholder
            hunterEmail: bestEmail.value,
            hunterConfidence: bestEmail.confidence,
            contactName: `${bestEmail.first_name} ${bestEmail.last_name}`,
            contactRole: bestEmail.position
        } as any; // Cast to any to merge later

    } catch (e) {
        console.error('Hunter search failed:', e);
        return null;
    }
}

// =====================================================
// AI REASONING LAYER
// =====================================================
async function aiEnrichAndReason(
    rawResults: RawBusinessResult[],
    query: string,
    location: string
): Promise<EnrichedLead[]> {
    if (!OPENAI_API_KEY || rawResults.length === 0) {
        // No AI available - return basic conversion
        return rawResults.map(r => basicConvert(r));
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    messages: [
                        {
                            role: 'system',
                            content: `You are a Senior SBA Loan Underwriter & Business Development Officer. 
Your goal is to identify "High Quality" borrowers for SBA 504 and 7(a) loans from a raw list.

HIGH QUALITY CRITERIA:
- Established business (implied by reviews > 10 or generic legacy nature).
- "Real" physical location (not a PO Box or virtual office).
- Industry matches SBA preference (Manufacturing, Medical, Professional Services, Hotels).

SBA FIT RULES:
- **504 Loan** (Real Estate/Heavy Equipment): Look for Manufacturers, Machine Shops, Hotels, Medical Clinics, Warehouses.
- **7(a) Loan** (Working Capital/Acquisition): Look for Restaurants, Retail, Service Businesses, Franchises, Dental practices.
- **Both**: Medical practices often fit both (buying building vs buying practice).

SCORING (1-100):
- 90+: Perfect 504 candidate (e.g., Manufacturer with good reviews).
- 70-89: Good solid local business, likely 7(a) or small 504.
- 40-69: Retail/Restaurant (higher risk, but doable).
- <40: Vape shops, adult entertainment, speculative, or bad reviews.

Output JSON array of enriched leads.`
                        },
                        {
                            role: 'user',
                            content: `Query: "${query}" in ${location}
Raw Results: ${JSON.stringify(rawResults.map(r => ({ name: r.name, type: r.categories, rating: r.rating, reviews: r.reviewCount })), null, 2)}

Return JSON array:
- company, legalName, address, city, state
- industry
- sbaFit (504, 7a, Both, Unknown), sbaFitReason (Be specific: "Manufacturer suitable for 504 RE purchase")
- estimatedRevenue (Give a realistic range based on industry/size ex: "$1M - $5M")
- estimatedEmployees (Estimate based on type ex: "10-20")
- leadScore (1-100), confidence
- sources (pass through)

Strict JSON only.`
                        }
                    ],
                    max_tokens: 3000,
                    temperature: 0.2
            })
        });

        if (!response.ok) {
            console.error('OpenAI reasoning failed:', response.status);
            return rawResults.map(r => basicConvert(r));
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content || '[]';

        try {
            const enriched = JSON.parse(content.replace(/```json\n?|\n?```/g, ''));
            return enriched.map((e: any) => ({
                id: crypto.randomUUID(),
                company: e.company || e.name,
                legalName: e.legalName,
                address: e.address || '',
                city: e.city || location.split(',')[0],
                state: e.state || 'CA',
                phone: e.phone,
                website: e.website,
                industry: e.industry || 'Business Services',
                sbaFit: e.sbaFit || 'Unknown',
                sbaFitReason: e.sbaFitReason || 'Insufficient data',
                estimatedRevenue: e.estimatedRevenue,
                estimatedEmployees: e.estimatedEmployees,
                leadScore: e.leadScore || 50,
                sources: e.sources || ['google_places'],
                confidence: e.confidence || 'medium',
                contactName: e.contactName,
                contactRole: e.contactRole,
                contactEmail: e.contactEmail,
                sosEntityNumber: e.sosEntityNumber,
                sosStatus: e.sosStatus,
                hunterEmail: e.hunterEmail,
                hunterConfidence: e.hunterConfidence
            }));
        } catch {
            console.error('Failed to parse AI response');
            return rawResults.map(r => basicConvert(r));
        }
    } catch (e) {
        console.error('AI enrichment failed:', e);
        return rawResults.map(r => basicConvert(r));
    }
}

// Basic conversion without AI
function basicConvert(raw: RawBusinessResult): EnrichedLead {
    return {
        id: crypto.randomUUID(),
        company: raw.name,
        address: raw.address || '',
        city: raw.city || '',
        state: raw.state || 'CA',
        phone: raw.phone,
        website: raw.website,
        industry: raw.categories?.[0] || 'Business',
        sbaFit: 'Unknown',
        sbaFitReason: 'No AI analysis available',
        leadScore: 50,
        sources: [raw.source],
        confidence: 'low',
        sosEntityNumber: raw.sosEntityNumber,
        sosStatus: raw.sosStatus,
        hunterEmail: raw.hunterEmail,
        hunterConfidence: raw.hunterConfidence
    };
}

// Helper functions
function extractCity(address: string): string {
    const parts = address?.split(',') || [];
    return parts[1]?.trim() || '';
}

function extractState(address: string): string {
    const parts = address?.split(',') || [];
    const stateZip = parts[2]?.trim() || '';
    return stateZip.split(' ')[0] || 'CA';
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
    depth: SearchDepth = 'standard'
): Promise<SearchResult> {
    const startTime = Date.now();
    const usedSources: DataSource[] = [];
    const rawResults: RawBusinessResult[] = [];

    // 1. Discovery (Google Places via Proxy)
    try {
        const googleResults = await searchGooglePlaces(query, location);
        rawResults.push(...googleResults);
        if (googleResults.length > 0) usedSources.push('google_places');
    } catch (e) {
        console.error('Discovery failed', e);
    }

    // 2. Verification & Enrichment (Parallel)
    if (depth !== 'quick') {
        const enrichmentPromises = rawResults.map(async (biz) => {
            // SOS Verification
            if (SOS_API_KEY) {
                const sosResult = await searchSOS(biz.name);
                if (sosResult) {
                    biz.sosEntityNumber = sosResult.sosEntityNumber;
                    biz.sosStatus = sosResult.sosStatus;
                    if (!usedSources.includes('sos_api')) usedSources.push('sos_api');
                }
            }

            // Hunter.io (if website exists)
            if (HUNTER_API_KEY && biz.website) {
                try {
                    const domain = new URL(biz.website).hostname;
                    const hunterResult = await searchHunter(domain);
                    if (hunterResult) {
                        biz.hunterEmail = hunterResult.hunterEmail;
                        biz.hunterConfidence = hunterResult.hunterConfidence;
                        // @ts-ignore
                        biz.contactName = hunterResult.contactName;
                        // @ts-ignore
                        biz.contactRole = hunterResult.contactRole;
                        if (!usedSources.includes('hunter_io')) usedSources.push('hunter_io');
                    }
                } catch (e) { /* Invalid URL */ }
            }
            return biz;
        });

        await Promise.all(enrichmentPromises);
    }

    // 3. AI Analysis
    let leads: EnrichedLead[];
    if (depth !== 'quick' && OPENAI_API_KEY) {
        leads = await aiEnrichAndReason(rawResults, query, location);
        usedSources.push('ai_enriched');
    } else {
        leads = rawResults.map(r => basicConvert(r));
    }

    // Sort by lead score
    leads.sort((a, b) => b.leadScore - a.leadScore);

    return {
        leads: leads.slice(0, 10),
        sources: usedSources,
        searchTime: Date.now() - startTime,
        isDemoMode: false
    };
}
