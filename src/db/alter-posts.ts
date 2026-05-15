import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config();

const db = drizzle(process.env.DATABASE_URL!);

async function main() {
  console.log("Altering table posts...");
  try {
    await db.execute(sql`ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "can_comment" boolean DEFAULT true NOT NULL`);
    await db.execute(sql`ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "comment_moderation" text DEFAULT 'none' NOT NULL`);
    await db.execute(sql`ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "comment_sort" text DEFAULT 'top' NOT NULL`);
    await db.execute(sql`ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "show_like_count" boolean DEFAULT true NOT NULL`);
    console.log("Successfully altered table posts.");
  } catch (error) {
    console.error("Error altering table posts:", error);
  }
}

main();
