import type { Lead } from '@leads/shared';

export const mockLeads: Lead[] = [
    {
        id: '1',
        firstName: 'Sarah',
        lastName: 'Connor',
        email: 'sarah@cyberdyne.net',
        company: 'Cyberdyne Systems',
        stage: 'New',
        loanProgram: '504',
        dealStage: 'Prospecting',
        annualRevenue: 12000000,
        netIncome: 1500000,
        loanAmount: 4500000,
        projectCost: 11000000,
        propertyType: 'Industrial',
        nextAction: 'Initial Outreach',
        notes: []
    },
    {
        id: '2',
        firstName: 'James',
        lastName: 'Holden',
        email: 'jholden@tycho.com',
        company: 'Tycho Manufacturing',
        stage: 'Contacted',
        loanProgram: '7a',
        dealStage: 'Prequal',
        annualRevenue: 3500000,
        netIncome: 420000,
        loanAmount: 1200000,
        useOfFunds: 'Equipment Purchase & Working Capital',
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
        stage: 'In Process',
        loanProgram: '504',
        dealStage: 'Underwriting',
        annualRevenue: 8500000,
        netIncome: 950000,
        loanAmount: 3200000,
        projectCost: 8000000,
        propertyType: 'Warehouse',
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
        stage: 'Warm',
        loanProgram: '7a',
        dealStage: 'App',
        annualRevenue: 50000000,
        netIncome: 12000000,
        loanAmount: 5000000,
        useOfFunds: 'R&D Expansion',
        nextAction: 'Schedule Site Visit',
        notes: []
    },
    {
        id: '5',
        firstName: 'Walter',
        lastName: 'White',
        email: 'heisenberg@abq.com',
        company: 'A1 Car Wash',
        stage: 'Not a Fit',
        loanProgram: 'Micro',
        dealStage: 'Prospecting',
        annualRevenue: 800000,
        netIncome: 600000,
        loanAmount: 50000,
        useOfFunds: 'Renovation',
        nextAction: 'Send Rejection Letter',
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
