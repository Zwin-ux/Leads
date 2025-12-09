import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Prisma keys:", Object.keys(prisma));
    // @ts-ignore
    if (prisma.lead) {
        console.log("✅ prisma.lead exists");
    } else {
        console.log("❌ prisma.lead MISSING");
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
