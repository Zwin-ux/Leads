import type { Lead } from "@leads/shared";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const SENDNOW_URL = 'https://sendnow.gatewayportal.com/ampac/Send_Now_Documents/r1';

export const openaiService = {
    isConfigured(): boolean {
        return !!OPENAI_API_KEY;
    },

    async generateEmail(lead: Lead): Promise<string> {
        if (!OPENAI_API_KEY) {
            return this.getLocalEmailTemplate(lead);
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
                            content: `You are a professional business development officer at AmPac Business Capital, specializing in SBA loans (504 and 7a programs). Write warm, professional intro emails that are concise and personalized. Always end with the SendNow document upload link: ${SENDNOW_URL}`
                        },
                        {
                            role: 'user',
                            content: `Write a brief, professional intro email to ${lead.firstName} ${lead.lastName} from ${lead.company || 'their business'}. 
                            
Details:
- Program interest: ${lead.loanProgram || 'SBA loans'}
- Industry: ${lead.industry || 'business services'}
- Location: ${lead.city || ''}, ${lead.stateOfInc || 'CA'}

Keep it under 150 words. Be warm but professional. Include the document upload link at the end.`
                        }
                    ],
                    max_tokens: 500,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                console.warn('OpenAI API error, using local template');
                return this.getLocalEmailTemplate(lead);
            }

            const data = await response.json();
            return data.choices[0]?.message?.content || this.getLocalEmailTemplate(lead);
        } catch (e) {
            console.warn('OpenAI unavailable, using local template:', e);
            return this.getLocalEmailTemplate(lead);
        }
    },

    async searchBusinesses(query: string, location: string): Promise<Partial<Lead>[]> {
        if (!OPENAI_API_KEY) {
            return this.getMockBusinesses(query, location);
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
                            content: `You are a business data assistant. Generate realistic business leads for SBA loan prospecting. Return a JSON array of 5 businesses with these fields: company, firstName, lastName, email, phone, industry, city, stateOfInc. Make the data realistic for the specified location and business type. Use realistic names and professional email domains.`
                        },
                        {
                            role: 'user',
                            content: `Find 5 ${query} businesses in ${location}. Return ONLY valid JSON array, no markdown.`
                        }
                    ],
                    max_tokens: 1000,
                    temperature: 0.8
                })
            });

            if (!response.ok) {
                return this.getMockBusinesses(query, location);
            }

            const data = await response.json();
            const content = data.choices[0]?.message?.content || '[]';

            try {
                // Parse the JSON response
                const businesses = JSON.parse(content.replace(/```json\n?|\n?```/g, ''));
                return businesses.map((b: any) => ({
                    ...b,
                    id: crypto.randomUUID(),
                    stage: 'New' as const,
                    loanProgram: 'Unknown' as const,
                    lastContactDate: 'Never'
                }));
            } catch {
                return this.getMockBusinesses(query, location);
            }
        } catch (e) {
            console.warn('OpenAI search failed:', e);
            return this.getMockBusinesses(query, location);
        }
    },

    getLocalEmailTemplate(lead: Lead): string {
        const program = lead.loanProgram || 'SBA 504';
        const firstName = lead.firstName || 'there';
        const company = lead.company || 'your business';

        return `Hi ${firstName},

I hope this message finds you well! I came across ${company} and was impressed by what you've built.

I'm reaching out from AmPac Business Capital — we specialize in ${program} loans and help business owners like yourself access capital for growth, real estate, and equipment.

Would you be open to a brief call this week to explore if this might be a fit for your goals?

Looking forward to connecting.

Best regards,
[Your Name]
AmPac Business Capital

P.S. If you have any documents ready, you can securely upload them here:
${SENDNOW_URL}`;
    },

    getMockBusinesses(query: string, location: string): Partial<Lead>[] {
        // Fallback mock data when OpenAI is unavailable
        const industries = query.toLowerCase();
        const city = location.split(',')[0]?.trim() || 'Riverside';
        const state = location.split(',')[1]?.trim() || 'CA';

        return [
            {
                id: crypto.randomUUID(),
                company: `${city} ${query.split(' ')[0]} Works`,
                firstName: 'Michael',
                lastName: 'Johnson',
                email: `info@${city.toLowerCase()}works.com`,
                phone: '(951) 555-0101',
                industry: industries,
                city,
                stateOfInc: state,
                stage: 'New' as const,
                loanProgram: 'Unknown' as const,
                lastContactDate: 'Never'
            },
            {
                id: crypto.randomUUID(),
                company: `Pacific ${query.split(' ')[0]} Solutions`,
                firstName: 'Sarah',
                lastName: 'Martinez',
                email: 'contact@pacificsolutions.com',
                phone: '(951) 555-0102',
                industry: industries,
                city,
                stateOfInc: state,
                stage: 'New' as const,
                loanProgram: 'Unknown' as const,
                lastContactDate: 'Never'
            },
            {
                id: crypto.randomUUID(),
                company: `Valley ${query.split(' ')[0]} Inc`,
                firstName: 'David',
                lastName: 'Chen',
                email: 'david@valleyinc.com',
                phone: '(951) 555-0103',
                industry: industries,
                city,
                stateOfInc: state,
                stage: 'New' as const,
                loanProgram: 'Unknown' as const,
                lastContactDate: 'Never'
            }
        ];
    }
};
