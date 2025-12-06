import { searchOcFixtures, getOcFixtureDetails } from "./ocFixtures";
import type { OcCompany, OcSearchResponse, OcGetCompanyResponse } from "./ocTypes";

const OC_BASE = "https://api.opencorporates.com/v0.4";

// Feature Flag & Config
const OC_ENABLED = import.meta.env.VITE_OPENCORPORATES_ENABLED === "true";
const OC_API_TOKEN = import.meta.env.VITE_OPENCORPORATES_API_KEY;

export function isOcEnabled(): boolean {
    return OC_ENABLED;
}

export async function ocSearch(term: string, jurisdiction?: string): Promise<OcCompany[]> {
    if (!OC_ENABLED) {
        return searchOcFixtures(term).companies.map(c => c.company);
    }

    if (!OC_API_TOKEN) {
        console.warn("OpenCorporates Enabled but Missing API Token");
        return [];
    }

    const url = new URL(`${OC_BASE}/companies/search`);
    url.searchParams.set("q", term);
    url.searchParams.set("api_token", OC_API_TOKEN);
    if (jurisdiction) {
        url.searchParams.set("jurisdiction_code", jurisdiction);
    }
    // Default 30 results

    try {
        const res = await fetch(url.toString());
        if (!res.ok) {
            throw new Error(`OpenCorporates Search Failed: ${res.status} ${res.statusText}`);
        }
        const data: { results: OcSearchResponse } = await res.json();
        return data.results.companies.map(c => c.company);
    } catch (err) {
        console.error("OC Search Error", err);
        return [];
    }
}

export async function ocGetDetails(jurisdiction: string, companyNumber: string): Promise<OcCompany | null> {
    if (!OC_ENABLED) {
        return getOcFixtureDetails(jurisdiction, companyNumber);
    }

    if (!OC_API_TOKEN) {
        console.warn("OpenCorporates Enabled but Missing API Token");
        return null;
    }

    const url = new URL(`${OC_BASE}/companies/${jurisdiction}/${companyNumber}`);
    url.searchParams.set("api_token", OC_API_TOKEN);

    try {
        const res = await fetch(url.toString());
        if (res.status === 404) return null;
        if (!res.ok) {
            throw new Error(`OpenCorporates Details Failed: ${res.status}`);
        }
        const data: { results: OcGetCompanyResponse } = await res.json();
        return data.results.company;
    } catch (err) {
        console.error("OC Details Error", err);
        return null;
    }
}
