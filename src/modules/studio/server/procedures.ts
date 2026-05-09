import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, or, lt, gt, lte, isNull, desc, getTableColumns } from "drizzle-orm";
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
        videoThumbnail: videos.thumbnailUrl, // thêm dòng này
        videoTitle: videos.title, // thêm dòng này
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .innerJoin(videos, eq(comments.videoId, videos.id))
      .where(eq(videos.userId, userId))
      .orderBy(desc(comments.createdAt))
      .limit(5)
      .execute();

    // Người đăng ký gần đây 5 cái
    const recentSubscribers = await db
      .select({
        viewerId: subscriptions.viewerId,
        name: users.name,
        avatarUrl: users.imageUrl,
      })
      .from(subscriptions)
      .innerJoin(users, eq(subscriptions.viewerId, users.id))
      .where(eq(subscriptions.creatorId, userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(5)
      .execute();

    return {
      totalSubscribers: totalSubscribers.length,
      latestComments,
      recentSubscribers,
    };
  }),

  getMany: protectedProcedure
    .input(
      z.object({
        cursor: z
          .object({ id: z.string().uuid(), createdAt: z.date() })
          .nullish(),
        limit: z.number().min(1).max(100),
        isShorts: z.boolean().optional(),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit, isShorts, sortOrder } = input;
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
          .select()
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
});
