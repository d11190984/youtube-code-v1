import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../src/db";
import { videos, videoViews } from "../src/db/schema";

async function check() {
  const allVideos = await db.select().from(videos);


  const viewsCount = await db.select({
    videoId: videoViews.videoId,
    count: sql<number>`count(*)`.as("count")
  })
    .from(videoViews)
    .groupBy(videoViews.videoId);


}

check().catch(console.error);
