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

// Document types for SBA loans
export type DocumentType =
    | 'tax_returns_personal_1'
    | 'tax_returns_personal_2'
    | 'tax_returns_personal_3'
    | 'tax_returns_business_1'
    | 'tax_returns_business_2'
    | 'tax_returns_business_3'
    | 'bank_statements'
    | 'financials_ytd'
    | 'financials_interim'
    | 'purchase_agreement'
    | 'lease_agreement'
    | 'articles_of_org'
    | 'operating_agreement'
    | 'business_license'
    | 'insurance_quote'
    | 'appraisal'
    | 'environmental_phase1'
    | 'environmental_phase2'
    | 'title_commitment'
    | 'survey'
    | 'sba_form_1919'
    | 'sba_form_1920'
    | 'personal_financial_statement'
    | 'debt_schedule'
    | 'accounts_receivable'
    | 'accounts_payable'
    | 'equipment_list'
    | 'other'
    | 'sba_form_1244'
    | 'credit_report';


export interface Document {
    id: string;
    type: DocumentType;
    label: string;
    status: 'needed' | 'requested' | 'received' | 'ordered' | 'waived' | 'na';
    requestedDate?: string;
    receivedDate?: string;
    documentDate?: string; // New field for expiration tracking
    notes?: string;
    // ShareFile-ready fields
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
}

// Bank partner participation on a deal
export interface BankPartnerDeal {
    bankerId: string;
    bankerName: string;
    bankName: string;
    status: 'approached' | 'reviewing' | 'approved' | 'declined' | 'committed';
    loanAmount?: number;
    rate?: string;
    term?: string;
    conditions?: string[];
    notes?: string;
    updatedAt: string;
}

// Deal stages for full loan lifecycle
export type DealStage =
    | 'Prospect'
    | 'Prequal'
    | 'Application'
    | 'Processing'
    | 'Underwriting'
    | 'Approved'
    | 'Closing'
    | 'Funded'
    | 'Lost';

// User roles for permission control
export type UserRole = 'bdo' | 'loan_officer' | 'processor' | 'underwriter' | 'manager' | 'admin';

export interface Lead {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string; // Display Name
    businessName?: string; // Legal Name

    // Core Status
    stage: 'New' | 'Contacted' | 'Warm' | 'Qualified' | 'Proposal' | 'Negotiation' | 'In Process' | 'Not a Fit';

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
    dealStage?: DealStage;
    loanAmount?: number;

    // LO Deal Fields
    loanPurpose?: 'RE Purchase' | 'RE Refi' | 'Equipment' | 'Working Capital' | 'Debt Refi' | 'Construction';
    propertyAddress?: string;
    propertyCity?: string;
    propertyState?: string;
    estimatedValue?: number;
    borrowerFico?: number;

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
    lastContactDate?: string;
    nextAction?: string;

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

    // Documents (LO Feature)
    documents?: Document[];

    // Bank Partners on this deal (LO Feature)
    bankPartners?: BankPartnerDeal[];

    // Closing Checklist (Processor Feature)
    closingItems?: ClosingItem[];
    postCloseItems?: PostCloseItem[];
    closingDate?: string;
    fundingDate?: string;

    // E-Tran Integration
    etranAppId?: string;

    // Visibility / Permissions
    assignedTo?: string; // User ID of assigned LO
    visibility?: 'private' | 'team' | 'global';
    createdBy?: string;
    createdAt?: string;
    updatedAt?: string;

    // Legacy / Repository Fields (Ported from Azure Functions/Prisma)
    address?: string; // Business Address
    state?: string;
    zip?: string;
    source?: string;
    status?: string | 'new';
    financials?: any;
    aiAnalysis?: any;
    stips?: any;
}

// Closing checklist item (Processor workflow)
export interface ClosingItem {
    id: string;
    category: 'pre_closing' | 'closing_day' | 'post_closing';
    label: string;
    status: 'pending' | 'in_progress' | 'complete' | 'na';
    dueDate?: string;
    completedDate?: string;
    assignedTo?: string;
    thirdParty?: string; // Title company, escrow, etc.
    thirdPartyContact?: string;
    notes?: string;
}

// Post-close tracking item
export interface PostCloseItem {
    id: string;
    label: string;
    status: 'pending' | 'received' | 'filed' | 'na';
    dueDate?: string;
    completedDate?: string;
    notes?: string;
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

// Document checklist templates by program
export const DOC_CHECKLIST_504: DocumentType[] = [
    'tax_returns_personal_1',
    'tax_returns_personal_2',
    'tax_returns_personal_3',
    'tax_returns_business_1',
    'tax_returns_business_2',
    'tax_returns_business_3',
    'bank_statements',
    'financials_ytd',
    'purchase_agreement',
    'articles_of_org',
    'appraisal',
    'environmental_phase1',
    'title_commitment',
    'sba_form_1919',
    'personal_financial_statement',
    'insurance_quote'
];

export const DOC_CHECKLIST_7A: DocumentType[] = [
    'tax_returns_personal_1',
    'tax_returns_personal_2',
    'tax_returns_business_1',
    'tax_returns_business_2',
    'bank_statements',
    'financials_ytd',
    'articles_of_org',
    'sba_form_1919',
    'personal_financial_statement',
    'debt_schedule'
];

// Document type labels
export const DOC_TYPE_LABELS: Record<DocumentType, string> = {
    'tax_returns_personal_1': 'Personal Tax Returns (Year 1)',
    'tax_returns_personal_2': 'Personal Tax Returns (Year 2)',
    'tax_returns_personal_3': 'Personal Tax Returns (Year 3)',
    'tax_returns_business_1': 'Business Tax Returns (Year 1)',
    'tax_returns_business_2': 'Business Tax Returns (Year 2)',
    'tax_returns_business_3': 'Business Tax Returns (Year 3)',
    'bank_statements': 'Bank Statements (6 months)',
    'financials_ytd': 'YTD Financial Statements',
    'financials_interim': 'Interim Financials',
    'purchase_agreement': 'Purchase Agreement',
    'lease_agreement': 'Lease Agreement',
    'articles_of_org': 'Articles of Organization',
    'operating_agreement': 'Operating Agreement',
    'business_license': 'Business License',
    'insurance_quote': 'Insurance Quote',
    'appraisal': 'Appraisal',
    'environmental_phase1': 'Environmental Phase I',
    'environmental_phase2': 'Environmental Phase II',
    'title_commitment': 'Title Commitment',
    'survey': 'Survey',
    'sba_form_1919': 'SBA Form 1919',
    'sba_form_1920': 'SBA Form 1920',
    'personal_financial_statement': 'Personal Financial Statement',
    'debt_schedule': 'Debt Schedule',
    'accounts_receivable': 'Accounts Receivable Aging',
    'accounts_payable': 'Accounts Payable Aging',
    'equipment_list': 'Equipment List',
    'other': 'Other',
    'sba_form_1244': 'SBA Form 1244 (Application)',
    'credit_report': 'Credit Report'
};

export interface SalesPerson {
    id: string;
    name: string;
    title: string;
    phone: string;
    email: string;
    products: string[]; // e.g., '504', '7a'
}

export interface AdRequest {
    product: string;
    goal: string;
    tone: string;
    length: 'Short' | 'Medium' | 'Long';
    salesPersonId?: string;
    notes?: string;
    // New fields for specific lead targeting
    targetBusiness?: {
        name: string;
        industry?: string;
        city?: string;
        state?: string;
    };
}
