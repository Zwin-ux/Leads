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
        id: 'l1',
        company: 'Acme Manufacturing',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@acme.com',
        phone: '555-0101',
        stage: 'New',
        dealStage: undefined,
        loanAmount: 1500000,
        loanProgram: '504',
        lastContactDate: new Date().toISOString(),
        owner: 'Mazen Zwin',
        notes: []
    },
    {
        id: 'l2',
        company: 'TechStart Inc',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@techstart.com',
        phone: '555-0102',
        stage: 'Qualified',
        dealStage: 'Processing',
        loanAmount: 750000,
        loanProgram: '7a',
        lastContactDate: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
        owner: 'Mazen Zwin',
        notes: []
    },
    {
        id: 'l3',
        company: 'Green Earth Landscaping',
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike@greenearth.com',
        phone: '555-0103',
        stage: 'In Process',
        dealStage: 'Underwriting',
        loanAmount: 3200000,
        loanProgram: '504',
        lastContactDate: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
        owner: 'Mazen Zwin',
        notes: []
    },
    {
        id: 'l4',
        company: 'City Bistro',
        firstName: 'Sarah',
        lastName: 'Connor',
        email: 'sarah@bistro.com',
        phone: '555-0104',
        stage: 'Proposal',
        dealStage: 'Approved',
        loanAmount: 500000,
        loanProgram: '7a',
        lastContactDate: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
        owner: 'Mazen Zwin',
        notes: []
    },
    {
        id: 'l5',
        company: 'Global Logistics',
        firstName: 'Robert',
        lastName: 'Chen',
        email: 'robert@global.com',
        phone: '555-0105',
        stage: 'Negotiation',
        dealStage: 'Closing',
        loanAmount: 2100000,
        loanProgram: '504',
        lastContactDate: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
        owner: 'Mazen Zwin',
        notes: []
    },
    {
        id: 'l6',
        company: 'Stale Lead Corp',
        firstName: 'Gary',
        lastName: 'Oldman',
        email: 'gary@stale.com',
        phone: '555-0106',
        stage: 'New',
        dealStage: undefined,
        loanAmount: 100000,
        loanProgram: '7a',
        lastContactDate: new Date(Date.now() - 86400000 * 15).toISOString(), // 15 days ago
        owner: 'Mazen Zwin',
        notes: []
    }
];

export const mockSalesTeam: any[] = [
    {
        id: 'sp1',
        name: 'Ed Ryan',
        title: 'SVP, Business Development',
        phone: '909-258-4585',
        email: 'ed.ryan@ampac.com',
        products: ['504', '7a']
    },
    {
        id: 'sp2',
        name: 'Mazen Zwin',
        title: 'Vice President',
        phone: '909-555-0102',
        email: 'mazen@ampac.com',
        products: ['504', 'Micro']
    },
    {
        id: 'sp3',
        name: 'Sarah Jenkins',
        title: 'Business Development Officer',
        phone: '909-555-0103',
        email: 'sarah.j@ampac.com',
        products: ['7a', 'Community Advantage']
    }
];
