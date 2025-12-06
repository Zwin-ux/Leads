import { ocSearch } from './oc/ocClient';
import { geoService } from './geoService';
import { sbaStatsService } from './sbaStatsService';
import { getSecSubmissions, getCikForTicker } from './sec/secClient';
import type { Lead } from '@leads/shared';

// The centralized Enriched Entity Record
export interface BusinessEntityEnriched {
    id: string; // Maps to Lead ID
    legalName: string;

    // Entity Data (OpenCorporates)
    entityNumber?: string;
    jurisdictionCode?: string;
    statusCode?: string | number; // 1 for Active
    status?: string;
    agentName?: string; // or Officer
    incorporationDate?: string;

    // SEC Data (Public Markets)
    cik?: string;
    ticker?: string;
    latestFilingDate?: string; // 10-K or 10-Q
    latestFilingType?: string;
    fiscalYearEnd?: string;

    // Geo/LMI Data
    addressStreet?: string;
    addressCity?: string;
    addressState?: string;
    addressZip?: string;
    geocodeLat?: number;
    geocodeLng?: number;
    censusTract?: string;
    isLMI?: boolean;
    lmiPct?: number;

    // SBA Stats
    naicsCode?: string;
    sbaLoanCount?: number;
    sbaLoanTotal?: number;
    sbaLastLoanDate?: string;

    updatedAt: string;
}

class EnrichmentService {
    private KEY = 'leads_enriched_entities';

    private getStore(): Record<string, BusinessEntityEnriched> {
        const stored = localStorage.getItem(this.KEY);
        return stored ? JSON.parse(stored) : {};
    }

    private saveStore(data: Record<string, BusinessEntityEnriched>) {
        localStorage.setItem(this.KEY, JSON.stringify(data));
    }

    getEnrichedData(leadId: string): BusinessEntityEnriched | null {
        return this.getStore()[leadId] || null;
    }

    // THE ORCHESTRATOR
    async enrichIntake(lead: Lead): Promise<BusinessEntityEnriched> {
        console.log(`[Enrichment] Starting for ${lead.company}`);
        const store = this.getStore();

        // 1. Initialize Record
        let record: BusinessEntityEnriched = store[lead.id] || {
            id: lead.id,
            legalName: lead.company,
            updatedAt: new Date().toISOString()
        };

        // 2. Entity Verification (OpenCorporates)
        if (lead.company) {
            // Map state to ISO code if possible (e.g. CA -> us_ca)
            // Simple heuristic for now: 'us_' + lowercase state
            const jurisdiction = lead.stateOfInc ? `us_${lead.stateOfInc.toLowerCase()}` : undefined;

            const results = await ocSearch(lead.company, jurisdiction);
            if (results && results.length > 0) {
                // Pick best match (first one)
                const match = results[0];
                record.entityNumber = match.company_number;
                record.jurisdictionCode = match.jurisdiction_code;

                // Status Mapping
                const isActive = match.current_status?.toLowerCase() === 'active';
                record.statusCode = isActive ? 1 : 0;
                record.status = match.current_status || 'Unknown';

                record.incorporationDate = match.incorporation_date;

                // Agent/Officer - OC returns officers array
                if (match.officers && match.officers.length > 0) {
                    record.agentName = match.officers[0].officer.name;
                } else {
                    record.agentName = 'See Details';
                }
            }
        }

        // 3. Geocoding & LMI (Phase 2)
        const addressStr = lead.propertyAddress || `${lead.city}, ${lead.stateOfInc}`;
        if (addressStr) {
            const geo = await geoService.geocode(addressStr);
            if (geo) {
                record.geocodeLat = geo.lat;
                record.geocodeLng = geo.lng;
                record.censusTract = geo.censusTract;
                record.isLMI = geo.isLmi;
                record.lmiPct = geo.lmiPct;
                record.addressStreet = lead.propertyAddress; // Store what we geocoded
            }
        }

        // 4. SBA Stats (Phase 3)
        if (lead.naicsCode) {
            // Need county from Geo? Or allow manual?
            // For now, use dummy county or derived from geo
            const county = 'Los Angeles'; // Fallback
            const sba = await sbaStatsService.getStats(lead.naicsCode, lead.stateOfInc || 'CA', county);
            if (sba) {
                record.naicsCode = lead.naicsCode;
                record.sbaLoanCount = sba.loanCount;
                record.sbaLoanTotal = sba.totalAmount;
                record.sbaLastLoanDate = sba.lastLoanDate;
            }
        }

        // 5. SEC / Public Markets (Phase 6)
        // Heuristic: Check if name looks like a public company or if ticker provided (no ticker field in Lead yet)
        // For now, check if name matches a known ticker in our simplified list
        const likelyTicker = this.guessTicker(lead.company);
        if (likelyTicker) {
            const cik = getCikForTicker(likelyTicker);
            if (cik) {
                const secData = await getSecSubmissions(cik);
                if (secData) {
                    record.cik = secData.cik;
                    record.ticker = secData.tickers[0];
                    record.fiscalYearEnd = secData.fiscalYearEnd;

                    if (secData.filings?.recent) {
                        const recent = secData.filings.recent;
                        if (recent.filingDate && recent.filingDate.length > 0) {
                            record.latestFilingDate = recent.filingDate[0];
                            record.latestFilingType = recent.form[0];
                        }
                    }
                }
            }
        }

        record.updatedAt = new Date().toISOString();

        // Save
        store[lead.id] = record;
        this.saveStore(store);

        console.log(`[Enrichment] Complete for ${lead.company}`, record);
        return record;
    }

    private guessTicker(name: string): string | null {
        const n = name.toLowerCase();
        if (n.includes('apple')) return 'AAPL';
        if (n.includes('tesla')) return 'TSLA';
        if (n.includes('microsoft')) return 'MSFT';
        if (n.includes('google') || n.includes('alphabet')) return 'GOOG';
        if (n.includes('amazon')) return 'AMZN';
        return null;
    }
}

export const enrichmentService = new EnrichmentService();
