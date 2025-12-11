
import { teamsService } from './src/services/teamsService';

const mockLead: any = {
    id: 'test-lead-123',
    company: 'Acme Corp (Test)',
    loanAmount: 1500000,
    owner: 'Test User',
    stage: 'Funded'
};

async function test() {
    console.log('Testing Teams Webhooks (All Types)...');

    // 1. New Lead (Assignment)
    console.log('Sending: New Lead Opportunity...');
    await teamsService.sendNewLeadNotification({
        ...mockLead,
        stage: 'New',
        company: 'Acme Manufacturing Inc.'
    });

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Deal Funded (Notification)
    console.log('Sending: Deal Funded Notification...');
    await teamsService.sendDealFundedNotification(mockLead);

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Stalled Deal (Action Required)
    console.log('Sending: Stalled Deal Action...');
    await teamsService.sendStalledDealNotification({
        ...mockLead,
        company: 'Global Logistics LLC',
        owner: 'Ed Ryan'
    }, 12); // 12 days stalled

    console.log('Done. Check Teams!');
}

test();
