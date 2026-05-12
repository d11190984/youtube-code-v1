import { z } from "zod";
import { eq, and, or, lt, gte, desc, ilike, getTableColumns } from "drizzle-orm";

import { db } from "@/db";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { users, videoReactions, videos, videoViews, subscriptions } from "@/db/schema";

export const searchRouter = createTRPCRouter({
  getMany: baseProcedure
    .input(
      z.object({
        query: z.string().nullish(),
        categoryId: z.string().uuid().nullish(),
        cursor: z.number().nullish(), // offset
        limit: z.number().min(1).max(100),
        type: z.enum(["all", "video", "shorts", "channel"]).optional().default("all"),
        duration: z.enum(["any", "under_3", "3_to_20", "over_20"]).optional().default("any"),
        uploadDate: z.enum(["any", "today", "this_week", "this_month", "this_year"]).optional().default("any"),
      }),
    )
    .query(async ({ input }) => {
      const { cursor, limit, query, categoryId, type, duration, uploadDate } = input;
      const offset = cursor || 0;

      // 1. Prepare uploadDate filter
      let dateFilter = undefined;
      const now = new Date();
      if (uploadDate === "today") {
        dateFilter = new Date(now.setHours(0, 0, 0, 0));
      } else if (uploadDate === "this_week") {
        const thisWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        thisWeek.setHours(0, 0, 0, 0);
        dateFilter = thisWeek;
      } else if (uploadDate === "this_month") {
        dateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (uploadDate === "this_year") {
        dateFilter = new Date(now.getFullYear(), 0, 1);
      }

      // 2. Prepare duration filter
      let minDuration = 0;
      let maxDuration = 999999999;
      if (duration === "under_3") {
        maxDuration = 3 * 60 * 1000;
      } else if (duration === "3_to_20") {
        minDuration = 3 * 60 * 1000;
        maxDuration = 20 * 60 * 1000;
      } else if (duration === "over_20") {
        minDuration = 20 * 60 * 1000;
      }

      // 3. Prepare type filter for shorts/video
      if (type === "shorts") {
        maxDuration = Math.min(maxDuration, 60 * 1000);
      } else if (type === "video") {
        minDuration = Math.max(minDuration, 60 * 1000 + 1); // > 1 min
      }

      const items: any[] = [];
      let hasMore = false;

      // --- CHANNELS QUERY ---
      if (type === "channel" || (type === "all" && offset === 0 && !categoryId && duration === "any" && uploadDate === "any")) {
        const channelLimit = type === "channel" ? limit + 1 : 3;
        const channelOffset = type === "channel" ? offset : 0;
        
        const channels = await db
          .select({
            ...getTableColumns(users),
            subscriberCount: db.$count(
              subscriptions, eq(subscriptions.creatorId, users.id)
            ),
            videoCount: db.$count(
              videos, eq(videos.userId, users.id)
            )
          })
          .from(users)
          .where(ilike(users.name, `%${query || ""}%`))
          .limit(channelLimit)
          .offset(channelOffset);

        if (type === "channel") {
          hasMore = channels.length > limit;
          const actualChannels = hasMore ? channels.slice(0, -1) : channels;
          actualChannels.forEach(c => items.push({ itemType: "channel", ...c }));
          
          return {
            items,
            nextCursor: hasMore ? offset + limit : null,
          };
        } else {
          // just prepend up to 3 channels when type is 'all'
          channels.forEach(c => items.push({ itemType: "channel", ...c }));
        }
      }

      // --- VIDEOS QUERY ---
      const data = await db
        .select({
          ...getTableColumns(videos),
          user: users,
          viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)),
          likeCount: db.$count(videoReactions, and(
            eq(videoReactions.videoId, videos.id),
            eq(videoReactions.type, "like"),
          )),
          dislikeCount: db.$count(videoReactions, and(
            eq(videoReactions.videoId, videos.id),
            eq(videoReactions.type, "dislike"),
          )),
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id))
        .where(and(
          eq(videos.visibility, "public"),
          ilike(videos.title, `%${query || ""}%`),
          categoryId ? eq(videos.categoryId, categoryId) : undefined,
          dateFilter ? gte(videos.createdAt, dateFilter) : undefined,
          gte(videos.duration, minDuration),
          lt(videos.duration, maxDuration)
        ))
        .orderBy(desc(videos.createdAt), desc(videos.id))
        .limit(limit + 1)
        .offset(offset);

      hasMore = data.length > limit;
      const actualVideos = hasMore ? data.slice(0, -1) : data;
      actualVideos.forEach(v => items.push({ itemType: "video", ...v }));

      return {
        items,
        nextCursor: hasMore ? offset + limit : null,
      };
    }),
  getHashtagMany: baseProcedure
    .input(
      z.object({
        tag: z.string(),
        cursor: z.number().nullish(),
        limit: z.number().min(1).max(100),
      }),
    )
    .query(async ({ input }) => {
      const { tag, cursor, limit } = input;
      const offset = cursor || 0;

      const data = await db
        .select({
          ...getTableColumns(videos),
          user: users,
          viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)),
          likeCount: db.$count(videoReactions, and(
            eq(videoReactions.videoId, videos.id),
            eq(videoReactions.type, "like"),
          )),
          dislikeCount: db.$count(videoReactions, and(
            eq(videoReactions.videoId, videos.id),
            eq(videoReactions.type, "dislike"),
          )),
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id))
        .where(and(
          eq(videos.visibility, "public"),
          or(
            ilike(videos.title, `%#${tag}%`),
            ilike(videos.description, `%#${tag}%`)
          )
        ))
        .orderBy(desc(videos.createdAt), desc(videos.id))
        .limit(limit + 1)
        .offset(offset);

      const hasMore = data.length > limit;
      const actualVideos = hasMore ? data.slice(0, -1) : data;

      return {
        items: actualVideos.map(v => ({ itemType: "video", ...v })),
        nextCursor: hasMore ? offset + limit : null,
      };
    }),
  getTrendingHashtags: baseProcedure
    .query(async () => {
      // Trong thực tế, bạn sẽ query từ DB các hashtag xuất hiện nhiều nhất
      // Ở đây demo trả về danh sách cứng
      return [
        "shadow",
        "music",
        "vlog",
        "gaming",
        "coding",
        "tutorial",
        "asmr",
        "japansong",
        "anime",
        "lofi"
      ];
    }),
});
