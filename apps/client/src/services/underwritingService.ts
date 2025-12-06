export interface Financials {
    revenue: number;
    coqs: number;
    opex: number;
    debtService: number;
    noi: number;
    dscr: number;
}

export interface Stipulation {
    id: string;
    description: string;
    status: 'outstanding' | 'received' | 'waived';
    requiredDate?: string;
}

export interface UnderwritingAnalysis {
    leadId: string;
    financials: Financials;
    riskRating: number; // 1-10
    strengths: string[];
    weaknesses: string[];
    stips: Stipulation[];
    locationVerified: boolean;
    memoDraft: string;
}

const DEFAULT_STIPS: Stipulation[] = [
    { id: '1', description: '3 Years Business Tax Returns', status: 'outstanding' },
    { id: '2', description: 'Personal Financial Statement (PFS)', status: 'outstanding' },
    { id: '3', description: 'Business Debt Schedule', status: 'outstanding' },
    { id: '4', description: 'Entity Documents (Articles, Bylaws)', status: 'received' },
];

class UnderwritingService {
    private analyses: Record<string, UnderwritingAnalysis> = {};

    constructor() {
        this.load();
    }

    private load() {
        const stored = localStorage.getItem('leads_uw_analyses');
        if (stored) {
            this.analyses = JSON.parse(stored);
        }
    }

    private save() {
        localStorage.setItem('leads_uw_analyses', JSON.stringify(this.analyses));
    }

    getAnalysis(leadId: string): UnderwritingAnalysis {
        if (!this.analyses[leadId]) {
            // Initialize empty analysis
            this.analyses[leadId] = {
                leadId,
                financials: { revenue: 0, coqs: 0, opex: 0, debtService: 0, noi: 0, dscr: 0 },
                riskRating: 5,
                strengths: ['Strong Management Experience'],
                weaknesses: ['High Leverage'],
                stips: [...DEFAULT_STIPS],
                locationVerified: false,
                memoDraft: '' // Will auto-generate on load if empty
            };
            this.save();
        }
        return this.analyses[leadId];
    }

    updateFinancials(leadId: string, financials: Partial<Financials>): UnderwritingAnalysis {
        const analysis = this.getAnalysis(leadId);

        // Merge and Recalculate
        const newFin = { ...analysis.financials, ...financials };
        // NOI = Revenue - COGS - Opex
        newFin.noi = newFin.revenue - newFin.coqs - newFin.opex;
        // DSCR = NOI / Debt Service
        newFin.dscr = newFin.debtService > 0 ? Number((newFin.noi / newFin.debtService).toFixed(2)) : 0;

        analysis.financials = newFin;
        this.save();
        return analysis;
    }

    updateStip(leadId: string, stipId: string, status: Stipulation['status']): UnderwritingAnalysis {
        const analysis = this.getAnalysis(leadId);
        const stip = analysis.stips.find(s => s.id === stipId);
        if (stip) {
            stip.status = status;
            this.save();
        }
        return analysis;
    }

    updateMemo(leadId: string, text: string): UnderwritingAnalysis {
        const analysis = this.getAnalysis(leadId);
        analysis.memoDraft = text;
        this.save();
        return analysis;
    }

    updateRiskRating(leadId: string, rating: number, strengths?: string[], weaknesses?: string[]): UnderwritingAnalysis {
        const analysis = this.getAnalysis(leadId);
        analysis.riskRating = rating;
        if (strengths) analysis.strengths = strengths;
        if (weaknesses) analysis.weaknesses = weaknesses;
        this.save();
        return analysis;
    }

    async verifyLocation(address: string): Promise<{ lat: number, lon: number, displayName: string } | null> {
        try {
            // Using OpenStreetMap Nominatim API (Free, no key, Rate Limited)
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
            const res = await fetch(url);
            const data = await res.json();

            if (data && data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lon: parseFloat(data[0].lon),
                    displayName: data[0].display_name
                };
            }
            return null;
        } catch (e) {
            console.error("Location lookup failed", e);
            return null;
        }
    }
}

export const underwritingService = new UnderwritingService();
