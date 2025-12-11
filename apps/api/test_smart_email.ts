
import { brainService } from './src/services/brainService';

async function testSmartEmail() {
    console.log('📧 Testing Smart Email Generation...');

    // Mock Context (simulating what Graph would return)
    const mockLead = {
        firstName: "John",
        lastName: "Doe",
        company: "Acme Logistics",
        industry: "Trucking",
        useOfFunds: ["Warehouse", "Trucks"],
        loanAmount: 1500000
    };

    const mockEmailContext = {
        senderName: "Top BDO",
        lastEmails: [
            "[10/25] John: I'm waiting on the Phase 1 report.",
            "[10/22] John: Interest rates are a concern."
        ],
        slots: ["Tue 2pm", "Thu 10am"]
    };

    try {
        const result = await brainService.generateSmartEmail(
            mockLead,
            "FollowUp",
            mockEmailContext
        );
        console.log('✅ Subject:', result.subject);
        console.log('📝 Body:\n', result.body);
    } catch (e: any) {
        console.error('❌ Failed:', e.message);
    }
}

testSmartEmail();
