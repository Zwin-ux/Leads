import type { Lead } from '@leads/shared';

export interface EmailThread {
    id: string;
    subject: string;
    from: string;
    to: string[];
    date: string;
    preview: string;
    hasAttachments: boolean;
}

// Simulated delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const graphService = {
    // Simulate fetching emails from M365 Graph API
    getEmailsForLead: async (lead: Lead): Promise<EmailThread[]> => {
        await delay(800); // Network latency simulation

        // Generate realistic mock emails based on lead stage
        const emails: EmailThread[] = [
            {
                id: 'msg_1',
                subject: `Re: SBA 504 Loan Options for ${lead.company || 'your business'}`,
                from: lead.email,
                to: ['me@ampac.com'],
                date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
                preview: "Thanks for the info. I'm interested in the 25-year fixed rate. What are the next steps to apply?",
                hasAttachments: false
            },
            {
                id: 'msg_2',
                subject: `Intro: ${lead.firstName} ${lead.lastName} <> AmPac Business Capital`,
                from: 'me@ampac.com',
                to: [lead.email],
                date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
                preview: `Hi ${lead.firstName}, pleasure meeting you. As discussed, here is the breakdown of the SBA 504 program...`,
                hasAttachments: true
            }
        ];

        // Add more if in later stages
        if (['Underwriting', 'Closing', 'Funded'].includes(lead.dealStage || '')) {
            emails.unshift({
                id: 'msg_3',
                subject: 'Documents Received - Application 504-2024-X',
                from: 'processing@ampac.com',
                to: [lead.email, 'me@ampac.com'],
                date: new Date().toISOString(),
                preview: "We have received your tax returns and financial statements. Our underwriting team is reviewing them now.",
                hasAttachments: false
            });
        }

        return emails;
    },

    // Simulate sending an email via Graph API
    sendEmail: async (to: string, subject: string, body: string): Promise<boolean> => {
        await delay(1200);
        console.log(`[GraphAPI] Sent email to ${to}: ${subject}`);
        return true;
    }
};
