import * as dotenv from "dotenv";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

dotenv.config();

const db = drizzle(process.env.DATABASE_URL!);

async function main() {
  try {
    await db.execute(sql`ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "can_comment" boolean DEFAULT true NOT NULL`);
    await db.execute(sql`ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "comment_moderation" text DEFAULT 'none' NOT NULL`);
    await db.execute(sql`ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "comment_sort" text DEFAULT 'top' NOT NULL`);
    await db.execute(sql`ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "show_like_count" boolean DEFAULT true NOT NULL`);
  } catch (error) {
  }
}

main();
