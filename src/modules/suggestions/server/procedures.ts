import { z } from "zod";
import { eq, and, getTableColumns, not, inArray, sql, gt, lte } from "drizzle-orm";

import { db } from "@/db";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, baseProcedure } from "@/trpc/init";
import { users, videoReactions, videos, videoViews } from "@/db/schema";

export const suggestionsRouter = createTRPCRouter({
  getMany: baseProcedure
    .input(
      z.object({
        videoId: z.string().uuid(),
        limit: z.number().min(1).max(20).default(5),
        excludeIds: z.array(z.string().uuid()).optional(),
        isShort: z.boolean().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { videoId, limit, excludeIds = [], isShort } = input;

      const aspectFilter = isShort === undefined 
        ? undefined 
        : isShort 
          ? gt(videos.videoHeight, videos.videoWidth) 
          : lte(videos.videoHeight, videos.videoWidth);

      // 🔍 Lấy video hiện tại
      const [existingVideo] = await db
        .select()
        .from(videos)
        .where(eq(videos.id, videoId));

      if (!existingVideo) throw new TRPCError({ code: "NOT_FOUND" });

      // 🔥 List loại bỏ
      const excluded = [videoId, ...excludeIds];

      // 👤 Viewer hiện tại
      let viewerId: string | undefined;
      if (ctx.clerkUserId) {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.clerkId, ctx.clerkUserId));
        viewerId = user?.id;
      }

      // =========================
      // 🎯 1. VIDEO CÙNG CATEGORY (RANDOM)
      // =========================
      const sameCategory = await db
        .select({
          ...getTableColumns(videos),
          user: users,
          progress: sql<number>`user_progress.progress`, // 🔹 progress user hiện tại
          viewCount: videos.viewsCount, // 🔹 tổng viewCount
          likeCount: db.$count(
            videoReactions,
            and(
              eq(videoReactions.videoId, videos.id),
              eq(videoReactions.type, "like"),
            ),
          ),
          dislikeCount: db.$count(
            videoReactions,
            and(
              eq(videoReactions.videoId, videos.id),
              eq(videoReactions.type, "dislike"),
            ),
          ),
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id))
        .leftJoin(
          db.select({
            videoId: videoViews.videoId,
            userId: videoViews.userId,
            progress: sql<number>`MAX(${videoViews.progress})`.as("progress")
          })
          .from(videoViews)
          .where(viewerId ? eq(videoViews.userId, viewerId) : sql`1=0`)
          .groupBy(videoViews.videoId, videoViews.userId)
          .as("user_progress"),
          eq(videos.id, sql`user_progress.video_id`)
        )
        .where(
          and(
            eq(videos.visibility, "public"),
            aspectFilter, // 🔥 Lọc theo tỉ lệ khung hình
            existingVideo.categoryId
              ? eq(videos.categoryId, existingVideo.categoryId)
              : undefined,
            not(inArray(videos.id, excluded)),
          ),
        )
        .orderBy(sql`RANDOM()`)
        .limit(limit);

      if (sameCategory.length >= limit)
        return { items: sameCategory, nextCursor: null };

      // =========================
      // 🔥 2. FALLBACK RANDOM KHÁC CATEGORY
      // =========================
      const otherVideos = await db
        .select({
          ...getTableColumns(videos),
          user: users,
          progress: sql<number>`user_progress_fallback.progress`,
          viewCount: videos.viewsCount,
          likeCount: db.$count(
            videoReactions,
            and(
              eq(videoReactions.videoId, videos.id),
              eq(videoReactions.type, "like"),
            ),
          ),
          dislikeCount: db.$count(
            videoReactions,
            and(
              eq(videoReactions.videoId, videos.id),
              eq(videoReactions.type, "dislike"),
            ),
          ),
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id))
        .leftJoin(
          db.select({
            videoId: videoViews.videoId,
            userId: videoViews.userId,
            progress: sql<number>`MAX(${videoViews.progress})`.as("progress")
          })
          .from(videoViews)
          .where(viewerId ? eq(videoViews.userId, viewerId) : sql`1=0`)
          .groupBy(videoViews.videoId, videoViews.userId)
          .as("user_progress_fallback"),
          eq(videos.id, sql`user_progress_fallback.video_id`)
        )
        .where(
          and(
            eq(videos.visibility, "public"),
            aspectFilter, // 🔥 Lọc theo tỉ lệ khung hình
            not(inArray(videos.id, excluded)),
          ),
        )
        .orderBy(sql`RANDOM()`)
        .limit(limit - sameCategory.length);

      // =========================
      // 🔥 3. MERGE KHÔNG TRÙNG
      // =========================
      const merged = [...sameCategory];
      for (const v of otherVideos) {
        if (!merged.find((m) => m.id === v.id)) merged.push(v);
      }

      return { items: merged, nextCursor: null };
    }),
});
