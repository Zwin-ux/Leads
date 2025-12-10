import type { Lead } from '@leads/shared';
import { authService } from './authService';

export interface EmailThread {
    id: string;
    subject: string;
    from: string;
    to: string[];
    date: string;
    preview: string;
    hasAttachments: boolean;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Graph Service - Client-side wrapper for Microsoft Graph API calls
 * All calls go through the backend /processLead endpoint with executeGraphTool action
 */
export const graphService = {
    /**
     * Execute a Graph API tool via the backend
     */
    async executeGraphTool(toolName: string, args: any): Promise<any> {
        const accessToken = await authService.getAccessToken([
            'Mail.Read', 'Mail.Send', 'Calendars.ReadWrite'
        ]);

        if (!accessToken) {
            throw new Error('Could not acquire access token. Please sign in.');
        }

        const response = await fetch(`${API_BASE}/processLead`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lead: { id: 'graph-service-call' },
                action: 'executeGraphTool',
                accessToken,
                toolName,
                args
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || 'Graph API call failed');
        }

        const result = await response.json();
        return result.toolResult;
    },

    /**
     * Fetch emails related to a lead
     */
    async getEmailsForLead(lead: Lead): Promise<EmailThread[]> {
        try {
            // Try to get real emails via Graph API
            const filter = lead.email
                ? `from/emailAddress/address eq '${lead.email}' or toRecipients/any(r:r/emailAddress/address eq '${lead.email}')`
                : undefined;

            const emails = await this.executeGraphTool('list_emails', { filter });

            return (emails || []).map((msg: any) => ({
                id: msg.id,
                subject: msg.subject,
                from: msg.from?.emailAddress?.address || 'unknown',
                to: msg.toRecipients?.map((r: any) => r.emailAddress?.address) || [],
                date: msg.receivedDateTime,
                preview: msg.bodyPreview || '',
                hasAttachments: msg.hasAttachments || false
            }));
        } catch (error) {
            console.warn('Failed to fetch real emails, returning demo data:', error);
            // Fallback to demo data if Graph API fails
            return this.getDemoEmails(lead);
        }
    },

    /**
     * Send an email via Graph API
     */
    async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
        try {
            await this.executeGraphTool('send_email', { to, subject, body });
            return true;
        } catch (error) {
            console.error('Failed to send email:', error);
            throw error;
        }
    },

    /**
     * List calendar events
     */
    async listEvents(startDate: string, endDate: string): Promise<any[]> {
        return await this.executeGraphTool('list_events', { start: startDate, end: endDate });
    },

    /**
     * Create a calendar event with optional Teams meeting
     */
    async createEvent(options: {
        subject: string;
        start: string;
        end: string;
        attendees?: string[];
        location?: string;
        body?: string;
        isOnlineMeeting?: boolean;
    }): Promise<any> {
        return await this.executeGraphTool('create_event', options);
    },

    /**
     * Find available meeting times for attendees
     */
    async findMeetingTimes(attendees: string[], duration: string = 'PT30M'): Promise<any> {
        return await this.executeGraphTool('find_meeting_times', { attendees, duration });
    },

    /**
     * Get demo emails when Graph API is unavailable
     */
    getDemoEmails(lead: Lead): EmailThread[] {
        const emails: EmailThread[] = [
            {
                id: 'demo_1',
                subject: `Re: SBA 504 Loan Options for ${lead.company || 'your business'}`,
                from: lead.email,
                to: ['me@ampac.com'],
                date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
                preview: "Thanks for the info. I'm interested in the 25-year fixed rate. What are the next steps to apply?",
                hasAttachments: false
            },
            {
                id: 'demo_2',
                subject: `Intro: ${lead.firstName} ${lead.lastName} <> AmPac Business Capital`,
                from: 'me@ampac.com',
                to: [lead.email],
                date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
                preview: `Hi ${lead.firstName}, pleasure meeting you. As discussed, here is the breakdown of the SBA 504 program...`,
                hasAttachments: true
            }
        ];

        if (['Underwriting', 'Closing', 'Funded'].includes(lead.dealStage || '')) {
            emails.unshift({
                id: 'demo_3',
                subject: 'Documents Received - Application 504-2024-X',
                from: 'processing@ampac.com',
                to: [lead.email, 'me@ampac.com'],
                date: new Date().toISOString(),
                preview: "We have received your tax returns and financial statements. Our underwriting team is reviewing them now.",
                hasAttachments: false
            });
        }

        return emails;
    }
};
