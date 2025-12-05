import type { Lead } from "@leads/shared";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const SENDNOW_URL = 'https://sendnow.gatewayportal.com/ampac/Send_Now_Documents/r1';

// Email template types
export type EmailTemplateType = 'intro' | 'followup' | 'referral' | 'banker' | 'documents' | 'update' | 'winback';

// Enhanced business result with richer data
export interface BusinessResult {
    id: string;
    company: string;
    legalName?: string;
    dba?: string;
    firstName: string;
    lastName: string;
    role?: string;
    email: string;
    phone?: string;
    website?: string;
    industry?: string;
    naicsCode?: string;
    city?: string;
    stateOfInc?: string;
    employeeRange?: string;
    revenueRange?: string;
    yearsInBusiness?: number;
    sbaFit?: '504' | '7a' | 'Both' | 'Unknown';
    sbaFitReason?: string;
    source: 'AI' | 'Manual' | 'SOS' | 'Website';
    confidence: 'high' | 'medium' | 'low';
}

export const openaiService = {
    isConfigured(): boolean {
        return !!OPENAI_API_KEY;
    },

    // === ENHANCED EMAIL GENERATION WITH TEMPLATES ===
    async generateEmail(lead: Lead, templateType: EmailTemplateType = 'intro'): Promise<string> {
        if (!OPENAI_API_KEY) {
            return this.getLocalEmailTemplate(lead, templateType);
        }

        const templatePrompts: Record<EmailTemplateType, string> = {
            intro: `Write a brief, professional intro email introducing AmPac Business Capital and our SBA loan programs. Be warm but professional. Mention their specific business.`,

            followup: `Write a follow-up email referencing a previous conversation. Ask about their timeline and offer to answer questions. Be helpful, not pushy.`,

            referral: `Write an email to a referral partner (banker, CPA, attorney) thanking them for a referral and asking if they know of other businesses that might benefit from SBA financing.`,

            banker: `Write a professional email to a bank partner outlining a potential deal. Include business type, estimated loan amount range, and why this is a good fit for SBA programs.`,

            documents: `Write a document request email. Be specific about what's needed (tax returns, financial statements, etc.) and include the SendNow link for secure upload.`,

            update: `Write a deal status update email. Provide a brief progress summary, next steps, and expected timeline.`,

            winback: `Write a re-engagement email for a lead that's gone cold. Offer something new (rate changes, new programs, success stories) to restart the conversation.`
        };

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: `You are a professional business development officer at AmPac Business Capital, specializing in SBA loans (504 and 7a programs). Write warm, professional emails that are concise and personalized. 

For document requests, always include the SendNow link: ${SENDNOW_URL}

Context about the lead:
- Name: ${lead.firstName} ${lead.lastName}
- Company: ${lead.company || 'Unknown'}
- Program: ${lead.loanProgram || 'SBA'}
- Industry: ${lead.industry || 'Business'}
- Location: ${lead.city || ''}, ${lead.stateOfInc || 'CA'}`
                        },
                        {
                            role: 'user',
                            content: templatePrompts[templateType] + '\n\nKeep it under 150 words. Sign off with [Your Name], AmPac Business Capital.'
                        }
                    ],
                    max_tokens: 500,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                return this.getLocalEmailTemplate(lead, templateType);
            }

            const data = await response.json();
            return data.choices[0]?.message?.content || this.getLocalEmailTemplate(lead, templateType);
        } catch (e) {
            console.warn('OpenAI unavailable, using local template:', e);
            return this.getLocalEmailTemplate(lead, templateType);
        }
    },

    // === ENHANCED BUSINESS SEARCH ===
    // Returns { results, isDemoMode } to be transparent about data source
    async searchBusinesses(query: string, location: string): Promise<{ results: BusinessResult[], isDemoMode: boolean, error?: string }> {
        // If no API key, be explicit about demo mode with realistic delay
        if (!OPENAI_API_KEY) {
            await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));
            return {
                results: this.getMockBusinesses(query, location),
                isDemoMode: true
            };
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: `You are a business intelligence assistant for SBA loan prospecting. Generate realistic business leads with rich data.

Return a JSON array of 8 businesses. Each must have:
- company: Business name
- legalName: Full legal entity name (e.g., "Pacific Machine Works LLC")
- firstName, lastName: Owner/decision maker name
- role: Their title (Owner, CEO, CFO, etc.)
- email: Professional email
- phone: Phone number
- website: Company website
- industry: Industry description
- naicsCode: 6-digit NAICS code
- city, stateOfInc: Location
- employeeRange: "1-10", "11-50", "51-200", "201-500", or "500+"
- revenueRange: "<500K", "500K-1M", "1M-5M", "5M-20M", or "20M+"
- yearsInBusiness: Number
- sbaFit: "504" (real estate/equipment), "7a" (working capital), "Both", or "Unknown"
- sbaFitReason: Brief reason for the fit recommendation

Make data realistic for the specified location. Use realistic company names and professional emails.`
                        },
                        {
                            role: 'user',
                            content: `Find 8 "${query}" businesses in ${location}. Return ONLY valid JSON array, no markdown or explanation.`
                        }
                    ],
                    max_tokens: 2000,
                    temperature: 0.8
                })
            });

            if (!response.ok) {
                console.error('OpenAI API error:', response.status);
                return {
                    results: [],
                    isDemoMode: false,
                    error: `API error (${response.status}). Check your API key.`
                };
            }

            const data = await response.json();
            const content = data.choices[0]?.message?.content || '[]';

            try {
                const businesses = JSON.parse(content.replace(/```json\n?|\n?```/g, ''));
                return {
                    results: businesses.map((b: any) => ({
                        ...b,
                        id: crypto.randomUUID(),
                        source: 'AI' as const,
                        confidence: 'medium' as const
                    })),
                    isDemoMode: false
                };
            } catch {
                console.error('Failed to parse OpenAI response');
                return {
                    results: [],
                    isDemoMode: false,
                    error: 'Failed to parse results. Try again.'
                };
            }
        } catch (e) {
            console.error('OpenAI search failed:', e);
            return {
                results: [],
                isDemoMode: false,
                error: 'Network error. Check connection.'
            };
        }
    },

    // === LOCAL EMAIL TEMPLATES ===
    getLocalEmailTemplate(lead: Lead, templateType: EmailTemplateType = 'intro'): string {
        const firstName = lead.firstName || 'there';
        const company = lead.company || 'your business';
        const program = lead.loanProgram || 'SBA';

        const templates: Record<EmailTemplateType, string> = {
            intro: `Hi ${firstName},

I hope this message finds you well! I came across ${company} and was impressed by what you've built.

I'm reaching out from AmPac Business Capital — we specialize in ${program} loans and help business owners like yourself access capital for growth, real estate, and equipment.

Would you be open to a brief call this week to explore if this might be a fit for your goals?

Looking forward to connecting.

Best regards,
[Your Name]
AmPac Business Capital

P.S. If you have any documents ready, you can securely upload them here:
${SENDNOW_URL}`,

            followup: `Hi ${firstName},

I wanted to follow up on our previous conversation about financing options for ${company}.

Have you had a chance to consider our discussion? I'm happy to answer any questions or provide additional information about how SBA loans might support your goals.

Let me know if you'd like to schedule a quick call this week.

Best regards,
[Your Name]
AmPac Business Capital`,

            referral: `Hi [Partner Name],

Thank you so much for referring ${company} to us — we really appreciate you thinking of AmPac Business Capital.

As you know, we specialize in SBA 504 and 7a loans, and we're always looking to help more business owners access the capital they need.

Do you have any other clients or contacts who might benefit from our programs? I'd be happy to provide you with some materials to share.

Thanks again for your continued partnership!

Best regards,
[Your Name]
AmPac Business Capital`,

            banker: `Hi [Banker Name],

I wanted to reach out about a potential SBA deal that might be a great fit for a partnership.

Business: ${company}
Industry: ${lead.industry || 'Various'}
Location: ${lead.city || ''}, ${lead.stateOfInc || 'CA'}
Estimated Loan: $[Amount Range]
Program: ${program}

This looks like a solid candidate for SBA financing. Would you be interested in discussing a participation?

Best regards,
[Your Name]
AmPac Business Capital`,

            documents: `Hi ${firstName},

Thank you for your interest in SBA financing for ${company}!

To move forward with your application, we'll need the following documents:

📄 Required Documents:
• Last 3 years of business tax returns
• Last 3 years of personal tax returns
• Year-to-date financial statements (P&L and Balance Sheet)
• Business debt schedule
• Personal financial statement

You can securely upload your documents here:
${SENDNOW_URL}

Please let me know if you have any questions!

Best regards,
[Your Name]
AmPac Business Capital`,

            update: `Hi ${firstName},

I wanted to give you a quick update on the status of your SBA loan application for ${company}.

Current Status: [Stage]
Next Steps: [Action Items]
Expected Timeline: [Timeline]

Please let me know if you have any questions or if there's anything else you need from our team.

Best regards,
[Your Name]
AmPac Business Capital`,

            winback: `Hi ${firstName},

It's been a while since we last connected about financing options for ${company}. I wanted to reach out because we've had some exciting updates:

✨ New lower rates on SBA 504 loans
✨ Streamlined application process
✨ Success stories from businesses just like yours

If your capital needs have evolved or if you're reconsidering expansion plans, I'd love to catch up and explore how we might help.

Would you have 15 minutes for a quick call this week?

Best regards,
[Your Name]
AmPac Business Capital`
        };

        return templates[templateType];
    },

    // === ENHANCED MOCK BUSINESSES ===
    getMockBusinesses(query: string, location: string): BusinessResult[] {
        const industry = query.toLowerCase();
        const city = location.split(',')[0]?.trim() || 'Riverside';
        const state = location.split(',')[1]?.trim() || 'CA';

        const is504Industry = ['manufacturing', 'machine', 'medical', 'dental', 'hotel', 'industrial'].some(k => industry.includes(k));
        const sbaFit = is504Industry ? '504' : '7a';

        return [
            {
                id: crypto.randomUUID(),
                company: `${city} ${query.split(' ')[0]} Works`,
                legalName: `${city} ${query.split(' ')[0]} Works LLC`,
                firstName: 'Michael',
                lastName: 'Johnson',
                role: 'Owner',
                email: `mjohnson@${city.toLowerCase().replace(/\s/g, '')}works.com`,
                phone: '(951) 555-0101',
                website: `https://${city.toLowerCase().replace(/\s/g, '')}works.com`,
                industry: query,
                naicsCode: '332710',
                city,
                stateOfInc: state,
                employeeRange: '11-50',
                revenueRange: '1M-5M',
                yearsInBusiness: 12,
                sbaFit: sbaFit as '504' | '7a',
                sbaFitReason: is504Industry ? 'Real estate/equipment intensive industry' : 'Working capital needs typical',
                source: 'AI',
                confidence: 'medium'
            },
            {
                id: crypto.randomUUID(),
                company: `Pacific ${query.split(' ')[0]} Solutions`,
                legalName: `Pacific ${query.split(' ')[0]} Solutions Inc`,
                firstName: 'Sarah',
                lastName: 'Martinez',
                role: 'CEO',
                email: 'smartinez@pacificsolutions.com',
                phone: '(951) 555-0102',
                website: 'https://pacificsolutions.com',
                industry: query,
                naicsCode: '332710',
                city,
                stateOfInc: state,
                employeeRange: '51-200',
                revenueRange: '5M-20M',
                yearsInBusiness: 18,
                sbaFit: '504',
                sbaFitReason: 'Established business, likely owns real estate',
                source: 'AI',
                confidence: 'medium'
            },
            {
                id: crypto.randomUUID(),
                company: `Valley ${query.split(' ')[0]} Inc`,
                legalName: `Valley ${query.split(' ')[0]} Inc`,
                firstName: 'David',
                lastName: 'Chen',
                role: 'President',
                email: 'dchen@valleyinc.com',
                phone: '(951) 555-0103',
                website: 'https://valleyinc.com',
                industry: query,
                naicsCode: '332710',
                city,
                stateOfInc: state,
                employeeRange: '11-50',
                revenueRange: '1M-5M',
                yearsInBusiness: 8,
                sbaFit: 'Both',
                sbaFitReason: 'Growth stage, may need equipment and working capital',
                source: 'AI',
                confidence: 'medium'
            },
            {
                id: crypto.randomUUID(),
                company: `Golden State ${query.split(' ')[0]}`,
                legalName: `Golden State ${query.split(' ')[0]} LLC`,
                firstName: 'Jennifer',
                lastName: 'Williams',
                role: 'Owner',
                email: 'jwilliams@goldenstate.com',
                phone: '(951) 555-0104',
                website: 'https://goldenstatemanufacturing.com',
                industry: query,
                naicsCode: '332710',
                city,
                stateOfInc: state,
                employeeRange: '1-10',
                revenueRange: '500K-1M',
                yearsInBusiness: 5,
                sbaFit: '7a',
                sbaFitReason: 'Smaller business, working capital likely priority',
                source: 'AI',
                confidence: 'medium'
            },
            {
                id: crypto.randomUUID(),
                company: `Precision ${query.split(' ')[0]} Co`,
                legalName: `Precision ${query.split(' ')[0]} Company`,
                firstName: 'Robert',
                lastName: 'Kim',
                role: 'CFO',
                email: 'rkim@precisionco.com',
                phone: '(951) 555-0105',
                website: 'https://precisionco.com',
                industry: query,
                naicsCode: '332710',
                city,
                stateOfInc: state,
                employeeRange: '51-200',
                revenueRange: '5M-20M',
                yearsInBusiness: 22,
                sbaFit: '504',
                sbaFitReason: 'Established, likely expansion candidate',
                source: 'AI',
                confidence: 'high'
            },
            {
                id: crypto.randomUUID(),
                company: `Inland Empire ${query.split(' ')[0]}`,
                legalName: `Inland Empire ${query.split(' ')[0]} LLC`,
                firstName: 'Maria',
                lastName: 'Garcia',
                role: 'Owner',
                email: 'mgarcia@ie-business.com',
                phone: '(951) 555-0106',
                website: 'https://ie-business.com',
                industry: query,
                naicsCode: '332710',
                city,
                stateOfInc: state,
                employeeRange: '11-50',
                revenueRange: '1M-5M',
                yearsInBusiness: 10,
                sbaFit: 'Both',
                sbaFitReason: 'Mid-size, multiple financing needs possible',
                source: 'AI',
                confidence: 'medium'
            },
            {
                id: crypto.randomUUID(),
                company: `SoCal ${query.split(' ')[0]} Group`,
                legalName: `SoCal ${query.split(' ')[0]} Group Inc`,
                firstName: 'James',
                lastName: 'Patel',
                role: 'Managing Partner',
                email: 'jpatel@socalgroup.com',
                phone: '(951) 555-0107',
                website: 'https://socalgroup.com',
                industry: query,
                naicsCode: '332710',
                city,
                stateOfInc: state,
                employeeRange: '201-500',
                revenueRange: '20M+',
                yearsInBusiness: 30,
                sbaFit: '504',
                sbaFitReason: 'Large established business, major expansion candidate',
                source: 'AI',
                confidence: 'high'
            },
            {
                id: crypto.randomUUID(),
                company: `West Coast ${query.split(' ')[0]}`,
                legalName: `West Coast ${query.split(' ')[0]} Corporation`,
                firstName: 'Lisa',
                lastName: 'Thompson',
                role: 'CEO',
                email: 'lthompson@westcoast.com',
                phone: '(951) 555-0108',
                website: 'https://westcoast.com',
                industry: query,
                naicsCode: '332710',
                city,
                stateOfInc: state,
                employeeRange: '11-50',
                revenueRange: '1M-5M',
                yearsInBusiness: 7,
                sbaFit: '7a',
                sbaFitReason: 'Growth stage, likely working capital needs',
                source: 'AI',
                confidence: 'medium'
            }
        ];
    }
};
