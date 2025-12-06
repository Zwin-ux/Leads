import type { OcCompany, OcSearchResponse } from "./ocTypes";

const NOW = new Date().toISOString();

// Mock Data based on OpenCorporates BP Example and Test Data
export const ocFixtureCompanies: Record<string, OcCompany> = {
    // GB Example from Docs
    "gb_00102498": {
        name: "BP P.L.C.",
        company_number: "00102498",
        jurisdiction_code: "gb",
        company_type: "Public Limited Company",
        current_status: "Active",
        incorporation_date: "1909-04-14",
        opencorporates_url: "https://opencorporates.com/companies/gb/00102498",
        registered_address_in_full: "1 ST JAMES'S SQUARE, LONDON, SW1Y 4PD",
        officers: [
            {
                officer: {
                    name: "DAVID JOHN JACKSON",
                    position: "secretary",
                    start_date: "2003-07-24"
                }
            }
        ],
        source: {
            publisher: "UK Companies House",
            url: "http://xmlgw.companieshouse.gov.uk/",
            retrieved_at: NOW
        }
    },
    // Test Lead Data for Enrichment verified in tests
    // "Enriched Entity Inc" or "Pure Water LLC"
    "us_ca_2021555555": {
        name: "ENRICHED ENTITY INC",
        company_number: "2021555555",
        jurisdiction_code: "us_ca",
        company_type: "Domestic Stock",
        current_status: "Active", // Maps to Green badge
        incorporation_date: "2021-01-01",
        registered_address_in_full: "999 WEALTH BLVD, BEVERLY HILLS, CA 90210",
        officers: [
            {
                officer: { name: "TEST CEO", position: "CEO" }
            }
        ],
        source: {
            publisher: "California Secretary of State",
            url: "https://bizfileonline.sos.ca.gov/",
            retrieved_at: NOW
        }
    },
    // "Pure Water LLC" - Demo Match
    "us_ca_pure_water": {
        name: "PURE WATER LLC",
        company_number: "C9999999",
        jurisdiction_code: "us_ca",
        company_type: "LLC",
        current_status: "Active",
        incorporation_date: "2015-05-20",
        registered_address_in_full: "123 PURE LANE, SACRAMENTO, CA 95814",
        source: {
            publisher: "California Secretary of State",
            url: "https://bizfileonline.sos.ca.gov/",
            retrieved_at: NOW
        }
    }
};

export function searchOcFixtures(term: string): OcSearchResponse {
    const t = term.trim().toUpperCase();
    if (!t) return { companies: [], page: 1, per_page: 30, total_count: 0, total_pages: 0 };

    // Test Hook: If searching for "Enriched", return the mock enriched entity
    if (t.includes("ENRICHED")) {
        const c = ocFixtureCompanies["us_ca_2021555555"];
        return {
            companies: [{ company: c }],
            page: 1,
            per_page: 30,
            total_count: 1,
            total_pages: 1
        };
    }

    const matches = Object.values(ocFixtureCompanies).filter(c =>
        c.name.toUpperCase().includes(t) || c.company_number.includes(t)
    );

    return {
        companies: matches.map(c => ({ company: c })),
        page: 1,
        per_page: 30,
        total_count: matches.length,
        total_pages: 1
    };
}

export function getOcFixtureDetails(jurisdiction: string, companyNumber: string): OcCompany | null {
    // Try explicit key
    const key = `${jurisdiction.toLowerCase()}_${companyNumber}`;
    if (ocFixtureCompanies[key]) return ocFixtureCompanies[key];

    // Or just search values
    return Object.values(ocFixtureCompanies).find(
        c => c.jurisdiction_code === jurisdiction && c.company_number === companyNumber
    ) || null;
}
