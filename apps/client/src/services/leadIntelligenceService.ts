/**
 * Lead Intelligence Service
 * Firecrawl + GPT Pipeline for High Quality Leads
 * With demo mode fallback when API keys aren't configured
 */

// Source types
export type DataSource = 'firecrawl' | 'gpt_reasoning' | 'demo';

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

// Backend API URL
const getApiUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (!envUrl) return 'http://localhost:3001';
    if (envUrl.startsWith('http')) return envUrl;
    return `https://${envUrl}`;
};
const BACKEND_API_URL = getApiUrl();

// Check which sources are available
export function getAvailableSources(): DataSource[] {
    return ['firecrawl', 'gpt_reasoning', 'demo'];
}

// =====================================================
// DEMO DATA - When APIs aren't configured
// =====================================================
const getDemoLeads = (query: string, location: string): EnrichedLead[] => {
    const city = location.split(',')[0].trim();
    const state = location.split(',')[1]?.trim() || 'CA';

    const demoData: Record<string, EnrichedLead[]> = {
        'machine shops': [
            {
                id: crypto.randomUUID(),
                company: 'Precision Machine Works',
                legalName: 'Precision Machine Works LLC',
                address: '1234 Industrial Blvd',
                city, state,
                phone: '(555) 234-5678',
                website: 'https://precisionmachineworks.com',
                industry: 'Manufacturing - CNC Machining',
                sbaFit: '504',
                sbaFitReason: 'Heavy equipment and real estate needs typical for machine shops make 504 ideal.',
                estimatedRevenue: '$2M - $5M',
                estimatedEmployees: '15-25',
                leadScore: 82,
                sources: ['demo'],
                confidence: 'high',
                contactName: 'Robert Martinez',
                contactRole: 'Owner'
            },
            {
                id: crypto.randomUUID(),
                company: 'Custom Metal Fabricators',
                address: '5678 Manufacturing Way',
                city, state,
                phone: '(555) 345-6789',
                industry: 'Manufacturing - Metal Fabrication',
                sbaFit: 'Both',
                sbaFitReason: 'Growing fab shop may need equipment (504) and working capital (7a).',
                estimatedRevenue: '$1.5M - $3M',
                estimatedEmployees: '10-20',
                leadScore: 75,
                sources: ['demo'],
                confidence: 'medium',
                contactName: 'Sarah Chen',
                contactRole: 'General Manager'
            }
        ],
        'medical clinics': [
            {
                id: crypto.randomUUID(),
                company: 'Valley Medical Group',
                legalName: 'Valley Medical Group PC',
                address: '500 Health Center Dr',
                city, state,
                phone: '(555) 456-7890',
                website: 'https://valleymedicalgroup.com',
                industry: 'Healthcare - Medical Practice',
                sbaFit: '504',
                sbaFitReason: 'Medical practices often expand real estate and buy expensive equipment - perfect 504 fit.',
                estimatedRevenue: '$3M - $8M',
                estimatedEmployees: '20-40',
                leadScore: 88,
                sources: ['demo'],
                confidence: 'high',
                contactName: 'Dr. Michelle Wong',
                contactRole: 'Medical Director'
            },
            {
                id: crypto.randomUUID(),
                company: 'Urgent Care Plus',
                address: '1200 Main Street, Suite 100',
                city, state,
                phone: '(555) 567-8901',
                industry: 'Healthcare - Urgent Care',
                sbaFit: 'Both',
                sbaFitReason: 'New urgent care may need facility buildout (504) and startup capital (7a).',
                estimatedRevenue: '$1M - $2M',
                estimatedEmployees: '8-15',
                leadScore: 71,
                sources: ['demo'],
                confidence: 'medium',
                contactName: 'James Patterson',
                contactRole: 'Practice Administrator'
            }
        ],
        'hotels': [
            {
                id: crypto.randomUUID(),
                company: 'Sunset Inn & Suites',
                legalName: 'Sunset Hospitality LLC',
                address: '8800 Highway 91',
                city, state,
                phone: '(555) 678-9012',
                website: 'https://sunsetinnsuites.com',
                industry: 'Hospitality - Hotels',
                sbaFit: '504',
                sbaFitReason: 'Hotels are classic 504 candidates for property acquisition and renovation.',
                estimatedRevenue: '$2M - $4M',
                estimatedEmployees: '15-30',
                leadScore: 85,
                sources: ['demo'],
                confidence: 'high',
                contactName: 'David Kim',
                contactRole: 'Owner/Operator'
            }
        ],
        'auto repair': [
            {
                id: crypto.randomUUID(),
                company: 'Elite Auto Service',
                address: '3500 Auto Center Dr',
                city, state,
                phone: '(555) 789-0123',
                industry: 'Automotive - Repair Shop',
                sbaFit: 'Both',
                sbaFitReason: 'Auto shops need lifts/equipment (504) and often working capital for parts inventory (7a).',
                estimatedRevenue: '$800K - $1.5M',
                estimatedEmployees: '5-12',
                leadScore: 68,
                sources: ['demo'],
                confidence: 'medium',
                contactName: 'Mike Thompson',
                contactRole: 'Owner'
            }
        ],
        'restaurants': [
            {
                id: crypto.randomUUID(),
                company: 'Mediterranean Kitchen',
                address: '2100 Downtown Plaza',
                city, state,
                phone: '(555) 890-1234',
                website: 'https://medkitchen.com',
                industry: 'Restaurant - Full Service',
                sbaFit: '7a',
                sbaFitReason: 'Restaurants typically need working capital and equipment - 7(a) is more flexible.',
                estimatedRevenue: '$600K - $1.2M',
                estimatedEmployees: '12-20',
                leadScore: 55,
                sources: ['demo'],
                confidence: 'medium',
                contactName: 'Maria Gonzalez',
                contactRole: 'Owner/Chef'
            }
        ],
        'manufacturing': [
            {
                id: crypto.randomUUID(),
                company: 'Advanced Composites Inc',
                legalName: 'Advanced Composites Inc',
                address: '7500 Industrial Park Rd',
                city, state,
                phone: '(555) 901-2345',
                website: 'https://advancedcomposites.com',
                industry: 'Manufacturing - Aerospace Components',
                sbaFit: '504',
                sbaFitReason: 'Manufacturing companies with facility and equipment needs are prime 504 candidates.',
                estimatedRevenue: '$5M - $15M',
                estimatedEmployees: '40-80',
                leadScore: 92,
                sources: ['demo'],
                confidence: 'high',
                contactName: 'Steven Park',
                contactRole: 'CEO'
            }
        ],
        'dental': [
            {
                id: crypto.randomUUID(),
                company: 'Smile Dental Care',
                address: '400 Professional Center',
                city, state,
                phone: '(555) 012-3456',
                website: 'https://smiledentalcare.com',
                industry: 'Healthcare - Dental Practice',
                sbaFit: '504',
                sbaFitReason: 'Dental practices acquiring real estate and expensive equipment are ideal 504 borrowers.',
                estimatedRevenue: '$1.5M - $3M',
                estimatedEmployees: '8-15',
                leadScore: 78,
                sources: ['demo'],
                confidence: 'high',
                contactName: 'Dr. Lisa Chang',
                contactRole: 'Owner/Dentist'
            }
        ]
    };

    // Find matching demo data
    const queryLower = query.toLowerCase();
    for (const [key, leads] of Object.entries(demoData)) {
        if (queryLower.includes(key) || key.includes(queryLower)) {
            return leads;
        }
    }

    // Default demo leads if no match
    return [
        {
            id: crypto.randomUUID(),
            company: `${query} Business Example`,
            address: '123 Business Ave',
            city, state,
            industry: query,
            sbaFit: 'Both',
            sbaFitReason: 'General business that may qualify for SBA financing based on needs.',
            estimatedRevenue: '$1M - $3M',
            estimatedEmployees: '10-25',
            leadScore: 60,
            sources: ['demo'],
            confidence: 'low',
            contactName: 'Business Owner',
            contactRole: 'Owner'
        }
    ];
};

