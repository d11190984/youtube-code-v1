import "dotenv/config";
import { db } from "../src/db";
import { videos, videoViews } from "../src/db/schema";
import { eq, sql } from "drizzle-orm";

async function check() {
  const allVideos = await db.select().from(videos);
  console.log("Videos:", allVideos.map(v => ({ id: v.id, title: v.title, w: v.videoWidth, h: v.videoHeight })));

  const viewsCount = await db.select({
    videoId: videoViews.videoId,
    count: sql<number>`count(*)`.as("count")
  })
  .from(videoViews)
  .groupBy(videoViews.videoId);

  console.log("Views by Video ID:", viewsCount);
}

check().catch(console.error);
