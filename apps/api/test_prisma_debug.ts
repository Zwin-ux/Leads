import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

async function test() {
    console.log("\n--- TEST 2: datasourceUrl ---");
    try {
        const p2 = new (PrismaClient as any)({
            datasourceUrl: process.env.DATABASE_URL
        });
        await p2.$connect();
        console.log("SUCCESS: datasourceUrl");
        await p2.$disconnect();
    } catch (e: any) {
        console.log("FAIL: datasourceUrl ->", e.message);
    }
}

test();