// =====================================================
// FIRECRAWL SEARCH (via Backend Proxy)
// =====================================================

interface FirecrawlResult {
    url: string;
    title: string;
    content?: string;
    description?: string;
}

async function searchFirecrawl(query: string): Promise<{ results: FirecrawlResult[], error?: string }> {
    try {
        console.log('🔥 Searching Firecrawl via proxy:', query);
        const url = `${BACKEND_API_URL}/api/search/firecrawl?query=${encodeURIComponent(query)}`;

        const response = await fetch(url);
        const json = await response.json();

        if (!response.ok) {
            return { results: [], error: json.error || 'Firecrawl search failed' };
        }

        const data = json.data || [];
        return {
            results: data.map((item: any) => ({
                url: item.url,
                title: item.title,
                content: item.markdown || item.content || item.description || ''
            }))
        };

    } catch (e: any) {
        console.error('Firecrawl search failed:', e);
        return { results: [], error: e.message };
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
    const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

    if (!OPENAI_API_KEY || results.length === 0) {
        return [];
    }

    try {
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
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: `You are a Senior SBA Loan Underwriter & Business Development Officer. 
Your goal is to extract valid business leads from the provided search results.

TARGET: High Quality Borrowers for SBA 504 (Real Estate/Equip) and 7(a) (Working Capital) loans.

CRITERIA:
- Must be a real operating business.
- Exclude directories (Yelp, YellowPages) unless you can extract a specific business.
- Exclude government agencies, non-profits, or informational articles.

OUTPUT: JSON Array with fields:
company, legalName, address, city, state, website, industry,
sbaFit ("504"|"7a"|"Both"|"Unknown"), sbaFitReason, leadScore (1-100),
confidence ("high"|"medium"|"low"), estimatedRevenue, estimatedEmployees, contactName`
                    },
                    {
                        role: 'user',
                        content: `Search: "${query}" in ${location}\n\nRESULTS:\n${searchContext}\n\nExtract leads. Return strict JSON array.`
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
                sbaFitReason: e.sbaFitReason || 'AI assessment',
                estimatedRevenue: e.estimatedRevenue,
                estimatedEmployees: e.estimatedEmployees,
                leadScore: e.leadScore || 50,
                sources: ['firecrawl', 'gpt_reasoning'] as DataSource[],
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
    _depth: any = 'standard'
): Promise<SearchResult> {
    const startTime = Date.now();

    // 1. Try Firecrawl Search
    const { results: firecrawlResults, error: firecrawlError } = await searchFirecrawl(`${query} ${location}`);

    // 2. If Firecrawl fails or returns no results, use demo mode
    if (firecrawlResults.length === 0) {
        const demoLeads = getDemoLeads(query, location);
        return {
            leads: demoLeads,
            sources: ['demo'],
            searchTime: Date.now() - startTime,
            isDemoMode: true,
            error: firecrawlError ? `Live search unavailable: ${firecrawlError}. Showing sample data.` : undefined
        };
    }

    // 3. GPT Extraction & Reasoning
    const leads = await aiProcessFirecrawlResults(firecrawlResults, query, location);

    // 4. If GPT fails, return raw Firecrawl results as basic leads
    if (leads.length === 0) {
        const basicLeads: EnrichedLead[] = firecrawlResults.slice(0, 5).map(r => ({
            id: crypto.randomUUID(),
            company: r.title.split(' - ')[0].split(' | ')[0].substring(0, 50),
            address: location,
            city: location.split(',')[0].trim(),
            state: location.split(',')[1]?.trim() || 'CA',
            website: r.url,
            industry: query,
            sbaFit: 'Unknown' as const,
            sbaFitReason: 'Requires manual review - AI analysis unavailable',
            leadScore: 50,
            sources: ['firecrawl'] as DataSource[],
            confidence: 'low' as const
        }));

        return {
            leads: basicLeads,
            sources: ['firecrawl'],
            searchTime: Date.now() - startTime,
            isDemoMode: false,
            error: 'AI analysis unavailable. Showing raw search results.'
        };
    }

    return {
        leads: leads,
        sources: ['firecrawl', 'gpt_reasoning'],
        searchTime: Date.now() - startTime,
        isDemoMode: false
    };
}
