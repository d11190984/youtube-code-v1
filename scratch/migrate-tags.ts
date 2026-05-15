import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  
  console.log("Adding tags column and GIN index...");
  try {
    await sql`ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "tags" text[]`;
    await sql`CREATE INDEX IF NOT EXISTS "tags_gin_idx" ON "videos" USING gin ("tags")`;
    console.log("Success!");
  } catch (error) {
    console.error("Failed:", error);
    process.exit(1);
  }
}

main();
