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

export interface User {
    id: string;
    name: string;
    email: string;
    title?: string;
    role: string;
}

// ============================================
// SBA 504 LOAN MANAGEMENT TYPES
// ============================================

// Loan Risk Assessment Levels
export type LoanRiskLevel = 'low' | 'medium' | 'high' | 'very_high';

// Loan Status for full lifecycle
export type LoanStatus =
    | 'prospect'
    | 'application'
    | 'processing'
    | 'committee_review'
    | 'president_approval'
    | 'board_ratify'
    | 'sba_submitted'
    | 'sba_authorized'
    | 'closing'
    | 'funded'
    | 'servicing'
    | 'paid_off'
    | 'cancelled'
    | 'charged_off'
    | 'liquidated';

// Loan Characteristics (Boolean flags)
export interface LoanCharacteristics {
    isPurchase?: boolean;
    isConstruction?: boolean;
    isEquipment?: boolean;
    hasLifeInsurance?: boolean;
    isGroundLeased?: boolean;
    isFloodZone?: boolean;
    isStartup?: boolean;
    isRefinance50?: boolean;
    isRefinance?: boolean;
    isFranchise?: boolean;
    franchiseName?: string;
}

// Property/Project Details
export interface ProjectProperty {
    apn?: string; // Assessor's Parcel Number
    streetNumber?: string;
    streetName?: string;
    suiteNumber?: string;
    city?: string;
    state?: string;
    county?: string;
    zipCode?: string;
    webPage?: string;
    congressionalDistrict?: string;
}

// Financial Structure of the Loan
export interface LoanFinancialStructure {
    totalProject?: number;
    thirdParty1st?: number; // First lien amount
    netDebenture?: number; // SBA debenture (net)
    interim?: number; // Interim loan amount
    borrowerDown?: number; // Borrower equity
    grossDebenture?: number; // Gross debenture
    originationFee?: number;
    servicingFee?: number;
    closingFee?: number;
    sbaHalfPoint?: number;
    halfPointDateReceived?: string;
}

// Interest Rates
export interface LoanRates {
    debentureRate?: number;
    cdcNoteRate?: number;
    firstNoteRate?: number;
    firstLoanIndex?: string; // e.g., "Prime", "SOFR"
    interimLoanRate?: number;
    interimLoanIndex?: string;
}

// Lender Information
export interface LoanLenders {
    firstLender?: string;
    firstLenderContact?: string;
    interimLender?: string;
    interimLenderContact?: string;
}

// Approval Workflow Dates
export interface LoanApprovals {
    loanCommitteeApproval?: string;
    presidentApproval?: string;
    boardRatify?: string;
    boardApproval?: string;
    dateToSba?: string;
    authDate?: string;
    authNumber?: string;
}

// SBA 327 Closing Documents
export interface Sba327Forms {
    sba327_1?: string;
    sba327_2?: string;
    sba327_3?: string;
    sba327_4?: string;
}

// Environmental & Appraisal Compliance
export interface LoanCompliance {
    envDateApproved?: string;
    envDateOfReport?: string;
    appDateApproved?: string;
    appDate?: string;
}

// Funding Milestones
export interface FundingMilestones {
    bankRecordDate?: string;
    bankFundDate?: string;
    escrowCloseDate?: string;
    cdcSigningDate?: string;
    cdcFundDate?: string;
    noticeOfCompletion?: string;
    reconveyanceRecvdDate?: string;
}

// UCC Filing Information
export interface UccFiling {
    uccFilingDate?: string;
    uccContinuationFilingDate?: string;
    uccFilingNo?: string;
}

// Risk Assessment
export interface LoanRiskAssessment {
    loanRisk?: LoanRiskLevel;
    applicationLoanRating?: number; // 1-5
    servicingLoanRating?: number; // 1-5
    riskNotes?: string;
}

// Jobs Impact (SBA Requirement)
export interface JobsImpact {
    jobsBeforeProject?: number;
    jobsCreated?: number;
    jobsRetained?: number;
    jobs2YrsProjected?: number;
    jobs2YrsActual?: number;
}

// Insurance Information
export interface LoanInsurance {
    insCoPolicyNo?: string;
    insExpDate?: string;
    insCoName?: string;
    insCoAgentName?: string;
    insPhone?: string;
    insFax?: string;
    insEmail?: string;
}

