// OpenCorporates API Types

export interface OcOfficer {
    name: string;
    position?: string;
    start_date?: string;
    end_date?: string;
    opencorporates_url?: string;
}

export interface OcFiling {
    title: string;
    date: string;
    description?: string;
    filing_code?: string;
    opencorporates_url?: string;
}

export interface OcCompany {
    name: string;
    company_number: string;
    jurisdiction_code: string;
    incorporation_date?: string;
    dissolution_date?: string;
    company_type?: string;
    current_status?: string; // e.g. "Active", "Dissolved"
    registered_address_in_full?: string;
    registry_url?: string;
    opencorporates_url?: string;

    // Detailed fields (may be present or sparse)
    officers?: Array<{ officer: OcOfficer }>;
    filings?: Array<{ filing: OcFiling }>;

    previous_names?: Array<{
        company_name: string;
        con_date?: string;
        type?: string;
    }>;

    source?: {
        publisher: string;
        url: string;
        retrieved_at: string;
    };
}

export interface OcResponse<T> {
    api_version: string;
    results: T;
}

export interface OcSearchResponse {
    companies: Array<{ company: OcCompany }>;
    page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
}

export interface OcGetCompanyResponse {
    company: OcCompany;
}
