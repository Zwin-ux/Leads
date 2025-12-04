export interface Lead {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    stage: 'New' | 'Contacted' | 'Warm' | 'In Process' | 'Not a Fit';
    lastContactDate?: string;
    nextAction?: string;
    // SBA Context
    loanProgram?: '504' | '7a' | 'Micro' | 'Unknown';
    dealStage?: 'Prospecting' | 'Prequal' | 'App' | 'Underwriting' | 'Closing';
    // Auto-Pilot
    autoPilotStatus?: boolean;
    nextTopic?: string;

    // CRM Expansion
    // Financials
    loanAmount?: number;
    annualRevenue?: number;
    netIncome?: number;
    yearsInBusiness?: number;

    // Deal Structure (504/7a)
    projectCost?: number; // 504
    propertyType?: string; // 504
    occupancyStatus?: string; // 504
    useOfFunds?: string; // 7a (Working Capital, Refi, etc.)
    collateral?: string; // 7a

    // Notes & Activity
    notes?: Note[];
}

export interface Note {
    id: string;
    content: string;
    timestamp: string;
    author: string;
    type: 'UserNote' | 'SystemEvent';
}
