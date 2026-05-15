import { z } from "zod";
import { eq, and, or, lt, gte, desc, ilike, getTableColumns, sql, arrayOverlaps } from "drizzle-orm";

import { db } from "@/db";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { users, videoReactions, videos, videoViews, subscriptions, searchHistory, posts, playlists, playlistVideos } from "@/db/schema";
import { protectedProcedure } from "@/trpc/init";

export const searchRouter = createTRPCRouter({
  getMany: baseProcedure
    .input(
      z.object({
        query: z.string().nullish(),
        categoryId: z.string().uuid().nullish(),
        cursor: z.number().nullish(), // offset
        limit: z.number().min(1).max(100),
        type: z.enum(["all", "video", "shorts", "channel", "playlist", "post"]).optional().default("all"),
        duration: z.enum(["any", "under_3", "3_to_20", "over_20"]).optional().default("any"),
        uploadDate: z.enum(["any", "today", "this_week", "this_month", "this_year"]).optional().default("any"),
      }),
    )
    .query(async ({ input }) => {
      const { cursor, limit, query, categoryId, type, duration, uploadDate } = input;
      const offset = cursor || 0;

      // Clean query for FTS
      const cleanQuery = query?.trim() || "";
      const ftsQuery = cleanQuery ? cleanQuery.split(/\s+/).join(" & ") : "";

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
        
        const channelRank = cleanQuery 
          ? sql<number>`ts_rank(to_tsvector('simple', ${users.name} || ' ' || COALESCE(${users.handle}, '')), to_tsquery('simple', ${ftsQuery}))`
          : sql<number>`0`;

        const channels = await db
          .select({
            ...getTableColumns(users),
            subscriberCount: db.$count(
              subscriptions, eq(subscriptions.creatorId, users.id)
            ),
            videoCount: db.$count(
              videos, eq(videos.userId, users.id)
            ),
            rank: channelRank
          })
          .from(users)
          .where(cleanQuery ? sql`to_tsvector('simple', ${users.name} || ' ' || COALESCE(${users.handle}, '')) @@ to_tsquery('simple', ${ftsQuery})` : undefined)
          .orderBy(desc(channelRank), desc(users.createdAt))
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
      if (type === "all" || type === "video" || type === "shorts") {
        const videoRank = cleanQuery 
          ? sql<number>`ts_rank(to_tsvector('simple', ${videos.title} || ' ' || COALESCE(${videos.description}, '')), to_tsquery('simple', ${ftsQuery}))`
          : sql<number>`0`;

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
            rank: videoRank
          })
          .from(videos)
          .innerJoin(users, eq(videos.userId, users.id))
          .where(and(
            eq(videos.visibility, "public"),
            cleanQuery ? sql`to_tsvector('simple', ${videos.title} || ' ' || COALESCE(${videos.description}, '')) @@ to_tsquery('simple', ${ftsQuery})` : undefined,
            categoryId ? eq(videos.categoryId, categoryId) : undefined,
            dateFilter ? gte(videos.createdAt, dateFilter) : undefined,
            gte(videos.duration, minDuration),
            lt(videos.duration, maxDuration)
          ))
          .orderBy(desc(videoRank), desc(videos.createdAt), desc(videos.id))
          .limit(limit + 1)
          .offset(offset);

        hasMore = data.length > limit;
        const actualVideos = hasMore ? data.slice(0, -1) : data;
        actualVideos.forEach(v => items.push({ itemType: "video", ...v }));
      }

      // --- PLAYLISTS QUERY ---
      if (type === "all" || type === "playlist") {
        const playlistRank = cleanQuery 
          ? sql<number>`ts_rank(to_tsvector('simple', ${playlists.name} || ' ' || COALESCE(${playlists.description}, '')), to_tsquery('simple', ${ftsQuery}))`
          : sql<number>`0`;

        const playlistData = await db
          .select({
            ...getTableColumns(playlists),
            user: users,
            videoCount: db.$count(playlistVideos, eq(playlistVideos.playlistId, playlists.id)),
            rank: playlistRank
          })
          .from(playlists)
          .innerJoin(users, eq(playlists.userId, users.id))
          .where(and(
            eq(playlists.visibility, "public"),
            cleanQuery ? sql`to_tsvector('simple', ${playlists.name} || ' ' || COALESCE(${playlists.description}, '')) @@ to_tsquery('simple', ${ftsQuery})` : undefined,
          ))
          .orderBy(desc(playlistRank), desc(playlists.createdAt))
          .limit(limit + 1)
          .offset(offset);

        if (type === "playlist") {
          hasMore = playlistData.length > limit;
          const actualPlaylists = hasMore ? playlistData.slice(0, -1) : playlistData;
          actualPlaylists.forEach(p => items.push({ itemType: "playlist", ...p }));
        } else if (type === "all") {
          // Prepend some playlists if it's the first page
          if (offset === 0) {
            playlistData.slice(0, 2).forEach(p => items.push({ itemType: "playlist", ...p }));
          }
        }
      }

      // --- POSTS QUERY ---
      if (type === "all" || type === "post") {
        const postRank = cleanQuery 
          ? sql<number>`ts_rank(to_tsvector('simple', COALESCE(${posts.content}, '')), to_tsquery('simple', ${ftsQuery}))`
          : sql<number>`0`;

        const postData = await db
          .select({
            ...getTableColumns(posts),
            user: users,
            rank: postRank
          })
          .from(posts)
          .innerJoin(users, eq(posts.userId, users.id))
          .where(and(
            cleanQuery ? sql`to_tsvector('simple', COALESCE(${posts.content}, '')) @@ to_tsquery('simple', ${ftsQuery})` : undefined,
          ))
          .orderBy(desc(postRank), desc(posts.createdAt))
          .limit(limit + 1)
          .offset(offset);

        if (type === "post") {
          hasMore = postData.length > limit;
          const actualPosts = hasMore ? postData.slice(0, -1) : postData;
          actualPosts.forEach(p => items.push({ itemType: "post", ...p }));
        } else if (type === "all") {
           // Prepend some posts if it's the first page
           if (offset === 0) {
            postData.slice(0, 2).forEach(p => items.push({ itemType: "post", ...p }));
          }
        }
      }

      return {
        items,
        nextCursor: hasMore ? offset + limit : null,
      };
    }),
  getSuggestions: baseProcedure
    .input(z.object({
      query: z.string(),
      limit: z.number().min(1).max(20).default(10),
    }))
    .query(async ({ input }) => {
      const { query, limit } = input;
      if (!query.trim()) return [];

      const cleanQuery = query.trim();
      const ftsQuery = cleanQuery.split(/\s+/).join(" & ") + ":*"; // Prefix search

      // Get suggestions from videos, users, and playlists
      const videoSuggestions = await db
        .select({ text: videos.title })
        .from(videos)
        .where(and(
          eq(videos.visibility, "public"),
          sql`to_tsvector('simple', ${videos.title}) @@ to_tsquery('simple', ${ftsQuery})`
        ))
        .limit(limit);

      const userSuggestions = await db
        .select({ text: users.name })
        .from(users)
        .where(sql`to_tsvector('simple', ${users.name}) @@ to_tsquery('simple', ${ftsQuery})`)
        .limit(limit);

      const suggestions = Array.from(new Set([
        ...videoSuggestions.map(v => v.text),
        ...userSuggestions.map(u => u.text)
      ])).slice(0, limit);

      return suggestions;
    }),
  getHistory: protectedProcedure
    .query(async ({ ctx }) => {
      const { user } = ctx;

      const history = await db
        .select()
        .from(searchHistory)
        .where(eq(searchHistory.userId, user.id))
        .orderBy(desc(searchHistory.updatedAt))
        .limit(10);

      return history;
    }),
  createHistory: protectedProcedure
    .input(z.object({
      query: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx;
      const { query } = input;

      const existing = await db
        .select()
        .from(searchHistory)
        .where(and(
          eq(searchHistory.userId, user.id),
          eq(searchHistory.query, query)
        ))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(searchHistory)
          .set({ updatedAt: new Date() })
          .where(eq(searchHistory.id, existing[0].id));
        return existing[0];
      }

      const [newHistory] = await db
        .insert(searchHistory)
        .values({
          userId: user.id,
          query,
        })
        .returning();

      return newHistory;
    }),
  removeHistory: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx;
      const { id } = input;

      await db
        .delete(searchHistory)
        .where(and(
          eq(searchHistory.id, id),
          eq(searchHistory.userId, user.id)
        ));

      return { success: true };
    }),
  clearHistory: protectedProcedure
    .mutation(async ({ ctx }) => {
      const { user } = ctx;

      await db
        .delete(searchHistory)
        .where(eq(searchHistory.userId, user.id));

      return { success: true };
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
          arrayOverlaps(videos.tags, [tag])
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
      // Lấy top 10 tags xuất hiện nhiều nhất trong 7 ngày qua
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      // Vì tags là mảng, ta cần unnest để đếm
      // Drizzle hỗ trợ sql fragment cho unnest
      const trendingTags = await db
        .select({
          tag: sql<string>`unnest(${videos.tags})`.as("tag"),
          count: sql<number>`count(*)`.as("count"),
        })
        .from(videos)
        .where(gte(videos.createdAt, lastWeek))
        .groupBy(sql`tag`)
        .orderBy(desc(sql`count`))
        .limit(10);

      return trendingTags.map(t => t.tag);
    }),
  getTagSuggestions: baseProcedure
    .input(z.object({
      query: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { query = "" } = input;
      
      if (!query.trim()) {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);

        // Return top 10 trending tags from the last 7 days
        const trendingTags = await db
          .select({
            tag: sql<string>`tag`,
          })
          .from(sql`(SELECT unnest(${videos.tags}) as tag, created_at FROM ${videos}) as t`)
          .where(gte(sql`created_at`, lastWeek))
          .groupBy(sql`tag`)
          .orderBy(desc(sql`count(*)`))
          .limit(10);

        return trendingTags.map(t => t.tag);
      }

      // Return tags starting with the query
      const results = await db
        .select({
          tag: sql<string>`tag`,
        })
        .from(sql`(SELECT unnest(${videos.tags}) as tag FROM ${videos}) as t`)
        .where(ilike(sql`tag`, `${query}%`))
        .groupBy(sql`tag`)
        .limit(10);

      return results.map(r => r.tag);
    }),
});
