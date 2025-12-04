import type { Lead, Banker } from '@leads/shared';

export const mockBankers: Banker[] = [
    {
        id: 'b1',
        name: 'David Chen',
        bank: 'Chase Bank',
        branch: 'Downtown LA',
        title: 'SVP, Commercial Lending',
        phone: '213-555-0123',
        email: 'david.chen@chase.com',
        trustScore: 5,
        totalFunded: 12500000,
        lastDealDate: '2024-11-15',
        notes: 'Top performer. Loves quick updates. Send deal memos early.'
    },
    {
        id: 'b2',
        name: 'Sarah Miller',
        bank: 'Wells Fargo',
        branch: 'Santa Monica',
        title: 'Business Relationship Manager',
        phone: '310-555-0199',
        email: 'sarah.miller@wellsfargo.com',
        trustScore: 3,
        totalFunded: 2100000,
        lastDealDate: '2024-10-01',
        notes: 'New relationship. Needs hand-holding on 504 eligibility.'
    },
    {
        id: 'b3',
        name: 'Robert Fox',
        bank: 'Bank of America',
        branch: 'Irvine Spectrum',
        title: 'VP, Small Business',
        phone: '949-555-0144',
        email: 'robert.fox@bofa.com',
        trustScore: 4,
        totalFunded: 5600000,
        lastDealDate: '2024-11-20',
        notes: 'Steady source. Good credit quality usually.'
    }
];

export const mockLeads: Lead[] = [
    {
        id: '101',
        firstName: 'Michael',
        lastName: 'Ross',
        email: 'mross@precisionmfg.com',
        company: 'Precision Manufacturing',
        businessName: 'Precision Manufacturing Solutions LLC',
        stage: 'Warm',
        loanProgram: '504',
        dealStage: 'Prequal',

        // Business Details
        stateOfInc: 'CA',
        industry: 'CNC Machining',
        naicsCode: '332710',
        yearsInBusiness: 8,
        annualRevenue: 4500000,
        netIncome: 550000,

        // Deal
        loanAmount: 2200000,
        projectCost: 5000000,
        propertyType: 'Industrial',
        projectTypes: ['Purchase', 'Expansion'],
        useOfFunds: ['Building', 'Equipment'],

        // Referral
        referralSource: 'Banker',
        bankerId: 'b1', // David Chen
        existingBank: 'Chase Bank',

        // Tasks
        lastContact: {
            date: '2024-12-03',
            method: 'Meeting',
            outcome: 'Collected financials'
        },
        nextTask: {
            date: '2024-12-07',
            action: 'Spread Financials'
        },
        lastContactDate: '2024-12-03',
        nextAction: 'Spread Financials',

        notes: []
    },
    {
        id: '102',
        firstName: 'Elena',
        lastName: 'Vasquez',
        email: 'elena@greenlogistics.com',
        company: 'Green Logistics',
        businessName: 'Green Logistics & Transport Inc.',
        stage: 'In Process',
        loanProgram: '7a',
        dealStage: 'Underwriting',

        stateOfInc: 'AZ',
        industry: 'Freight Trucking',
        yearsInBusiness: 5,
        annualRevenue: 3200000,
        netIncome: 280000,

        loanAmount: 1500000,
        projectTypes: ['Refinance'],
        useOfFunds: ['Debt Refi', 'Working Capital'],

        referralSource: 'Broker',
        existingBank: 'Wells Fargo',

        lastContact: {
            date: '2024-12-01',
            method: 'Email',
            outcome: 'Requested tax returns'
        },
        nextTask: {
            date: '2024-12-05',
            action: 'Review Tax Returns'
        },
        lastContactDate: '2024-12-01',
        nextAction: 'Review Tax Returns',

        notes: []
    }
];