// Servicing & Disposition
export interface LoanServicing {
    principleBalance?: number;
    lastDatePaid?: string;
    cancelledDate?: string;
    liquidationDate?: string;
    liquidationBalance?: number;
    paidDate?: string;
    chargeOffDate?: string;
    chargeOffBalance?: number;
    shortSaleBalance?: number;
    lastSiteVisit?: string;
}

// Borrower/Operating Company Details
export interface BorrowerDetails {
    borrowerName?: string;
    dba?: string;
    operatingCompany?: string;
    epc?: string; // Eligible Passive Company
}

// Complete SBA 504 Loan Data Structure
export interface Sba504LoanData {
    // Core Identifiers
    projectId?: string;
    loanStatus?: LoanStatus;

    // Assignment
    bdo?: string;
    loanProcessor?: string;
    lpAssignedDate?: string;
    dateReceived?: string;

    // Borrower
    borrower?: BorrowerDetails;

    // Project/Property
    project?: ProjectProperty;

    // Loan Characteristics
    characteristics?: LoanCharacteristics;

    // Financial Structure
    financial?: LoanFinancialStructure;

    // Rates
    rates?: LoanRates;

    // Lenders
    lenders?: LoanLenders;

    // Approvals
    approvals?: LoanApprovals;

    // SBA 327 Forms
    sba327?: Sba327Forms;

    // Compliance
    compliance?: LoanCompliance;

    // Funding
    funding?: FundingMilestones;

    // UCC
    ucc?: UccFiling;

    // Risk
    risk?: LoanRiskAssessment;

    // Jobs
    jobs?: JobsImpact;

    // Insurance
    insurance?: LoanInsurance;

    // Servicing
    servicing?: LoanServicing;
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
    stage: 'New' | 'Contacted' | 'Warm' | 'Qualified' | 'Proposal' | 'Negotiation' | 'In Process' | 'Not a Fit';

    // Business Details
    title?: string; // Job Title
    linkedinProfile?: string;
    website?: string;
    secondaryEmail?: string;

    stateOfInc?: string;
    city?: string; // Business City
    state?: string; // Business State
    address?: string; // Business Address
    zip?: string; // Business Zip

    owner?: string; // BDO Owner
    industry?: string;
    naicsCode?: string;
    yearsInBusiness?: number;
    annualRevenue?: number;
    netIncome?: number;
    numberEmployees?: number;

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

    // Deal Physics (The Deal Desk)
    financials?: {
        noi?: number; // Net Operating Income
        existingDebtService?: number; // Annual
        proposedDebtService?: number; // Annual (Calculated)
        totalProjectCost?: number; // Total Project
        loanAmountInfo?: number; // Request
        downPayment?: number;
        appraisedValue?: number; // For LTV
    };

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
    stipulations?: Stipulation[];

    // Bank Partners on this deal (LO Feature)
    bankPartners?: BankPartnerDeal[];

    // Closing Checklist (Processor Feature)
    closingItems?: ClosingItem[];
    postCloseItems?: PostCloseItem[];
    closingDate?: string;
    fundingDate?: string;

    // Processing Workflow
    processorId?: string;
    processingPriority?: string;
    targetClosingDate?: string;

    // BDO / Qualification
    sbaFit?: string;
    leadScore?: number;
    // dealStage?: string; // Duplicate (uses DealStage type)
    dealStructure?: any; // Sources & Uses JSON
    qualificationData?: any; // BDO Checklist State
    estimatedRevenue?: string;
    estimatedEmployees?: string;

    // E-Tran Integration
    etranAppId?: string;

    // Visibility / Permissions
    assignedTo?: string; // User ID of assigned LO
    visibility?: 'private' | 'team' | 'global';
    createdBy?: string;
    createdAt?: string;
    updatedAt?: string;

    // Legacy / Repository Fields (Ported from Azure Functions/Prisma)
    // address?: string; // Use propertyAddress or granular fields
    // state?: string;
    // zip?: string;
    completedDate?: string;
    // assignedTo?: string; // Duplicate
    thirdParty?: string; // Title company, escrow, etc.
    thirdPartyContact?: string;
    // notes?: string; // Duplicate (uses Note[])

