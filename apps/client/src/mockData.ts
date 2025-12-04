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
        id: '1',
        firstName: 'Sarah',
        lastName: 'Connor',
        email: 'sarah@cyberdyne.net',
        company: 'Cyberdyne Systems',
        businessName: 'Cyberdyne Systems, Inc.',
        stage: 'New',
        loanProgram: '504',
        dealStage: 'Prospecting',

        // Business Details
        stateOfInc: 'CA',
        industry: 'Robotics Manufacturing',
        naicsCode: '334513',
        yearsInBusiness: 12,
        annualRevenue: 12000000,
        netIncome: 1500000,

        // Deal
        loanAmount: 4500000,
        projectCost: 11000000,
        propertyType: 'Industrial',
        projectTypes: ['Purchase', 'Expansion'],
        useOfFunds: ['Building', 'Equipment'],

        // Referral
        referralSource: 'Banker',
        bankerId: 'b1', // David Chen
        existingBank: 'Chase Bank',

        // Tasks
        lastContact: {
            date: '2024-12-01',
            method: 'Call',
            outcome: 'Left voicemail'
        },
        nextTask: {
            date: '2024-12-05',
            action: 'Follow up on voicemail'
        },
        lastContactDate: '2024-12-01', // Legacy
        nextAction: 'Follow up on voicemail', // Legacy

        notes: []
    },
    {
        id: '2',
        firstName: 'James',
        lastName: 'Holden',
        email: 'jholden@tycho.com',
        company: 'Tycho Manufacturing',
        businessName: 'Tycho Station LLC',
        stage: 'Contacted',
        loanProgram: '7a',
        dealStage: 'Prequal',

        stateOfInc: 'NV',
        industry: 'Aerospace Parts',
        yearsInBusiness: 5,
        annualRevenue: 3500000,
        netIncome: 420000,

        loanAmount: 1200000,
        projectTypes: ['Expansion'],
        useOfFunds: ['Equipment', 'Working Capital'],

        referralSource: 'Broker',
        existingBank: 'Credit Union',

        lastContact: {
            date: '2024-12-02',
            method: 'Meeting',
            outcome: 'Discussed eligibility'
        },
        nextTask: {
            date: '2024-12-06',
            action: 'Collect Tax Returns'
        },
        lastContactDate: '2024-12-02',
        nextAction: 'Collect Tax Returns',

        notes: [
            {
                id: 'n1',
                content: 'Spoke with James. He is looking to expand his production line.',
                timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
                author: 'You',
                type: 'UserNote'
            }
        ]
    },
    {
        id: '3',
        firstName: 'Ellen',
        lastName: 'Ripley',
        email: 'ripley@weyland.corp',
        company: 'Nostromo Logistics',
        businessName: 'Nostromo Transport Services',
        stage: 'In Process',
        loanProgram: '504',
        dealStage: 'Underwriting',

        stateOfInc: 'CA',
        industry: 'Logistics',
        yearsInBusiness: 15,
        annualRevenue: 8500000,
        netIncome: 950000,

        loanAmount: 3200000,
        projectCost: 8000000,
        propertyType: 'Warehouse',
        projectTypes: ['Refinance'],
        useOfFunds: ['Debt Refi', 'Working Capital'],

        referralSource: 'Banker',
        bankerId: 'b2', // Sarah Miller
        existingBank: 'Wells Fargo',

        lastContact: {
            date: '2024-11-28',
            method: 'Email',
            outcome: 'Requested appraisal docs'
        },
        nextTask: {
            date: '2024-12-08',
            action: 'Review Appraisal'
        },
        lastContactDate: '2024-11-28',
        nextAction: 'Review Appraisal',

        notes: [
            {
                id: 'n2',
                content: 'Appraisal ordered. Expecting report by Friday.',
                timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
                author: 'System',
                type: 'SystemEvent'
            }
        ]
    },
    {
        id: '4',
        firstName: 'Tony',
        lastName: 'Stark',
        email: 'tony@stark.ind',
        company: 'Stark Industries',
        businessName: 'Stark Industries Global',
        stage: 'Warm',
        loanProgram: '7a',
        dealStage: 'App',

        stateOfInc: 'NY',
        industry: 'Defense Technology',
        yearsInBusiness: 20,
        annualRevenue: 50000000,
        netIncome: 12000000,

        loanAmount: 5000000,
        projectTypes: ['Expansion', 'Construction'],
        useOfFunds: ['Building', 'R&D'],

        referralSource: 'Direct',
        existingBank: 'Chase',

        lastContact: {
            date: '2024-12-03',
            method: 'Call',
            outcome: 'Confirmed site visit'
        },
        nextTask: {
            date: '2024-12-10',
            action: 'Site Visit'
        },
        lastContactDate: '2024-12-03',
        nextAction: 'Site Visit',

        notes: []
    },
    {
        id: '5',
        firstName: 'Walter',
        lastName: 'White',
        email: 'heisenberg@abq.com',
        company: 'A1 Car Wash',
        businessName: 'White Holdings LLC',
        stage: 'Not a Fit',
        loanProgram: 'Micro',
        dealStage: 'Prospecting',

        stateOfInc: 'NM',
        industry: 'Car Wash',
        yearsInBusiness: 2,
        annualRevenue: 800000,
        netIncome: 600000,

        loanAmount: 50000,
        projectTypes: ['Renovation'],
        useOfFunds: ['Other'],

        referralSource: 'Other',

        lastContact: {
            date: '2024-12-03',
            method: 'Email',
            outcome: 'Sent rejection'
        },
        nextTask: {
            date: '2024-12-03',
            action: 'Archive'
        },
        lastContactDate: '2024-12-03',
        nextAction: 'Archive',

        notes: [
            {
                id: 'n3',
                content: 'Cash heavy business. Compliance concerns.',
                timestamp: new Date(Date.now() - 86400000).toISOString(),
                author: 'Compliance',
                type: 'SystemEvent'
            }
        ]
    }
];
