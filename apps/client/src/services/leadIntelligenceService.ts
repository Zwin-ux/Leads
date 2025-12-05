/**
 * Lead Intelligence Service
 * Multi-source search with AI reasoning for real business leads
 */

// Search depth levels
export type SearchDepth = 'quick' | 'standard' | 'deep';

// Source types
export type DataSource = 'google_places' | 'yelp' | 'opencorp' | 'ai_enriched';

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
    yelpId?: string;   // Yelp ID
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
}

// API Keys from environment (must use VITE_ prefix for Vite to expose them)
const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '';
const YELP_API_KEY = import.meta.env.VITE_YELP_API_KEY || '';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
// SERPAPI_KEY is handled by backend proxy, not called directly from frontend

// Backend API URL for proxy (avoids CORS)
const BACKEND_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Check which sources are available
export function getAvailableSources(): DataSource[] {
    const sources: DataSource[] = [];
    // Always show google_places as available - backend will handle the actual API
    sources.push('google_places');
    if (YELP_API_KEY) sources.push('yelp');
    sources.push('ai_enriched');  // Backend handles AI too
    return sources;
}

// =====================================================
// BACKEND PROXY SEARCH (avoids CORS issues)
// =====================================================
async function searchViaBackend(query: string, location: string): Promise<RawBusinessResult[]> {
    try {
        const url = `${BACKEND_API_URL}/api/search/businesses?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`;

        console.log('🔍 Searching via backend:', query, 'in', location);

        const response = await fetch(url);

        if (!response.ok) {
            console.error('Backend search error:', response.status);
            return [];
        }

        const data = await response.json();

        if (data.error) {
            console.error('API error:', data.error);
            return [];
        }

        console.log('✅ Found', data.local_results?.length || 0, 'businesses');

        return (data.local_results || []).slice(0, 10).map((place: any) => ({
            source: 'google_places' as DataSource,
            name: place.title,
            address: place.address,
            city: extractCity(place.address || ''),
            state: extractState(place.address || ''),
            phone: place.phone,
            website: place.website,
            rating: place.rating,
            reviewCount: place.reviews,
            categories: place.type ? [place.type] : [],
            placeId: place.place_id
        }));
    } catch (e) {
        console.error('Backend search failed:', e);
        return [];
    }
}

// =====================================================
// GOOGLE PLACES API (direct, may have CORS issues)
// =====================================================
async function searchGooglePlaces(query: string, location: string): Promise<RawBusinessResult[]> {
    if (!GOOGLE_PLACES_API_KEY) return [];

    try {
        // Use Text Search API for business queries
        const searchQuery = `${query} in ${location}`;
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${GOOGLE_PLACES_API_KEY}`;

        const response = await fetch(url);
        if (!response.ok) {
            console.error('Google Places API error:', response.status);
            return [];
        }

        const data = await response.json();

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            console.error('Google Places API status:', data.status, data.error_message);
            return [];
        }

        return (data.results || []).slice(0, 10).map((place: any) => ({
            source: 'google_places' as DataSource,
            name: place.name,
            address: place.formatted_address,
            city: extractCity(place.formatted_address),
            state: extractState(place.formatted_address),
            phone: undefined,  // Requires Place Details API call
            website: undefined, // Requires Place Details API call
            rating: place.rating,
            reviewCount: place.user_ratings_total,
            categories: place.types || [],
            placeId: place.place_id
        }));
    } catch (e) {
        console.error('Google Places search failed:', e);
        return [];
    }
}

// =====================================================
// YELP FUSION API
// =====================================================
async function searchYelp(query: string, location: string): Promise<RawBusinessResult[]> {
    if (!YELP_API_KEY) return [];

    try {
        // Note: Yelp API requires CORS proxy or backend call
        // For frontend, we'd need a proxy
        const url = `https://api.yelp.com/v3/businesses/search?term=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&limit=10`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${YELP_API_KEY}`
            }
        });

        if (!response.ok) {
            console.error('Yelp API error:', response.status);
            return [];
        }

        const data = await response.json();

        return (data.businesses || []).map((biz: any) => ({
            source: 'yelp' as DataSource,
            name: biz.name,
            address: biz.location?.display_address?.join(', '),
            city: biz.location?.city,
            state: biz.location?.state,
            phone: biz.display_phone,
            website: biz.url,
            rating: biz.rating,
            reviewCount: biz.review_count,
            categories: biz.categories?.map((c: any) => c.title) || [],
            yelpId: biz.id
        }));
    } catch (e) {
        console.error('Yelp search failed:', e);
        return [];
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
                    {
                        role: 'system',
                        content: `You are an SBA loan specialist analyzing business leads. Given raw search results, you will:

1. DEDUPLICATE: If the same business appears from multiple sources, merge them
2. VERIFY: Flag any that look like chains/franchises (less ideal for SBA)
3. ASSESS SBA FIT: Based on industry and apparent size:
   - 504: Real estate/equipment intensive (manufacturing, machine shops, hotels, medical facilities)
   - 7a: Working capital needs (service businesses, retail, restaurants)
   - Both: Could use either depending on project
4. SCORE: Rate each lead 1-100 based on likely loan potential
5. ENRICH: Estimate employee count and revenue range based on reviews/category

Return a JSON array of enriched leads. Be realistic - if data is sparse, say so.`
                    },
                    {
                        role: 'user',
                        content: `Query was: "${query}" in ${location}

Raw results from APIs:
${JSON.stringify(rawResults, null, 2)}

Return JSON array with these fields for each unique business:
- company, legalName (if different), address, city, state, phone, website
- industry (derived from categories)
- sbaFit ("504", "7a", "Both", or "Unknown"), sbaFitReason
- estimatedRevenue, estimatedEmployees
- leadScore (1-100), confidence ("high"/"medium"/"low")
- sources (array of which sources had this business)

ONLY return valid JSON array, no markdown.`
                    }
                ],
                max_tokens: 2500,
                temperature: 0.3  // Lower temp for more consistent analysis
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
                contactEmail: e.contactEmail
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
        confidence: 'low'
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

    // Collect raw results from available sources
    const rawResults: RawBusinessResult[] = [];
    const usedSources: DataSource[] = [];

    // Phase 1: Business Search via Backend Proxy (handles SerpAPI/CORS)
    try {
        const backendResults = await searchViaBackend(query, location);
        rawResults.push(...backendResults);
        if (backendResults.length > 0) usedSources.push('google_places');
    } catch (e) {
        console.log('Backend unavailable, trying direct APIs...');
        // Fallback to direct Google Places if backend is down
        if (GOOGLE_PLACES_API_KEY) {
            const googleResults = await searchGooglePlaces(query, location);
            rawResults.push(...googleResults);
            if (googleResults.length > 0) usedSources.push('google_places');
        }
    }

    // Phase 2: Yelp (for standard and deep)
    if (depth !== 'quick' && YELP_API_KEY) {
        const yelpResults = await searchYelp(query, location);
        rawResults.push(...yelpResults);
        if (yelpResults.length > 0) usedSources.push('yelp');
    }

    // Phase 3: AI Reasoning (for standard and deep with OpenAI)
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
        leads: leads.slice(0, 10),  // Top 10
        sources: usedSources,
        searchTime: Date.now() - startTime,
        isDemoMode: false
    };
}
