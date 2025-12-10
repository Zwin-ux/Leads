
import axios from 'axios';
import { Lead } from '@leads/shared';

const TEAMS_WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL || 'https://defaultcf0a93381f994a5ab494afb40f401d.da.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/eb2ea8fbf4bc4cdf8bf3919235e9538d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=s0OqX3rvXHdY82eW3ijZLNPPqkJKedusR313QWFZ970';

export class TeamsService {

    async sendDealFundedNotification(lead: Lead) {
        if (!TEAMS_WEBHOOK_URL) {
            console.warn('⚠️ Teams Webhook URL not configured.');
            return;
        }

        const card = {
            "type": "message",
            "attachments": [
                {
                    "contentType": "application/vnd.microsoft.card.adaptive",
                    "contentUrl": null,
                    "content": {
                        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                        "type": "AdaptiveCard",
                        "version": "1.2",
                        "body": [
                            {
                                "type": "TextBlock",
                                "text": "Deal Notification: Funded",
                                "weight": "Bolder",
                                "size": "ExtraLarge",
                                "color": "Good",
                                "horizontalAlignment": "Center"
                            },
                            {
                                "type": "TextBlock",
                                "text": `${lead.company}`,
                                "weight": "Bolder",
                                "size": "Large",
                                "horizontalAlignment": "Center",
                                "spacing": "None"
                            },
                            {
                                "type": "FactSet",
                                "facts": [
                                    {
                                        "title": "Amount",
                                        "value": `$${(lead.loanAmount || 0).toLocaleString()}`
                                    },
                                    {
                                        "title": "Banker",
                                        "value": "AmPac Team" // Could use lead.owner
                                    },
                                    {
                                        "title": "Program",
                                        "value": "SBA 504"
                                    }
                                ]
                            }
                        ],
                        "actions": [
                            {
                                "type": "Action.OpenUrl",
                                "title": "View Deal",
                                "url": `https://ampacbrain.azurewebsites.net/?leadId=${lead.id}`
                            }
                        ]
                    }
                }
            ]
        };



        await this.postCard(card);
    }
    async sendNewLeadNotification(lead: Lead) {
        if (!TEAMS_WEBHOOK_URL) return;

        const card = {
            "type": "message",
            "attachments": [
                {
                    "contentType": "application/vnd.microsoft.card.adaptive",
                    "contentUrl": null,
                    "content": {
                        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                        "type": "AdaptiveCard",
                        "version": "1.2",
                        "body": [
                            {
                                "type": "TextBlock",
                                "text": "New Lead Opportunity",
                                "weight": "Bolder",
                                "size": "Large",
                                "color": "Accent"
                            },
                            {
                                "type": "TextBlock",
                                "text": `${lead.company}`,
                                "weight": "Bolder",
                                "size": "Medium"
                            },
                            {
                                "type": "FactSet",
                                "facts": [
                                    { "title": "Amount", "value": `$${(lead.loanAmount || 0).toLocaleString()}` },
                                    { "title": "Source", "value": "Web Form" }
                                ]
                            }
                        ],
                        "actions": [
                            {
                                "type": "Action.OpenUrl",
                                "title": "🙋 Claim Lead",
                                "url": `https://ampacbrain.azurewebsites.net/?claimLead=${lead.id}`
                            },
                            {
                                "type": "Action.OpenUrl",
                                "title": "👀 View Details",
                                "url": `https://ampacbrain.azurewebsites.net/?leadId=${lead.id}`
                            }
                        ]
                    }
                }
            ]
        };
        await this.postCard(card);
    }

    async sendStalledDealNotification(lead: Lead, daysStalled: number) {
        if (!TEAMS_WEBHOOK_URL) return;

        const card = {
            "type": "message",
            "attachments": [
                {
                    "contentType": "application/vnd.microsoft.card.adaptive",
                    "contentUrl": null,
                    "content": {
                        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                        "type": "AdaptiveCard",
                        "version": "1.2",
                        "body": [
                            {
                                "type": "TextBlock",
                                "text": "Action Required: Pipeline Stagnation",
                                "weight": "Bolder",
                                "size": "Large",
                                "color": "Attention"
                            },
                            {
                                "type": "TextBlock",
                                "text": `${lead.company} has been quiet for ${daysStalled} days.`,
                                "wrap": true
                            }
                        ],
                        "actions": [
                            {
                                "type": "Action.OpenUrl",
                                "title": "✅ Updated Today",
                                "url": `https://ampacbrain.azurewebsites.net/?leadId=${lead.id}&action=touch`
                            },
                            {
                                "type": "Action.OpenUrl",
                                "title": "🆘 Request Help",
                                "url": `https://teams.microsoft.com/l/chat/0/0?users=${lead.owner || ''}&message=Need help with ${lead.company}`
                            }
                        ]
                    }
                }
            ]
        };
        await this.postCard(card);
    }

    async sendScenarioCard(data: { industry: string; amount: number; collateral: string; story: string; bdo: string }) {
        if (!TEAMS_WEBHOOK_URL) return;

        const card = {
            "type": "message",
            "attachments": [
                {
                    "contentType": "application/vnd.microsoft.card.adaptive",
                    "contentUrl": null,
                    "content": {
                        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                        "type": "AdaptiveCard",
                        "version": "1.2",
                        "body": [
                            {
                                "type": "TextBlock",
                                "text": "🎭 New Scenario Request",
                                "weight": "Bolder",
                                "size": "Large",
                                "color": "Accent"
                            },
                            {
                                "type": "FactSet",
                                "facts": [
                                    { "title": "BDO", "value": data.bdo },
                                    { "title": "Industry", "value": data.industry },
                                    { "title": "Amount", "value": `$${data.amount.toLocaleString()}` },
                                    { "title": "Collateral", "value": data.collateral }
                                ]
                            },
                            {
                                "type": "TextBlock",
                                "text": data.story,
                                "wrap": true,
                                "isSubtle": true
                            }
                        ],
                        "actions": [
                            {
                                "type": "Action.OpenUrl",
                                "title": "👍 Greenlight",
                                "url": `https://ampacbrain.azurewebsites.net/?scenarioAction=approve&id=${Date.now()}` // Mock ID for now
                            },
                            {
                                "type": "Action.OpenUrl",
                                "title": "👎 Hard Pass",
                                "url": `https://ampacbrain.azurewebsites.net/?scenarioAction=decline&id=${Date.now()}`
                            }
                        ]
                    }
                }
            ]
        };
        await this.postCard(card);
    }

    private async postCard(card: any) {
        try {
            await axios.post(TEAMS_WEBHOOK_URL, card);
        } catch (error) {
            console.error('❌ Failed to send Teams notification', error);
        }
    }
}

export const teamsService = new TeamsService();