    // ============================================
    // SBA 504 LOAN DATA (Full Lifecycle)
    // ============================================
    sba504?: Sba504LoanData;
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

export interface Stipulation {
    id: string;
    title: string;
    description: string;
    status: 'Pending' | 'In Review' | 'Cleared' | 'Waived';
    assignedTo: 'BDO' | 'Processor' | 'Client';
    dueDate?: string;
    comments: StipComment[];
    createdAt: string;
}

export interface StipComment {
    id: string;
    author: string;
    text: string;
    date: string;
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

// ============================================
// SBA 504 LOAN CONSTANTS & HELPERS
// ============================================

// Loan Status Display Labels
export const LOAN_STATUS_LABELS: Record<LoanStatus, string> = {
    'prospect': 'Prospect',
    'application': 'Application',
    'processing': 'Processing',
    'committee_review': 'Committee Review',
    'president_approval': 'President Approval',
    'board_ratify': 'Board Ratify',
    'sba_submitted': 'SBA Submitted',
    'sba_authorized': 'SBA Authorized',
    'closing': 'Closing',
    'funded': 'Funded',
    'servicing': 'Servicing',
    'paid_off': 'Paid Off',
    'cancelled': 'Cancelled',
    'charged_off': 'Charged Off',
    'liquidated': 'Liquidated'
};

// Loan Status Colors for UI
export const LOAN_STATUS_COLORS: Record<LoanStatus, string> = {
    'prospect': '#9CA3AF',       // Gray
    'application': '#3B82F6',    // Blue
    'processing': '#8B5CF6',     // Purple
    'committee_review': '#F59E0B', // Amber
    'president_approval': '#F59E0B',
    'board_ratify': '#F59E0B',
    'sba_submitted': '#06B6D4',  // Cyan
    'sba_authorized': '#10B981', // Green
    'closing': '#22C55E',        // Light Green
    'funded': '#059669',         // Emerald
    'servicing': '#0EA5E9',      // Sky
    'paid_off': '#14532D',       // Dark Green
    'cancelled': '#EF4444',      // Red
    'charged_off': '#DC2626',    // Dark Red
    'liquidated': '#991B1B'      // Very Dark Red
};

// Risk Level Labels
export const LOAN_RISK_LABELS: Record<LoanRiskLevel, string> = {
    'low': 'Low Risk',
    'medium': 'Medium Risk',
    'high': 'High Risk',
    'very_high': 'Very High Risk'
};

// Risk Level Colors
export const LOAN_RISK_COLORS: Record<LoanRiskLevel, string> = {
    'low': '#10B981',      // Green
    'medium': '#F59E0B',   // Amber
    'high': '#EF4444',     // Red
    'very_high': '#7F1D1D' // Dark Red
};

// Common Rate Indexes
export const RATE_INDEXES = [
    'Prime',
    'Prime + 0.5',
    'Prime + 1.0',
    'Prime + 1.5',
    'Prime + 2.0',
    'SOFR',
    'SOFR + 2.50',
    'SOFR + 3.00',
    '5-Year Treasury',
    '10-Year Treasury',
    'Fixed'
] as const;

// US States for dropdowns
export const US_STATES = [
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' },
    { code: 'DC', name: 'District of Columbia' }
] as const;

// Helper function to calculate borrower down payment
export function calculateBorrowerDown(totalProject: number, thirdParty1st: number, netDebenture: number): number {
    return Math.max(0, totalProject - thirdParty1st - netDebenture);
}

// Helper function to calculate gross debenture
export function calculateGrossDebenture(netDebenture: number, originationFee: number, servicingFee: number): number {
    return netDebenture + originationFee + servicingFee;
}

// Helper function to calculate SBA 1/2 point fee
export function calculateSbaHalfPoint(netDebenture: number): number {
    return netDebenture * 0.005;
}

// Helper function to get jobs per million (SBA metric)
export function calculateJobsPerMillion(totalProject: number, jobsCreated: number, jobsRetained: number): number {
    const totalJobs = jobsCreated + jobsRetained;
    const projectInMillions = totalProject / 1000000;
    return projectInMillions > 0 ? totalJobs / projectInMillions : 0;
}
