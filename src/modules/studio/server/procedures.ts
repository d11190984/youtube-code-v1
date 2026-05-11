import { z } from "zod";
import { format, formatDistanceToNow } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { vi } from "date-fns/locale";
import { TRPCError } from "@trpc/server";
import { eq, and, or, lt, gt, lte, gte, isNull, isNotNull, desc, getTableColumns, sql, inArray } from "drizzle-orm";
import {
  subscriptions,
  comments,
  users,
  videoReactions,
  videos,
  videoViews,
  posts,
  postImages,
  postPolls,
  postPollOptions,
  postPollVotes,
  postReactions,
} from "@/db/schema";
import { db } from "@/db";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const studioRouter = createTRPCRouter({
  getOne: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const { id } = input;

      const [video] = await db
        .select()
        .from(videos)
        .where(and(eq(videos.id, id), eq(videos.userId, userId)));

      if (!video) throw new TRPCError({ code: "NOT_FOUND" });

      return video;
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const { id: userId } = ctx.user;

    // Tổng số người đăng ký
    const totalSubscribers = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.creatorId, userId))
      .execute();

    // Bình luận mới nhất 5 cái
    const latestComments = await db
      .select({
        id: comments.id,
        value: comments.value,
        userName: users.name,
        userAvatar: users.imageUrl,
        videoThumbnail: videos.thumbnailUrl,
        videoTitle: videos.title,
        createdAt: comments.createdAt,
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .innerJoin(videos, eq(comments.videoId, videos.id))
      .where(eq(videos.userId, userId))
      .orderBy(desc(comments.createdAt))
      .limit(5)
      .execute();

    // Người đăng ký gần đây 5 cái + số sub của họ
    const recentSubscribers = await db
      .select({
        viewerId: subscriptions.viewerId,
        name: users.name,
        avatarUrl: users.imageUrl,
        subscriberCount: db.$count(
          subscriptions,
          eq(subscriptions.creatorId, users.id)
        ),
      })
      .from(subscriptions)
      .innerJoin(users, eq(subscriptions.viewerId, users.id))
      .where(eq(subscriptions.creatorId, userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(5)
      .execute();

    // Bài đăng mới nhất
    const [latestPost] = await db
      .select({
        ...getTableColumns(posts),
        likeCount: db.$count(
          postReactions,
          and(eq(postReactions.postId, posts.id), eq(postReactions.type, "like"))
        ),
        commentCount: db.$count(
          comments,
          eq(comments.postId, posts.id)
        ),
      })
      .from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt))
      .limit(1);

    let latestPostWithData = null;
    if (latestPost) {
       const images = await db.select().from(postImages).where(eq(postImages.postId, latestPost.id));
       const [poll] = await db.select().from(postPolls).where(eq(postPolls.postId, latestPost.id));
       
       let pollData = null;
       if (poll) {
          const options = await db.select().from(postPollOptions).where(eq(postPollOptions.pollId, poll.id));
          const optionsWithVotes = await Promise.all(options.map(async (opt) => {
             const voteCount = await db.$count(postPollVotes, eq(postPollVotes.optionId, opt.id));
             return { ...opt, voteCount };
          }));
          pollData = { ...poll, options: optionsWithVotes };
       }

       latestPostWithData = {
          ...latestPost,
          images,
          poll: pollData,
       };
    }

    // Lấy thông tin user hiện tại (chủ kênh)
    const [channelUser] = await db
      .select({
        name: users.name,
        imageUrl: users.imageUrl,
      })
      .from(users)
      .where(eq(users.id, userId));

    return {
      totalSubscribers: totalSubscribers.length,
      latestComments,
      recentSubscribers,
      latestPost: latestPostWithData,
      userName: channelUser?.name,
      userAvatar: channelUser?.imageUrl,
    };
  }),

  getMany: protectedProcedure
    .input(
      z.object({
        cursor: z
          .object({ id: z.string().uuid(), createdAt: z.date() })
          .nullish(),
        limit: z.number().min(1).max(100),
        isShorts: z.boolean().nullish(),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
        title: z.string().nullish(),
        description: z.string().nullish(),
        viewCount: z.number().nullish(),
        visibility: z.enum(["public", "private"]).nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit, isShorts, sortOrder, title, description, viewCount, visibility } = input;
      const { id: userId } = ctx.user;

      // Lọc theo loại video (Shorts vs Regular)
      const typeFilter = isShorts 
        ? gt(videos.videoHeight, videos.videoWidth)
        : or(
            lte(videos.videoHeight, videos.videoWidth),
            and(isNull(videos.videoHeight), isNull(videos.videoWidth))
          );

      // Lấy video và thống kê
      const data = await db
        .select({
          ...getTableColumns(videos),
          viewCount: videos.viewsCount, // tổng viewCount,
          commentCount: db.$count(comments, eq(comments.videoId, videos.id)),
          likeCount: db.$count(
            videoReactions,
            and(
              eq(videoReactions.type, "like"),
              eq(videoReactions.videoId, videos.id),
            ),
          ),
        })
        .from(videos)
        .where(
          and(
            eq(videos.userId, userId),
            typeFilter,
            title ? sql`LOWER(${videos.title}) LIKE LOWER(${`%${title}%`})` : undefined,
            description ? sql`LOWER(${videos.description}) LIKE LOWER(${`%${description}%`})` : undefined,
            viewCount ? gte(videos.viewsCount, viewCount) : undefined,
            visibility ? eq(videos.visibility, visibility) : undefined,
            cursor
              ? sortOrder === "desc"
                ? or(
                    lt(videos.createdAt, cursor.createdAt),
                    and(
                      eq(videos.createdAt, cursor.createdAt),
                      lt(videos.id, cursor.id),
                    ),
                  )
                : or(
                    gt(videos.createdAt, cursor.createdAt),
                    and(
                      eq(videos.createdAt, cursor.createdAt),
                      gt(videos.id, cursor.id),
                    ),
                  )
              : undefined,
          ),
        )
        .orderBy(
          sortOrder === "desc" ? desc(videos.createdAt) : videos.createdAt,
          sortOrder === "desc" ? desc(videos.id) : videos.id
        )
        .limit(limit + 1);

      const hasMore = data.length > limit;
      const items = hasMore ? data.slice(0, -1) : data;

      // Tính tỷ lệ xem trung bình cho từng video
      const itemsWithAvgView = await Promise.all(
        items.map(async (v) => {
          const views = await db
            .select({ progress: videoViews.progress })
            .from(videoViews)
            .where(eq(videoViews.videoId, v.id))
            .execute();
          const averageViewPercent = views.length
            ? Math.floor(
                views.reduce((acc, curr) => acc + curr.progress, 0) /
                  views.length,
              )
            : 0;
          return { ...v, averageViewPercent };
        }),
      );

      const lastItem = itemsWithAvgView[itemsWithAvgView.length - 1];
      const nextCursor = hasMore
        ? { id: lastItem.id, createdAt: lastItem.createdAt }
        : null;

      return { items: itemsWithAvgView, nextCursor };
    }),

  getPost: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const { id } = input;

      const [post] = await db
        .select({
          ...getTableColumns(posts),
          likeCount: db.$count(
            postReactions,
            and(eq(postReactions.postId, posts.id), eq(postReactions.type, "like"))
          ),
          commentCount: db.$count(
            comments,
            eq(comments.postId, posts.id)
          ),
        })
        .from(posts)
        .where(and(eq(posts.id, id), eq(posts.userId, userId)));

      if (!post) throw new TRPCError({ code: "NOT_FOUND" });

      // Lấy images
      const images = await db
        .select()
        .from(postImages)
        .where(eq(postImages.postId, post.id));

      // Lấy poll
      const [poll] = await db
        .select()
        .from(postPolls)
        .where(eq(postPolls.postId, post.id));

      let pollWithOptions = null;
      if (poll) {
        const options = await db
          .select({
            ...getTableColumns(postPollOptions),
            voteCount: db.$count(
              postPollVotes,
              eq(postPollVotes.optionId, postPollOptions.id)
            ),
          })
          .from(postPollOptions)
          .where(eq(postPollOptions.pollId, poll.id));
        
        pollWithOptions = {
          ...poll,
          options,
        };
      }

      return {
        ...post,
        images,
        poll: pollWithOptions,
      };
    }),

  getRecentVideos: protectedProcedure
    .input(z.object({
      query: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const { query } = input;

      const data = await db
        .select()
        .from(videos)
        .where(
          and(
            eq(videos.userId, userId),
            query 
              ? sql`LOWER(${videos.title}) LIKE LOWER(${`%${query}%`})`
              : undefined,
          )
        )
        .orderBy(desc(videos.createdAt))
        .limit(5);

      return data;
    }),

  getAnalytics: protectedProcedure
    .input(z.object({ days: z.number().default(28) }))
    .query(async ({ ctx, input }) => {
    const { id: userId } = ctx.user;
    const { days } = input;

    // 1. Tổng quát (Total stats)
    // 1. Tổng quát (Total stats from viewCount)
    const [statsInRange] = await db
      .select({
        totalViews: sql<number>`CAST(SUM(${videos.viewsCount}) AS INTEGER)`,
      })
      .from(videos)
      .where(eq(videos.userId, userId));

    const [totalSubscribers] = await db
      .select({
        count: sql<number>`CAST(COUNT(*) AS INTEGER)`,
      })
      .from(subscriptions)
      .where(eq(subscriptions.creatorId, userId));

    // 2. Views theo ngày
    const viewsByDay = await db
      .select({
        date: sql<string>`DATE_TRUNC('day', ${videoViews.createdAt})`,
        views: sql<number>`CAST(COUNT(*) AS INTEGER)`,
      })
      .from(videoViews)
      .innerJoin(videos, eq(videoViews.videoId, videos.id))
      .where(
        and(
          eq(videos.userId, userId),
          gte(videoViews.createdAt, sql`NOW() - INTERVAL '1 day' * ${days}`)
        )
      )
      .groupBy(sql`DATE_TRUNC('day', ${videoViews.createdAt})`)
      .orderBy(sql`DATE_TRUNC('day', ${videoViews.createdAt})`);

    // 2.5 Watch time
    const watchTimeData = await db
      .select({
        progress: videoViews.progress,
        duration: videos.duration,
      })
      .from(videoViews)
      .innerJoin(videos, eq(videoViews.videoId, videos.id))
      .where(
        and(
          eq(videos.userId, userId),
          gte(videoViews.createdAt, sql`NOW() - INTERVAL '1 day' * ${days}`)
        )
      );
    
    const totalWatchTimeSec = watchTimeData.reduce((acc, v) => acc + (v.duration * v.progress / 100), 0);
    const totalWatchTimeHours = (totalWatchTimeSec / 3600).toFixed(1);

    // 3. Top videos with average view percent
    const topVideosRaw = await db
      .select({
        id: videos.id,
        title: videos.title,
        thumbnailUrl: videos.thumbnailUrl,
        viewsCount: videos.viewsCount,
        duration: videos.duration,
        createdAt: videos.createdAt,
        muxPlaybackId: videos.muxPlaybackId,
      })
      .from(videos)
      .where(eq(videos.userId, userId))
      .orderBy(desc(videos.viewsCount))
      .limit(5);

    const topVideos = await Promise.all(
      topVideosRaw.map(async (v) => {
        const views = await db
          .select({ progress: videoViews.progress })
          .from(videoViews)
          .where(eq(videoViews.videoId, v.id))
          .execute();
        const averageViewPercent = views.length
          ? Math.floor(
              views.reduce((acc, curr) => acc + curr.progress, 0) /
                views.length,
            )
          : 0;
        
        const avgDurationInSec = Math.floor(v.duration * (averageViewPercent / 100));
        const mins = Math.floor(avgDurationInSec / 60);
        const secs = avgDurationInSec % 60;
        const avgDurationLabel = `${mins}:${secs.toString().padStart(2, "0")}`;

        return { 
          ...v, 
          averageViewPercent,
          avgDurationLabel 
        };
      })
    );

    // 4. Subscriber growth (Last 28 days)
    const subscribersByDay = await db
      .select({
        date: sql<string>`DATE_TRUNC('day', ${subscriptions.createdAt})`,
        count: sql<number>`CAST(COUNT(*) AS INTEGER)`,
      })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.creatorId, userId),
          gte(subscriptions.createdAt, sql`NOW() - INTERVAL '1 day' * ${days}`)
        )
      )
      .groupBy(sql`DATE_TRUNC('day', ${subscriptions.createdAt})`)
      .orderBy(sql`DATE_TRUNC('day', ${subscriptions.createdAt})`);

    // 5. Audience Metrics
    const [uniqueViewersData] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${videoViews.userId})` })
      .from(videoViews)
      .innerJoin(videos, eq(videoViews.videoId, videos.id))
      .where(and(
        eq(videos.userId, userId),
        gte(videoViews.createdAt, sql`NOW() - INTERVAL '1 day' * ${days}`),
        isNotNull(videoViews.userId)
      ));

    const viewsFromSubscribersData = await db
      .select({
        isSubscribed: sql<boolean>`CASE WHEN ${subscriptions.viewerId} IS NOT NULL THEN true ELSE false END`,
        count: sql<number>`CAST(COUNT(*) AS INTEGER)`
      })
      .from(videoViews)
      .innerJoin(videos, eq(videoViews.videoId, videos.id))
      .leftJoin(subscriptions, and(
        eq(subscriptions.creatorId, videos.userId),
        eq(subscriptions.viewerId, videoViews.userId)
      ))
      .where(and(
        eq(videos.userId, userId),
        gte(videoViews.createdAt, sql`NOW() - INTERVAL '1 day' * ${days}`)
      ))
      .groupBy(sql`CASE WHEN ${subscriptions.viewerId} IS NOT NULL THEN true ELSE false END`);

    let subscribedViews = 0;
    let unsubscribedViews = 0;
    viewsFromSubscribersData.forEach((r: any) => {
      if (r.isSubscribed) subscribedViews += Number(r.count);
      else unsubscribedViews += Number(r.count);
    });

    const totalAudienceViews = subscribedViews + unsubscribedViews;
    const subscribedPercent = totalAudienceViews > 0 ? (subscribedViews / totalAudienceViews) * 100 : 0;
    const unsubscribedPercent = totalAudienceViews > 0 ? (unsubscribedViews / totalAudienceViews) * 100 : 100;
    const subscribersGained = subscribersByDay.reduce((acc, curr) => acc + curr.count, 0);

    return {
      audience: {
        uniqueViewers: uniqueViewersData?.count || 0,
        subscribersGained,
        subscribedPercent,
        unsubscribedPercent
      },
      totalViews: statsInRange?.totalViews || 0,
      totalSubscribers: totalSubscribers?.count || 0,
      totalVideos: 0, // Not strictly needed for this view but keeping for consistency
      viewsByDay: viewsByDay.map(v => ({
        date: format(new Date(v.date), "d 'thg' M, yyyy", { locale: vi }),
        views: v.views,
      })),
      subscribersByDay: subscribersByDay.map(s => ({
        date: format(new Date(s.date), "dd/MM"),
        count: s.count,
      })),
      totalWatchTimeHours,
      realtime: await (async () => {
        const totalViews = await db.$count(videoViews, 
          and(
            inArray(videoViews.videoId, db.select({ id: videos.id }).from(videos).where(eq(videos.userId, userId))),
            gte(videoViews.createdAt, sql`NOW() - INTERVAL '48 hours'`)
          )
        );

        const topVideosInRange = await db
          .select({
            id: videos.id,
            title: videos.title,
            thumbnailUrl: videos.thumbnailUrl,
            viewsCount: sql<number>`CAST(COUNT(${videoViews.videoId}) AS INTEGER)`,
          })
          .from(videoViews)
          .innerJoin(videos, eq(videoViews.videoId, videos.id))
          .where(
            and(
              eq(videos.userId, userId),
              gte(videoViews.createdAt, sql`NOW() - INTERVAL '48 hours'`)
            )
          )
          .groupBy(videos.id)
          .orderBy(desc(sql`COUNT(${videoViews.videoId})`))
          .limit(3);

        const viewsByHourRaw = await db
          .select({
            hour: sql<string>`TO_CHAR(${videoViews.createdAt}, 'YYYY-MM-DD HH24:00')`,
            count: sql<number>`CAST(COUNT(*) AS INTEGER)`,
          })
          .from(videoViews)
          .innerJoin(videos, eq(videoViews.videoId, videos.id))
          .where(
            and(
              eq(videos.userId, userId),
              gte(videoViews.createdAt, sql`NOW() - INTERVAL '48 hours'`)
            )
          )
          .groupBy(sql`TO_CHAR(${videoViews.createdAt}, 'YYYY-MM-DD HH24:00')`)
          .orderBy(sql`TO_CHAR(${videoViews.createdAt}, 'YYYY-MM-DD HH24:00')`);

        const viewsByHour = [];
        for (let i = 47; i >= 0; i--) {
          const d = new Date();
          d.setUTCMinutes(0, 0, 0);
          d.setUTCHours(d.getUTCHours() - i);
          
          // Tạo string format YYYY-MM-DD HH:00 theo chuẩn UTC để khớp với DB
          const hourStr = d.toISOString().replace("T", " ").slice(0, 13) + ":00";
          const found = viewsByHourRaw.find(v => v.hour === hourStr);
          
          let label = "";
          if (i === 0) label = "Đang diễn ra";
          else if (i < 24) label = "Hôm nay";
          else label = "Hôm qua";

          const userTz = "Asia/Ho_Chi_Minh";

          viewsByHour.push({
            hour: formatInTimeZone(d, userTz, "HH:00"),
            fullLabel: `${label}, ${formatInTimeZone(d, userTz, "HH:00")}–${formatInTimeZone(new Date(d.getTime() + 3600000), userTz, "HH:00")}`,
            views: found ? found.count : 0,
          });
        }

        return {
          totalViews,
          topVideos: topVideosInRange,
          viewsByHour,
        };
      })(),
      latestVideo: topVideos[0] ? {
        ...topVideos[0],
        timeSincePosted: formatDistanceToNow(new Date(topVideos[0].createdAt), { locale: vi, addSuffix: true })
      } : null,
      topVideos: topVideos.map(v => ({
        ...v,
        averageViewPercent: Math.floor(Math.random() * 30) + 40,
        avgDurationLabel: "1:45",
      })),
      contentBreakdown: {
        views: {
          shorts: await db.$count(videoViews, and(inArray(videoViews.videoId, db.select({ id: videos.id }).from(videos).where(and(eq(videos.userId, userId), gt(videos.videoHeight, videos.videoWidth)))), gte(videoViews.createdAt, sql`NOW() - INTERVAL '1 day' * ${days}`))),
          video: await db.$count(videoViews, and(inArray(videoViews.videoId, db.select({ id: videos.id }).from(videos).where(and(eq(videos.userId, userId), or(lte(videos.videoHeight, videos.videoWidth), isNull(videos.videoHeight), isNull(videos.videoWidth))))), gte(videoViews.createdAt, sql`NOW() - INTERVAL '1 day' * ${days}`))),
          posts: await db.$count(postReactions, and(inArray(postReactions.postId, db.select({ id: posts.id }).from(posts).where(eq(posts.userId, userId))), gte(postReactions.createdAt, sql`NOW() - INTERVAL '1 day' * ${days}`))),
        },
        newViewers: {
          shorts: await db.$count(videoViews, and(inArray(videoViews.videoId, db.select({ id: videos.id }).from(videos).where(and(eq(videos.userId, userId), gt(videos.videoHeight, videos.videoWidth)))), gte(videoViews.createdAt, sql`NOW() - INTERVAL '1 day' * ${days}`))),
          video: await db.$count(videoViews, and(inArray(videoViews.videoId, db.select({ id: videos.id }).from(videos).where(and(eq(videos.userId, userId), or(lte(videos.videoHeight, videos.videoWidth), isNull(videos.videoHeight), isNull(videos.videoWidth))))), gte(videoViews.createdAt, sql`NOW() - INTERVAL '1 day' * ${days}`))),
          posts: await db.$count(postReactions, and(inArray(postReactions.postId, db.select({ id: posts.id }).from(posts).where(eq(posts.userId, userId))), gte(postReactions.createdAt, sql`NOW() - INTERVAL '1 day' * ${days}`))),
        },
        returningViewers: {
          shorts: 0,
          video: 0,
          posts: 0,
        },
        subscribers: {
          shorts: 0,
          video: totalSubscribers?.count || 0,
          posts: 0,
        },
        discovery: {
          impressions: (statsInRange?.totalViews || 0) * 12 + 100,
          ctr: (statsInRange?.totalViews || 0) > 0 ? 4.5 : 0,
          viewsFromImpressions: Math.floor((statsInRange?.totalViews || 0) * 0.7),
          avgViewDuration: "0:45",
          watchTimeFromImpressions: ((statsInRange?.totalViews || 0) * 0.7 * 45 / 3600).toFixed(2),
        },
        trafficSources: [
          { label: "YouTube Tìm kiếm", percentage: 45 },
          { label: "Các tính năng khác của YouTube", percentage: 30 },
          { label: "Trang video ngắn", percentage: 15 },
          { label: "Trực tiếp hoặc không xác định", percentage: 10 },
        ],
        publishedCount: {
          videos: await db.$count(videos, and(eq(videos.userId, userId), gte(videos.createdAt, sql`NOW() - INTERVAL '1 day' * ${days}`))),
          posts: await db.$count(posts, and(eq(posts.userId, userId), gte(posts.createdAt, sql`NOW() - INTERVAL '1 day' * ${days}`))),
        },
        shorts: {
          intentionalViews: Math.floor(await db.$count(videoViews, and(inArray(videoViews.videoId, db.select({ id: videos.id }).from(videos).where(and(eq(videos.userId, userId), gt(videos.videoHeight, videos.videoWidth)))))) * 0.8),
          likes: 2, // Mock for now or count videoReactions
          stayPercent: 83.3,
          swipePercent: 16.7,
          topShorts: await db
            .select({
              id: videos.id,
              title: videos.title,
              thumbnailUrl: videos.thumbnailUrl,
              viewsCount: videos.viewsCount,
            })
            .from(videos)
            .where(and(eq(videos.userId, userId), gt(videos.videoHeight, videos.videoWidth)))
            .orderBy(desc(videos.viewsCount))
            .limit(3),
        },
        postsBreakdown: await (async () => {
          const topPostsRaw = await db
            .select({
              id: posts.id,
              content: posts.content,
              type: posts.type,
              createdAt: posts.createdAt,
              likeCount: sql<number>`(SELECT COUNT(*) FROM ${postReactions} WHERE ${postReactions.postId} = ${posts.id} AND ${postReactions.type} = 'like')`,
              commentCount: sql<number>`(SELECT COUNT(*) FROM ${comments} WHERE ${comments.postId} = ${posts.id})`,
            })
            .from(posts)
            .where(eq(posts.userId, userId))
            .orderBy(desc(posts.createdAt))
            .limit(10);

          const postIds = topPostsRaw.map(p => p.id);
          
          let quizPostIds: string[] = [];
          if (postIds.length > 0) {
            const quizzes = await db
              .select({ postId: postPolls.postId })
              .from(postPolls)
              .innerJoin(postPollOptions, eq(postPolls.id, postPollOptions.pollId))
              .where(and(
                inArray(postPolls.postId, postIds),
                eq(postPollOptions.isCorrect, true)
              ));
            quizPostIds = quizzes.map((q: any) => q.postId);
          }

          const topPosts = topPostsRaw.map(p => ({
            ...p,
            type: (p.type === 'poll' && quizPostIds.includes(p.id)) ? 'question' : p.type
          }));

          return {
            topPosts,
            impressions: 4, // Mock or from a views table if exists
            likes: await db.$count(postReactions, and(inArray(postReactions.postId, db.select({ id: posts.id }).from(posts).where(eq(posts.userId, userId))), eq(postReactions.type, 'like'))),
            subscribers: 0,
          };
        })()
      }
    };
  }),
});
