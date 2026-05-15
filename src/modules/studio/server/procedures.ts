import { z } from "zod";
import { format, formatDistanceToNow } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { vi } from "date-fns/locale";
import { TRPCError } from "@trpc/server";
import {
  eq,
  and,
  or,
  lt,
  gt,
  lte,
  gte,
  isNull,
  isNotNull,
  desc,
  getTableColumns,
  sql,
  inArray,
} from "drizzle-orm";
import {
  subscriptions,
  comments,
  commentReactions,
  users,
  videoReactions,
  videos,
  videoViews,
  viewEvents,
  posts,
  postImages,
  postPolls,
  postPollOptions,
  postPollVotes,
  postReactions,
  channelModerations,
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
          eq(subscriptions.creatorId, users.id),
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
          and(
            eq(postReactions.postId, posts.id),
            eq(postReactions.type, "like"),
          ),
        ),
        commentCount: db.$count(comments, eq(comments.postId, posts.id)),
      })
      .from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt))
      .limit(1);

    let latestPostWithData = null;
    if (latestPost) {
      const images = await db
        .select()
        .from(postImages)
        .where(eq(postImages.postId, latestPost.id));
      const [poll] = await db
        .select()
        .from(postPolls)
        .where(eq(postPolls.postId, latestPost.id));

      let pollData = null;
      if (poll) {
        const options = await db
          .select()
          .from(postPollOptions)
          .where(eq(postPollOptions.pollId, poll.id));
        const optionsWithVotes = await Promise.all(
          options.map(async (opt) => {
            const voteCount = await db.$count(
              postPollVotes,
              eq(postPollVotes.optionId, opt.id),
            );
            return { ...opt, voteCount };
          }),
        );
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
      const {
        cursor,
        limit,
        isShorts,
        sortOrder,
        title,
        description,
        viewCount,
        visibility,
      } = input;
      const { id: userId } = ctx.user;

      // Lọc theo loại video (Shorts vs Regular)
      const typeFilter = isShorts
        ? gt(videos.videoHeight, videos.videoWidth)
        : or(
            lte(videos.videoHeight, videos.videoWidth),
            and(isNull(videos.videoHeight), isNull(videos.videoWidth)),
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
            title
              ? sql`LOWER(${videos.title}) LIKE LOWER(${`%${title}%`})`
              : undefined,
            description
              ? sql`LOWER(${videos.description}) LIKE LOWER(${`%${description}%`})`
              : undefined,
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
          sortOrder === "desc" ? desc(videos.id) : videos.id,
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
            and(
              eq(postReactions.postId, posts.id),
              eq(postReactions.type, "like"),
            ),
          ),
          commentCount: db.$count(comments, eq(comments.postId, posts.id)),
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
              eq(postPollVotes.optionId, postPollOptions.id),
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
    .input(
      z.object({
        query: z.string().optional(),
      }),
    )
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
          ),
        )
        .orderBy(desc(videos.createdAt))
        .limit(5);

      return data;
    }),

  getAnalytics: protectedProcedure
    .input(
      z.object({
        days: z.number().default(28),
        videoId: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const { days, videoId } = input;
      const userTz = "Asia/Ho_Chi_Minh";

      // 1. Chạy tất cả các câu truy vấn cơ bản song song
      const [
        [statsInRange],
        [totalSubscribersCount],
        viewsByDayRaw,
        watchTimeData,
        topVideosRaw,
        subscribersByDayRaw,
        [uniqueViewersData],
        viewsFromSubscribersData,
        [totalVideosData],
      ] = await Promise.all([
        db
          .select({
            totalViews: sql<number>`CAST(SUM(${videos.viewsCount}) AS INTEGER)`,
          })
          .from(videos)
          .where(
            and(
              eq(videos.userId, userId),
              videoId ? eq(videos.id, videoId) : undefined,
            ),
          ),
        db
          .select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
          .from(subscriptions)
          .where(eq(subscriptions.creatorId, userId)),
        db
          .select({
            date: sql<string>`DATE_TRUNC('day', ${viewEvents.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')`,
            views: sql<number>`CAST(COUNT(*) AS INTEGER)`,
          })
          .from(viewEvents)
          .innerJoin(videos, eq(viewEvents.videoId, videos.id))
          .where(
            and(
              eq(videos.userId, userId),
              videoId ? eq(videos.id, videoId) : undefined,
              days === 3650
                ? undefined
                : gte(
                    viewEvents.createdAt,
                    sql`NOW() - INTERVAL '1 day' * ${days}`,
                  ),
            ),
          )
          .groupBy(
            sql`DATE_TRUNC('day', ${viewEvents.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')`,
          )
          .orderBy(
            sql`DATE_TRUNC('day', ${viewEvents.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')`,
          ),
        db
          .select({ progress: videoViews.progress, duration: videos.duration })
          .from(videoViews)
          .innerJoin(videos, eq(videoViews.videoId, videos.id))
          .where(
            and(
              eq(videos.userId, userId),
              videoId ? eq(videos.id, videoId) : undefined,
              days === 3650
                ? undefined
                : gte(
                    videoViews.createdAt,
                    sql`NOW() - INTERVAL '1 day' * ${days}`,
                  ),
            ),
          ),
        db
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
          .where(
            and(
              eq(videos.userId, userId),
              videoId ? eq(videos.id, videoId) : undefined,
            ),
          )
          .orderBy(desc(videos.viewsCount))
          .limit(5),
        db
          .select({
            date: sql<string>`DATE_TRUNC('day', ${subscriptions.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')`,
            count: sql<number>`CAST(COUNT(*) AS INTEGER)`,
          })
          .from(subscriptions)
          .where(
            and(
              eq(subscriptions.creatorId, userId),
              days === 3650
                ? undefined
                : gte(
                    subscriptions.createdAt,
                    sql`NOW() - INTERVAL '1 day' * ${days}`,
                  ),
            ),
          )
          .groupBy(
            sql`DATE_TRUNC('day', ${subscriptions.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')`,
          )
          .orderBy(
            sql`DATE_TRUNC('day', ${subscriptions.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')`,
          ),
        db
          .select({ count: sql<number>`COUNT(DISTINCT ${viewEvents.userId})` })
          .from(viewEvents)
          .innerJoin(videos, eq(viewEvents.videoId, videos.id))
          .where(
            and(
              eq(videos.userId, userId),
              videoId ? eq(videos.id, videoId) : undefined,
              days === 3650
                ? undefined
                : gte(
                    viewEvents.createdAt,
                    sql`NOW() - INTERVAL '1 day' * ${days}`,
                  ),
              isNotNull(viewEvents.userId),
            ),
          ),
        db
          .select({
            isSubscribed: sql<boolean>`CASE WHEN ${subscriptions.viewerId} IS NOT NULL THEN true ELSE false END`,
            count: sql<number>`CAST(COUNT(*) AS INTEGER)`,
          })
          .from(viewEvents)
          .innerJoin(videos, eq(viewEvents.videoId, videos.id))
          .leftJoin(
            subscriptions,
            and(
              eq(subscriptions.creatorId, videos.userId),
              eq(subscriptions.viewerId, viewEvents.userId),
            ),
          )
          .where(
            and(
              eq(videos.userId, userId),
              videoId ? eq(videos.id, videoId) : undefined,
              days === 3650
                ? undefined
                : gte(
                    viewEvents.createdAt,
                    sql`NOW() - INTERVAL '1 day' * ${days}`,
                  ),
            ),
          )
          .groupBy(
            sql`CASE WHEN ${subscriptions.viewerId} IS NOT NULL THEN true ELSE false END`,
          ),
        db
          .select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
          .from(videos)
          .where(eq(videos.userId, userId)),
      ]);

      // 2. Tính toán Watch time
      const totalWatchTimeSec = watchTimeData.reduce(
        (acc, v) => acc + (v.duration * v.progress) / 100,
        0,
      );
      const totalWatchTimeHours = (totalWatchTimeSec / 3600).toFixed(1);

      // 3. Top videos với average view percent (song song)
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
          const avgDurationInSec = Math.floor(
            v.duration * (averageViewPercent / 100),
          );
          const mins = Math.floor(avgDurationInSec / 60);
          const secs = avgDurationInSec % 60;
          return {
            ...v,
            averageViewPercent,
            avgDurationLabel: `${mins}:${secs.toString().padStart(2, "0")}`,
          };
        }),
      );

      // 4. Subscriber growth tính toán
      let subscribedViews = 0;
      let unsubscribedViews = 0;
      viewsFromSubscribersData.forEach((r: any) => {
        if (r.isSubscribed) subscribedViews += Number(r.count);
        else unsubscribedViews += Number(r.count);
      });

      const totalAudienceViews = subscribedViews + unsubscribedViews;
      const subscribedPercent =
        totalAudienceViews > 0
          ? (subscribedViews / totalAudienceViews) * 100
          : 0;
      const unsubscribedPercent =
        totalAudienceViews > 0
          ? (unsubscribedViews / totalAudienceViews) * 100
          : 100;
      const subscribersGained = subscribersByDayRaw.reduce(
        (acc, curr) => acc + curr.count,
        0,
      );

      // 5. Realtime data (song song)
      const realtime = await (async () => {
        const totalViews = await db.$count(
          viewEvents,
          and(
            videoId
              ? eq(viewEvents.videoId, videoId)
              : inArray(
                  viewEvents.videoId,
                  db
                    .select({ id: videos.id })
                    .from(videos)
                    .where(eq(videos.userId, userId)),
                ),
            gte(viewEvents.createdAt, sql`NOW() - INTERVAL '48 hours'`),
          ),
        );
        const topVideosInRange = await db
          .select({
            id: videos.id,
            title: videos.title,
            thumbnailUrl: videos.thumbnailUrl,
            viewsCount: sql<number>`CAST(COUNT(${viewEvents.videoId}) AS INTEGER)`,
          })
          .from(viewEvents)
          .innerJoin(videos, eq(viewEvents.videoId, videos.id))
          .where(
            and(
              eq(videos.userId, userId),
              videoId ? eq(videos.id, videoId) : undefined,
              gte(viewEvents.createdAt, sql`NOW() - INTERVAL '48 hours'`),
            ),
          )
          .groupBy(videos.id)
          .orderBy(desc(sql`COUNT(${viewEvents.videoId})`))
          .limit(3);
        const viewsByHourRaw = await db
          .select({
            hour: sql<string>`TO_CHAR(${viewEvents.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD HH24:00')`,
            count: sql<number>`CAST(COUNT(*) AS INTEGER)`,
          })
          .from(viewEvents)
          .innerJoin(videos, eq(viewEvents.videoId, videos.id))
          .where(
            and(
              eq(videos.userId, userId),
              videoId ? eq(videos.id, videoId) : undefined,
              gte(viewEvents.createdAt, sql`NOW() - INTERVAL '48 hours'`),
            ),
          )
          .groupBy(
            sql`TO_CHAR(${viewEvents.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD HH24:00')`,
          )
          .orderBy(
            sql`TO_CHAR(${viewEvents.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD HH24:00')`,
          );

        const viewsByHour = [];
        const now = new Date();
        const todayStr = formatInTimeZone(now, userTz, "yyyy-MM-dd");
        const yesterdayStr = formatInTimeZone(
          new Date(now.getTime() - 24 * 60 * 60 * 1000),
          userTz,
          "yyyy-MM-dd",
        );

        for (let i = 47; i >= 0; i--) {
          const d = new Date();
          d.setUTCMinutes(0, 0, 0);
          d.setUTCHours(d.getUTCHours() - i);

          const hourStr = formatInTimeZone(d, userTz, "yyyy-MM-dd HH:00");
          const found = viewsByHourRaw.find((v) => v.hour === hourStr);

          const dateStr = formatInTimeZone(d, userTz, "yyyy-MM-dd");
          let dayLabel = "";

          if (i === 0) {
            dayLabel = "Ongoing";
          } else if (dateStr === todayStr) {
            dayLabel = "Today";
          } else if (dateStr === yesterdayStr) {
            dayLabel = "Yesterday";
          } else {
            dayLabel = formatInTimeZone(d, userTz, "MMM d");
          }

          const startHour = formatInTimeZone(d, userTz, "HH:00");
          const endHour = formatInTimeZone(
            new Date(d.getTime() + 3600000),
            userTz,
            "HH:00",
          );

          viewsByHour.push({
            hour: startHour,
            fullLabel: `${dayLabel}, ${startHour}–${endHour}`,
            views: found ? found.count : 0,
          });
        }
        return { totalViews, topVideos: topVideosInRange, viewsByHour };
      })();

      // 6. Tính toán Engagement summary cho tab Engagement
      const engagement = await (async () => {
        // Like trong khoảng thời gian
        const [likesInRange] = await db
          .select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
          .from(videoReactions)
          .innerJoin(videos, eq(videoReactions.videoId, videos.id))
          .where(
            and(
              eq(videos.userId, userId),
              eq(videoReactions.type, "like"),
              videoId ? eq(videos.id, videoId) : undefined,
              gte(
                videoReactions.createdAt,
                sql`NOW() - INTERVAL '1 day' * ${days}`,
              ),
            ),
          );

        // Like trung bình của kênh (Toàn bộ thời gian)
        const [allTimeLikes] = await db
          .select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
          .from(videoReactions)
          .innerJoin(videos, eq(videoReactions.videoId, videos.id))
          .where(
            and(eq(videos.userId, userId), eq(videoReactions.type, "like")),
          );

        const totalLikes = likesInRange?.count || 0;
        const totalViewsInRange = statsInRange?.totalViews || 0;
        const likePercent =
          totalViewsInRange > 0 ? (totalLikes / totalViewsInRange) * 100 : 0;

        const channelTotalLikes = allTimeLikes?.count || 0;
        const channelTotalViews =
          (
            await db
              .select({
                total: sql<number>`CAST(SUM(${videos.viewsCount}) AS INTEGER)`,
              })
              .from(videos)
              .where(eq(videos.userId, userId))
          )[0]?.total || 1;
        const channelLikePercent =
          (channelTotalLikes / channelTotalViews) * 100;

        // Average view percent của video hàng đầu (lấy cái đầu tiên làm đại diện)
        const avgViewPercent = topVideos[0]?.averageViewPercent || 0;

        return {
          avgViewPercent,
          likePercent: Number(likePercent.toFixed(1)),
          channelLikePercent: Number(channelLikePercent.toFixed(1)),
        };
      })();

      const shortsViewsBreakdown =
        (
          await db
            .select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
            .from(viewEvents)
            .innerJoin(videos, eq(viewEvents.videoId, videos.id))
            .where(
              and(
                videoId
                  ? eq(videos.id, videoId)
                  : eq(videos.userId, userId),
                gt(videos.videoHeight, videos.videoWidth),
                gte(
                  viewEvents.createdAt,
                  sql`NOW() - INTERVAL '1 day' * ${days}`,
                ),
              ),
            )
        )[0]?.count || 0;

      const videoViewsBreakdown =
        (
          await db
            .select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
            .from(viewEvents)
            .innerJoin(videos, eq(viewEvents.videoId, videos.id))
            .where(
              and(
                videoId
                  ? eq(videos.id, videoId)
                  : eq(videos.userId, userId),
                or(
                  lte(videos.videoHeight, videos.videoWidth),
                  isNull(videos.videoHeight),
                  isNull(videos.videoWidth),
                ),
                gte(
                  viewEvents.createdAt,
                  sql`NOW() - INTERVAL '1 day' * ${days}`,
                ),
              ),
            )
        )[0]?.count || 0;

      const postsViewsBreakdown = await db.$count(
        postReactions,
        and(
          inArray(
            postReactions.postId,
            db
              .select({ id: posts.id })
              .from(posts)
              .where(
                and(
                  eq(posts.userId, userId),
                  videoId ? eq(posts.videoId, videoId) : undefined,
                ),
              ),
          ),
          gte(
            postReactions.createdAt,
            sql`NOW() - INTERVAL '1 day' * ${days}`,
          ),
        ),
      );

      const totalViewsBreakdown = shortsViewsBreakdown + videoViewsBreakdown;
      const shortsRatio = totalViewsBreakdown > 0 ? shortsViewsBreakdown / totalViewsBreakdown : 0;
      const videoRatio = totalViewsBreakdown > 0 ? videoViewsBreakdown / totalViewsBreakdown : (totalViewsBreakdown === 0 ? 1 : 0);

      const totalUniqueViewers = uniqueViewersData?.count || 0;
      const totalReturning = Math.max(0, (statsInRange?.totalViews || 0) - totalUniqueViewers);
      const totalSubsCount = totalSubscribersCount?.count || 0;
      
      const impressionsTotal = Math.floor((statsInRange?.totalViews || 0) * 12 + 100);
      const ctrCalc = impressionsTotal > 0 ? ((statsInRange?.totalViews || 0) / impressionsTotal) * 100 : 0;
      const avgSec = (statsInRange?.totalViews || 0) > 0 ? Math.floor(totalWatchTimeSec / (statsInRange?.totalViews || 1)) : 0;
      const watchTimeFromImp = ((statsInRange?.totalViews || 0) * 0.7 * avgSec) / 3600;

      const searchPct = (statsInRange?.totalViews || 0) > 0 ? Math.round((1 - shortsRatio) * 50) : 0;
      const otherPct = (statsInRange?.totalViews || 0) > 0 ? Math.round((1 - shortsRatio) * 30) : 0;
      const shortsFeedPct = (statsInRange?.totalViews || 0) > 0 ? Math.round(shortsRatio * 100) : 0;
      const directPct = (statsInRange?.totalViews || 0) > 0 ? 100 - searchPct - otherPct - shortsFeedPct : 0;

      const shortsLikes = await db.$count(
        videoReactions,
        and(
          inArray(
            videoReactions.videoId,
            db
              .select({ id: videos.id })
              .from(videos)
              .where(
                and(
                  eq(videos.userId, userId),
                  videoId ? eq(videos.id, videoId) : undefined,
                  gt(videos.videoHeight, videos.videoWidth),
                ),
              ),
          ),
          eq(videoReactions.type, "like"),
          gte(
            videoReactions.createdAt,
            sql`NOW() - INTERVAL '1 day' * ${days}`,
          ),
        ),
      );

      return {
        audience: {
          uniqueViewers: uniqueViewersData?.count || 0,
          subscribersGained,
          subscribedPercent,
          unsubscribedPercent,
        },
        totalViews: statsInRange?.totalViews || 0,
        totalSubscribers: totalSubscribersCount?.count || 0,
        totalVideos: totalVideosData?.count || 0,
        viewsByDay: (() => {
          const totalViews = statsInRange?.totalViews || 0;
          const totalViewsInChart = viewsByDayRaw.reduce(
            (acc, curr) => acc + curr.views,
            0,
          );
          const watchTimePerView =
            totalViews > 0 ? Number(totalWatchTimeHours) / totalViews : 0;

          let cumulativeImpressions = 0;
          const baseImpressionsTotal = 100;
          const baseImpressionsPerDay = baseImpressionsTotal / days;

          const missingViews = Math.max(0, totalViews - totalViewsInChart);

          return Array.from({ length: days }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (days - 1 - i));
            const formattedDate = formatInTimeZone(d, userTz, "MMM d, yyyy");
            const dbEntry = viewsByDayRaw.find(
              (v) =>
                formatInTimeZone(new Date(v.date), userTz, "MMM d, yyyy") ===
                formattedDate,
            );

            const realViews = dbEntry ? dbEntry.views : 0;
            const simulatedViews =
              (missingViews / days) * (1 + (i - days / 2) / days);
            const effectiveViews = realViews + simulatedViews;

            const dailyImpressions =
              effectiveViews * 12 + baseImpressionsPerDay;
            cumulativeImpressions += dailyImpressions;

            const watchTime = effectiveViews * watchTimePerView;

            return {
              date: formattedDate,
              views: Math.floor(effectiveViews),
              watchTime: Number(watchTime.toFixed(2)),
              impressions: Math.floor(cumulativeImpressions),
            };
          });
        })(),
        subscribersByDay: Array.from({ length: days }).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (days - 1 - i));
          const formattedDate = formatInTimeZone(d, userTz, "dd/MM");
          const dbEntry = subscribersByDayRaw.find(
            (s) =>
              formatInTimeZone(new Date(s.date), userTz, "dd/MM") ===
              formattedDate,
          );
          return { date: formattedDate, count: dbEntry ? dbEntry.count : 0 };
        }),
        totalWatchTimeHours,
        realtime,
        engagement,
        latestVideo: topVideos[0]
          ? {
              ...topVideos[0],
              timeSincePosted: formatDistanceToNow(
                new Date(topVideos[0].createdAt),
                { addSuffix: true },
              ),
            }
          : null,
        topVideos: topVideos.map((v) => ({
          ...v,
        })),
        contentBreakdown: {
          views: {
            shorts: shortsViewsBreakdown,
            video: videoViewsBreakdown,
            posts: postsViewsBreakdown,
          },
          newViewers: {
            shorts: shortsViewsBreakdown,
            video: videoViewsBreakdown,
            posts: postsViewsBreakdown,
          },
          returningViewers: {
            shorts: Math.floor(totalReturning * shortsRatio),
            video: Math.ceil(totalReturning * videoRatio),
            posts: 0,
          },
          subscribers: {
            shorts: Math.floor(totalSubsCount * shortsRatio),
            video: Math.ceil(totalSubsCount * videoRatio),
            posts: 0,
          },
          discovery: {
            impressions: impressionsTotal,
            ctr: Number(ctrCalc.toFixed(1)),
            viewsFromImpressions: Math.floor(
              (statsInRange?.totalViews || 0) * 0.7,
            ),
            avgViewDuration: `${Math.floor(avgSec / 60)}:${(avgSec % 60).toString().padStart(2, "0")}`,
            watchTimeFromImpressions: watchTimeFromImp.toFixed(2),
          },
          trafficSources: [
            {
              label: "trafficSourceYoutubeSearch",
              percentage: searchPct,
            },
            {
              label: "trafficSourceOtherFeatures",
              percentage: otherPct,
            },
            {
              label: "trafficSourceShortsFeed",
              percentage: shortsFeedPct,
            },
            {
              label: "trafficSourceDirect",
              percentage: directPct,
            },
          ],
          publishedCount: {
            videos: await db.$count(
              videos,
              and(
                eq(videos.userId, userId),
                videoId ? eq(videos.id, videoId) : undefined,
                gte(videos.createdAt, sql`NOW() - INTERVAL '1 day' * ${days}`),
              ),
            ),
            posts: await db.$count(
              posts,
              and(
                eq(posts.userId, userId),
                videoId ? eq(posts.videoId, videoId) : undefined,
                gte(posts.createdAt, sql`NOW() - INTERVAL '1 day' * ${days}`),
              ),
            ),
          },
          shorts: {
            intentionalViews: Math.floor(shortsViewsBreakdown * 0.8),
            likes: shortsLikes,
            stayPercent: shortsViewsBreakdown > 0 ? 83.3 : 0,
            swipePercent: shortsViewsBreakdown > 0 ? 16.7 : 0,
            topShorts: await db
              .select({
                id: videos.id,
                title: videos.title,
                thumbnailUrl: videos.thumbnailUrl,
                viewsCount: videos.viewsCount,
              })
              .from(videos)
              .where(
                and(
                  eq(videos.userId, userId),
                  videoId
                    ? eq(videos.id, videoId)
                    : gt(videos.videoHeight, videos.videoWidth),
                ),
              )
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
              .where(
                and(
                  eq(posts.userId, userId),
                  videoId ? eq(posts.videoId, videoId) : undefined,
                ),
              )
              .orderBy(desc(posts.createdAt))
              .limit(10);

            const postIds = topPostsRaw.map((p) => p.id);

            let quizPostIds: string[] = [];
            if (postIds.length > 0) {
              const quizzes = await db
                .select({ postId: postPolls.postId })
                .from(postPolls)
                .innerJoin(
                  postPollOptions,
                  eq(postPolls.id, postPollOptions.pollId),
                )
                .where(
                  and(
                    inArray(postPolls.postId, postIds),
                    eq(postPollOptions.isCorrect, true),
                  ),
                );
              quizPostIds = quizzes.map((q: any) => q.postId);
            }

            const topPosts = topPostsRaw.map((p) => ({
              ...p,
              type:
                p.type === "poll" && quizPostIds.includes(p.id)
                  ? "question"
                  : p.type,
            }));

            const postImpressions = await db.$count(
              posts,
              and(
                eq(posts.userId, userId),
                videoId ? eq(posts.videoId, videoId) : undefined,
                gte(posts.createdAt, sql`NOW() - INTERVAL '1 day' * ${days}`)
              )
            ) * 100;

            return {
              topPosts,
              impressions: postImpressions,
              likes: await db.$count(
                postReactions,
                and(
                  inArray(
                    postReactions.postId,
                    db
                      .select({ id: posts.id })
                      .from(posts)
                      .where(
                        and(
                          eq(posts.userId, userId),
                          videoId ? eq(posts.videoId, videoId) : undefined,
                        ),
                      ),
                  ),
                  eq(postReactions.type, "like"),
                ),
              ),
              subscribers: 0,
            };
          })(),
        },
      };
    }),

  getCommunityComments: protectedProcedure
    .input(
      z.object({
        cursor: z
          .object({ id: z.string().uuid(), createdAt: z.date() })
          .nullish(),
        limit: z.number().min(1).max(100).default(20),
        sortBy: z.enum(["newest", "top"]).default("newest"),
        status: z.enum(["published", "held"]).default("published"),
        keyword: z.string().optional(),
        containsQuestions: z.boolean().optional(),
        contentTypes: z.array(z.string()).optional(),
        responseStatuses: z.array(z.string()).optional(),
        minSubscribers: z.number().optional(),
        videoId: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const {
        cursor,
        limit,
        sortBy,
        status,
        keyword,
        containsQuestions,
        contentTypes,
        responseStatuses,
        minSubscribers,
        videoId,
      } = input;

      const repliesCount = db.$with("replies_count").as(
        db
          .select({
            parentId: comments.parentId,
            count: sql<number>`CAST(COUNT(*) AS INTEGER)`.as("count"),
          })
          .from(comments)
          .where(isNotNull(comments.parentId))
          .groupBy(comments.parentId),
      );

      const score = sql<number>`
        (
          (
            SELECT COUNT(*) FROM ${commentReactions}
            WHERE ${commentReactions.commentId} = ${comments.id}
            AND ${commentReactions.type} = 'like'
          ) * 2
        )
        +
        (
          SELECT COUNT(*) FROM ${comments} c2
          WHERE c2.parent_id = ${comments.id}
        )
      `;

      // Giả lập trạng thái "Bị giữ lại" bằng cách trả về rỗng nếu status === 'held' (chưa có cột này trong DB)
      if (status === "held") {
        return { totalCount: 0, items: [], nextCursor: null };
      }

      // Base filters
      const conditions = [
        videoId
          ? eq(comments.videoId, videoId)
          : or(
              inArray(
                comments.videoId,
                db
                  .select({ id: videos.id })
                  .from(videos)
                  .where(eq(videos.userId, userId)),
              ),
              inArray(
                comments.postId,
                db
                  .select({ id: posts.id })
                  .from(posts)
                  .where(eq(posts.userId, userId)),
              ),
            ),
        isNull(comments.parentId),
      ];

      // Filter by keyword
      if (keyword) {
        conditions.push(
          sql`LOWER(${comments.value}) LIKE LOWER(${`%${keyword}%`})`,
        );
      }

      // Filter by questions
      if (containsQuestions) {
        conditions.push(
          or(
            sql`${comments.value} LIKE '%?%'`,
            // Vietnamese
            sql`LOWER(${comments.value}) LIKE '% sao%'`,
            sql`LOWER(${comments.value}) LIKE '% gì%'`,
            sql`LOWER(${comments.value}) LIKE '% đâu%'`,
            sql`LOWER(${comments.value}) LIKE '% không%'`,
            sql`LOWER(${comments.value}) LIKE '% bao giờ%'`,
            sql`LOWER(${comments.value}) LIKE '% nào%'`,
            sql`LOWER(${comments.value}) LIKE '% thế nào%'`,
            sql`LOWER(${comments.value}) LIKE '% tại sao%'`,
            sql`LOWER(${comments.value}) LIKE '% vì sao%'`,
            sql`LOWER(${comments.value}) LIKE '% khi nào%'`,
            sql`LOWER(${comments.value}) LIKE '% ai%'`,
            sql`LOWER(${comments.value}) LIKE '% chưa%'`,
            sql`LOWER(${comments.value}) LIKE '% hả%'`,
            sql`LOWER(${comments.value}) LIKE '% à%'`,
            sql`LOWER(${comments.value}) LIKE '% chứ%'`,
            sql`LOWER(${comments.value}) LIKE '% nhỉ%'`,
            sql`LOWER(${comments.value}) LIKE '% nhể%'`,
            sql`LOWER(${comments.value}) LIKE '% vậy%'`,
            // German
            sql`LOWER(${comments.value}) LIKE '% was%'`,
            sql`LOWER(${comments.value}) LIKE '% wie%'`,
            sql`LOWER(${comments.value}) LIKE '% warum%'`,
            sql`LOWER(${comments.value}) LIKE '% wieso%'`,
            sql`LOWER(${comments.value}) LIKE '% wann%'`,
            sql`LOWER(${comments.value}) LIKE '% wo%'`,
            sql`LOWER(${comments.value}) LIKE '% wer%'`,
            sql`LOWER(${comments.value}) LIKE '% welche%'`,
            sql`LOWER(${comments.value}) LIKE '% kann%'`,
            sql`LOWER(${comments.value}) LIKE '% ist%'`,
            sql`LOWER(${comments.value}) LIKE '% sind%'`,

            // Spanish
            sql`LOWER(${comments.value}) LIKE '% qué%'`,
            sql`LOWER(${comments.value}) LIKE '% como%'`,
            sql`LOWER(${comments.value}) LIKE '% cómo%'`,
            sql`LOWER(${comments.value}) LIKE '% por qué%'`,
            sql`LOWER(${comments.value}) LIKE '% cuándo%'`,
            sql`LOWER(${comments.value}) LIKE '% dónde%'`,
            sql`LOWER(${comments.value}) LIKE '% quién%'`,
            sql`LOWER(${comments.value}) LIKE '% cuál%'`,
            sql`LOWER(${comments.value}) LIKE '% puede%'`,
            sql`LOWER(${comments.value}) LIKE '% es%'`,
            sql`LOWER(${comments.value}) LIKE '% son%'`,

            // French
            sql`LOWER(${comments.value}) LIKE '% quoi%'`,
            sql`LOWER(${comments.value}) LIKE '% comment%'`,
            sql`LOWER(${comments.value}) LIKE '% pourquoi%'`,
            sql`LOWER(${comments.value}) LIKE '% quand%'`,
            sql`LOWER(${comments.value}) LIKE '% où%'`,
            sql`LOWER(${comments.value}) LIKE '% qui%'`,
            sql`LOWER(${comments.value}) LIKE '% quel%'`,
            sql`LOWER(${comments.value}) LIKE '% quelle%'`,
            sql`LOWER(${comments.value}) LIKE '% est-ce%'`,
            sql`LOWER(${comments.value}) LIKE '% peut%'`,
            sql`LOWER(${comments.value}) LIKE '% sont%'`,

            // Japanese
            sql`${comments.value} LIKE '%？%'`,
            sql`${comments.value} LIKE '%ですか%'`,
            sql`${comments.value} LIKE '%ますか%'`,
            sql`${comments.value} LIKE '%なぜ%'`,
            sql`${comments.value} LIKE '%どうして%'`,
            sql`${comments.value} LIKE '%いつ%'`,
            sql`${comments.value} LIKE '%どこ%'`,
            sql`${comments.value} LIKE '%誰%'`,
            sql`${comments.value} LIKE '%何%'`,
            sql`${comments.value} LIKE '%どうやって%'`,

            // Korean
            sql`${comments.value} LIKE '%?%'`,
            sql`${comments.value} LIKE '%왜%'`,
            sql`${comments.value} LIKE '%어떻게%'`,
            sql`${comments.value} LIKE '%언제%'`,
            sql`${comments.value} LIKE '%어디%'`,
            sql`${comments.value} LIKE '%누구%'`,
            sql`${comments.value} LIKE '%무엇%'`,
            sql`${comments.value} LIKE '%뭐%'`,
            sql`${comments.value} LIKE '%인가요%'`,
            sql`${comments.value} LIKE '%있나요%'`,
            sql`${comments.value} LIKE '%할까요%'`,

            // Chinese
            sql`${comments.value} LIKE '%？%'`,
            sql`${comments.value} LIKE '%吗%'`,
            sql`${comments.value} LIKE '%为什么%'`,
            sql`${comments.value} LIKE '%怎么%'`,
            sql`${comments.value} LIKE '%怎样%'`,
            sql`${comments.value} LIKE '%什么时候%'`,
            sql`${comments.value} LIKE '%哪里%'`,
            sql`${comments.value} LIKE '%谁%'`,
            sql`${comments.value} LIKE '%什么%'`,
            sql`${comments.value} LIKE '%可以%'`,
            sql`${comments.value} LIKE '%是不是%'`,
            // English
            sql`LOWER(${comments.value}) LIKE 'what%'`,
            sql`LOWER(${comments.value}) LIKE 'how%'`,
            sql`LOWER(${comments.value}) LIKE 'why%'`,
            sql`LOWER(${comments.value}) LIKE 'when%'`,
            sql`LOWER(${comments.value}) LIKE 'where%'`,
            sql`LOWER(${comments.value}) LIKE 'who%'`,
            sql`LOWER(${comments.value}) LIKE 'which%'`,
            sql`LOWER(${comments.value}) LIKE 'can %'`,
            sql`LOWER(${comments.value}) LIKE 'could %'`,
            sql`LOWER(${comments.value}) LIKE 'is %'`,
            sql`LOWER(${comments.value}) LIKE 'are %'`,
            sql`LOWER(${comments.value}) LIKE 'do %'`,
            sql`LOWER(${comments.value}) LIKE 'does %'`,
            sql`LOWER(${comments.value}) LIKE 'did %'`,
          ),
        );
      }

      // Filter by content types
      if (contentTypes && contentTypes.length > 0) {
        const typeConditions = [];
        if (contentTypes.includes("video"))
          typeConditions.push(isNotNull(comments.videoId));
        if (contentTypes.includes("shorts")) {
          // Shorts logic: joined video is a short
          typeConditions.push(
            inArray(
              comments.videoId,
              db
                .select({ id: videos.id })
                .from(videos)
                .where(
                  and(
                    eq(videos.userId, userId),
                    gt(videos.videoHeight, videos.videoWidth),
                  ),
                ),
            ),
          );
        }
        if (
          contentTypes.includes("my-posts") ||
          contentTypes.includes("viewer-posts")
        ) {
          typeConditions.push(isNotNull(comments.postId));
        }
        conditions.push(or(...typeConditions) as any);
      }

      // Filter by response statuses (Approximate for now)
      if (responseStatuses && responseStatuses.length > 0) {
        if (responseStatuses.includes("not-responded")) {
          // No replies at all (simplification)
          conditions.push(
            sql`NOT EXISTS (SELECT 1 FROM ${comments} c2 WHERE c2.parent_id = ${comments.id})`,
          );
        } else if (responseStatuses.includes("responded")) {
          // Has replies
          conditions.push(
            sql`EXISTS (SELECT 1 FROM ${comments} c2 WHERE c2.parent_id = ${comments.id})`,
          );
        }
      }

      // Filter by subscribers
      if (minSubscribers !== undefined) {
        conditions.push(
          inArray(
            comments.userId,
            db
              .select({ userId: subscriptions.creatorId })
              .from(subscriptions)
              .groupBy(subscriptions.creatorId)
              .having(sql`count(*) >= ${minSubscribers}`),
          ),
        );
      }

      const whereClause = and(
        ...conditions,
        cursor
          ? or(
              lt(comments.createdAt, cursor.createdAt),
              and(
                eq(comments.createdAt, cursor.createdAt),
                lt(comments.id, cursor.id),
              ),
            )
          : undefined,
      );

      const viewerReactions = db.$with("viewer_reactions").as(
        db
          .select({
            commentId: commentReactions.commentId,
            type: commentReactions.type,
          })
          .from(commentReactions)
          .where(eq(commentReactions.userId, userId)),
      );

      const [totalData, data] = await Promise.all([
        db
          .select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
          .from(comments)
          .where(and(...conditions)),

        db
          .with(repliesCount, viewerReactions)
          .select({
            ...getTableColumns(comments),
            user: users,
            replyCount: repliesCount.count,
            viewerReaction: viewerReactions.type,
            score,
            likeCount: db.$count(
              commentReactions,
              and(
                eq(commentReactions.type, "like"),
                eq(commentReactions.commentId, comments.id),
              ),
            ),
            dislikeCount: db.$count(
              commentReactions,
              and(
                eq(commentReactions.type, "dislike"),
                eq(commentReactions.commentId, comments.id),
              ),
            ),
            videoTitle: videos.title,
            videoThumbnail: videos.thumbnailUrl,
            postContent: posts.content,
            moderationType: channelModerations.type,
          })
          .from(comments)
          .where(whereClause)
          .innerJoin(users, eq(comments.userId, users.id))
          .leftJoin(videos, eq(comments.videoId, videos.id))
          .leftJoin(posts, eq(comments.postId, posts.id))
          .leftJoin(
            channelModerations,
            and(
              eq(channelModerations.viewerId, comments.userId),
              eq(channelModerations.creatorId, userId),
            ),
          )
          .leftJoin(repliesCount, eq(comments.id, repliesCount.parentId))
          .leftJoin(viewerReactions, eq(comments.id, viewerReactions.commentId))
          .orderBy(
            ...(sortBy === "newest"
              ? [desc(comments.createdAt), desc(comments.id)]
              : [desc(score), desc(comments.createdAt), desc(comments.id)]),
          )
          .limit(limit + 1),
      ]);

      const hasMore = data.length > limit;
      const items = hasMore ? data.slice(0, -1) : data;
      const lastItem = items[items.length - 1];

      return {
        totalCount: totalData[0].count,
        items,
        nextCursor: hasMore
          ? { id: lastItem.id, createdAt: lastItem.createdAt }
          : null,
      };
    }),

  setModerationStatus: protectedProcedure
    .input(
      z.object({
        viewerId: z.string().uuid(),
        type: z
          .enum(["hidden", "approved", "manager_mod", "standard_mod"])
          .nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id: creatorId } = ctx.user;
      const { viewerId, type } = input;

      if (creatorId === viewerId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot moderate yourself",
        });
      }

      if (type === null) {
        // Remove moderation status
        await db
          .delete(channelModerations)
          .where(
            and(
              eq(channelModerations.creatorId, creatorId),
              eq(channelModerations.viewerId, viewerId),
            ),
          );
      } else {
        // Upsert moderation status
        await db
          .insert(channelModerations)
          .values({
            creatorId,
            viewerId,
            type,
          })
          .onConflictDoUpdate({
            target: [channelModerations.creatorId, channelModerations.viewerId],
            set: { type, updatedAt: new Date() },
          });
      }

      return { success: true };
    }),
});
