import "dotenv/config";
import { db } from "../src/db";
import { videos, videoViews } from "../src/db/schema";
import { eq, sql } from "drizzle-orm";

async function check() {
  const allViews = await db.select({
    userId: videoViews.userId,
    videoId: videoViews.videoId,
    title: videos.title,
    createdAt: videoViews.createdAt
  })
    .from(videoViews)
    .innerJoin(videos, eq(videoViews.videoId, videos.id))
    .orderBy(videoViews.createdAt);


  title: v.title,
    time: v.createdAt.toISOString()
})));
}

check().catch(console.error);
