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

export const mockLeads: Lead[] = [];
