export interface Integration {
    id: string;
    name: string;
    category: 'Lending' | 'CRM' | 'Data' | ' Infrastructure';
    description: string;
    status: 'connected' | 'disconnected' | 'pending';
    iconColor: string;
    connectedAt?: string;
    config?: Record<string, string>;
}

const DEFAULT_INTEGRATIONS: Integration[] = [
    // Lending Partners
    { id: 'sba', name: 'SBA', category: 'Lending', description: 'Small Business Administration eligibility and forms.', status: 'connected', iconColor: '#002e6d' },
    { id: 'lenders-coop', name: 'Lenders Cooperative', category: 'Lending', description: 'Loan sharing and participation network.', status: 'disconnected', iconColor: '#2563eb' },
    { id: 'meridian', name: 'Meridian', category: 'Lending', description: 'Commercial lending platform connection.', status: 'disconnected', iconColor: '#0f172a' },
    { id: 'credit-builders', name: 'Credit Builders', category: 'Lending', description: 'Credit building and reporting services.', status: 'disconnected', iconColor: '#16a34a' },
    { id: 'quiktrak', name: 'Quiktrak', category: 'Lending', description: 'Asset verification and audit services.', status: 'disconnected', iconColor: '#ea580c' },
    { id: 'laserpro', name: 'LaserPro', category: 'Lending', description: 'Compliant loan documentation generation.', status: 'connected', iconColor: '#dc2626' },
    { id: 'rma', name: 'RMA', category: 'Lending', description: 'Risk Management Association data.', status: 'disconnected', iconColor: '#4f46e5' },
    { id: 'bcr', name: 'BCR', category: 'Lending', description: 'Business Credit Reports integration.', status: 'disconnected', iconColor: '#0891b2' },

    // CRM & Communication
    { id: 'salesforce', name: 'Salesforce', category: 'CRM', description: 'Sync leads and opportunities bi-directionally.', status: 'connected', iconColor: '#00a1e0' },
    { id: 'hubspot', name: 'Hubspot', category: 'CRM', description: 'Marketing automation and CRM sync.', status: 'disconnected', iconColor: '#ff7a59' },
    { id: 'office', name: 'Office 365', category: 'CRM', description: 'Email and calendar integration.', status: 'connected', iconColor: '#d83b01' },
    { id: 'sendgrid', name: 'Sendgrid', category: 'CRM', description: 'Transactional email delivery service.', status: 'connected', iconColor: '#1a82e2' },
    { id: 'twilio', name: 'Twilio', category: 'CRM', description: 'SMS and voice communication API.', status: 'disconnected', iconColor: '#f22f46' },

    // Data & Tools
    { id: 'google-maps', name: 'Google Maps', category: 'Data', description: 'Location services and address verification.', status: 'connected', iconColor: '#4285f4' },
    { id: 'flashspread', name: 'FlashSpread', category: 'Data', description: 'Automated tax return spreading.', status: 'connected', iconColor: '#8b5cf6' },
    { id: 'tax-guard', name: 'Tax Guard', category: 'Data', description: 'IRS tax transcript verification.', status: 'disconnected', iconColor: '#059669' },
    { id: 'veri-tax', name: 'Veri Tax', category: 'Data', description: 'Income verification services.', status: 'disconnected', iconColor: '#6366f1' },
    { id: 'private-eyes', name: 'Private Eyes Image', category: 'Data', description: 'Background checks and imaging services.', status: 'disconnected', iconColor: '#be185d' },

    // Infrastructure
    { id: 'mssql', name: 'Microsoft SQL', category: ' Infrastructure', description: 'Direct database connectivity.', status: 'connected', iconColor: '#a91d22' },
    { id: 'azure', name: 'Azure', category: ' Infrastructure', description: 'Cloud infrastructure and identity services.', status: 'connected', iconColor: '#0078d4' },
];

class IntegrationService {
    private integrations: Integration[] = [];

    constructor() {
        this.loadIntegrations();
    }

    private loadIntegrations() {
        try {
            const stored = localStorage.getItem('leads_integrations_v1');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    this.integrations = parsed;
                } else {
                    this.integrations = DEFAULT_INTEGRATIONS;
                }
            } else {
                this.integrations = DEFAULT_INTEGRATIONS;
            }
        } catch (err) {
            console.error('Failed to load integrations', err);
            this.integrations = DEFAULT_INTEGRATIONS;
        }
    }

    private save() {
        localStorage.setItem('leads_integrations_v1', JSON.stringify(this.integrations));
    }

    getAll(): Integration[] {
        return this.integrations;
    }

    async connect(id: string, config: Record<string, string>): Promise<Integration> {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));

        const index = this.integrations.findIndex(i => i.id === id);
        if (index === -1) throw new Error("Integration not found");

        const updated = {
            ...this.integrations[index],
            status: 'connected' as const,
            connectedAt: new Date().toISOString(),
            config
        };

        this.integrations[index] = updated;
        this.save();
        return updated;
    }

    async disconnect(id: string): Promise<Integration> {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        const index = this.integrations.findIndex(i => i.id === id);
        if (index === -1) throw new Error("Integration not found");

        const updated = {
            ...this.integrations[index],
            status: 'disconnected' as const,
            connectedAt: undefined,
            config: undefined
        };

        this.integrations[index] = updated;
        this.save();
        return updated;
    }
}

export const integrationService = new IntegrationService();
