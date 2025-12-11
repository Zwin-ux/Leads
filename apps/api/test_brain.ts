
import { brainService } from './src/services/brainService';

async function runTest() {
    console.log("Testing Azure OpenAI via BrainService...");

    const mockLead = {
        firstName: "Test",
        lastName: "User",
        company: "Acme Corp",
        notes: [{ content: "Interested in 504 loan for building purchase." }]
    };

    try {
        console.log("1. Generating Next Action...");
        const action = await brainService.getNextAction(mockLead);
        console.log("✅ Action:", action);

        console.log("2. Generating Email...");
        const email = await brainService.generateEmail(mockLead, "Intro");
        console.log("✅ Email (preview):", email.substring(0, 50) + "...");

    } catch (e: any) {
        console.error("❌ Test Failed:", e.message);
        if (e.message.includes("404")) {
            console.error("Hint: Check Deployment Name in .env");
        }
    }
}

runTest();
