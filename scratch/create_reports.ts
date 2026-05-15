import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const db = drizzle(process.env.DATABASE_URL!);

async function main() {
  console.log("Creating report enums and table...");
  try {
    // Create Types
    await db.execute(sql`CREATE TYPE "report_type" AS ENUM('video', 'comment', 'user');`);
    await db.execute(sql`CREATE TYPE "report_status" AS ENUM('pending', 'reviewed', 'resolved', 'dismissed');`);

    // Create Table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "reports" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid REFERENCES "users"("id") ON DELETE CASCADE NOT NULL,
        "target_id" uuid NOT NULL,
        "target_type" "report_type" NOT NULL,
        "reason" text NOT NULL,
        "description" text,
        "status" "report_status" DEFAULT 'pending' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log("Reports system created successfully!");
  } catch (error) {
    console.error("Error creating reports system:", error);
  }
}

main();
