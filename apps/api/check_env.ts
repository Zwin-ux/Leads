import 'dotenv/config';
console.log("DB URL:", process.env.DATABASE_URL ? "Defined and length " + process.env.DATABASE_URL.length : "Undefined");
console.log("FIRECRAWL:", process.env.FIRECRAWL_API_KEY ? "Defined" : "Undefined");
