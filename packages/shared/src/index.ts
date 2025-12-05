export interface Banker {
    id: string;
    name: string;
    bank: string;
    branch: string;
    title: string;
    phone: string;
    email: string;
    trustScore: 1 | 2 | 3 | 4 | 5;
    totalFunded: number;
    lastDealDate: string;
    notes: string;
}

export interface Lead {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string; // Display Name
    businessName?: string; // Legal Name

    // Core Status
    stage: 'New' | 'Contacted' | 'Warm' | 'In Process' | 'Not a Fit';

    // Business Details
    stateOfInc?: string;
    city?: string;
    owner?: string; // BDO Owner
    industry?: string;
    naicsCode?: string;
    yearsInBusiness?: number;
    annualRevenue?: number;
    netIncome?: number;

    // Deal Context
    loanProgram?: '504' | '7a' | 'Micro' | 'Unknown';
    dealStage?: 'Prospecting' | 'Prequal' | 'App' | 'Underwriting' | 'Closing';
    loanAmount?: number;

    // Deal Structure (Multi-selects)
    projectTypes?: ('Purchase' | 'Refinance' | 'Construction' | 'Expansion' | 'Partner Buyout' | 'Debt Consolidation')[];
    useOfFunds?: ('Land' | 'Building' | 'Equipment' | 'Working Capital' | 'Debt Refi' | 'Other')[];

    // Referral & Banking
    referralSource?: 'Banker' | 'Broker' | 'Direct' | 'Other';
    bankerId?: string;
    existingBank?: string;

    // 504 Specifics
    projectCost?: number;
    propertyType?: string;
    occupancyStatus?: string;
    collateral?: string;

    // Activity & Tasks
    lastContactDate?: string; // Legacy compat
    nextAction?: string; // Legacy compat

    lastContact?: {
        date: string;
        method: 'Call' | 'Email' | 'Meeting';
        outcome: string;
    };
    nextTask?: {
        date: string;
        action: string;
    };

    // Auto-Pilot
    autoPilotStatus?: boolean;
    nextTopic?: string;

    // Notes
    notes?: Note[];

    // Contacts
    contacts?: Contact[];
}

export interface Contact {
    id: string;
    name: string;
    role: string;
    email: string;
    phone?: string;
    isPrimary: boolean;
}

export interface Note {
    id: string;
    content: string;
    timestamp: string;
    author: string;
    type: 'UserNote' | 'SystemEvent';
    context?: 'Call' | 'Email' | 'Meeting' | 'System' | 'Manual';
}
