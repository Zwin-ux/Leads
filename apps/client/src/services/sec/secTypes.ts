export interface SecSubmission {
    cik: string;
    entityType: string;
    sic: string;
    sicDescription: string;
    insiderTransactionForOwnerExists: number;
    insiderTransactionForIssuerExists: number;
    name: string;
    tickers: string[];
    exchanges: string[];
    ein: string;
    description: string;
    website: string;
    investorWebsite: string;
    category: string;
    fiscalYearEnd: string;
    stateOfIncorporation: string;
    stateOfIncorporationDescription: string;
    addresses: {
        mailing: SecAddress;
        business: SecAddress;
    };
    phone: string;
    flags: string;
    formerNames: Array<{
        name: string;
        from: string;
        to: string;
    }>;
    filings: {
        recent: SecFilingsRecent;
    };
}

export interface SecAddress {
    street1: string;
    street2: string | null;
    city: string;
    stateOrCountry: string;
    zipCode: string;
    stateOrCountryDescription: string;
}

export interface SecFilingsRecent {
    accessionNumber: string[];
    filingDate: string[];
    reportDate: string[];
    acceptanceDateTime: string[];
    act: string[];
    form: string[];
    fileNumber: string[];
    filmNumber: string[];
    items: string[];
    size: number[];
    isXBRL: number[];
    isInlineXBRL: number[];
    primaryDocument: string[];
    primaryDocDescription: string[];
}

// Simplified Concept structure for our use case (Revenue, Net Income)
export interface SecConceptFrame {
    // taxonomy/tag/units/period
    data: number;
    unit: string;
}
