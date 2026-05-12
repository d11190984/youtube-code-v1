import { z } from "zod";
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  inArray,
  isNotNull,
  isNull,
  lt,
  or,
  sql,
} from "drizzle-orm";

import { db } from "@/db";
import { TRPCError } from "@trpc/server";
import { commentReactions, comments, users, videos, posts, notifications } from "@/db/schema";
import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/trpc/init";

export const commentsRouter = createTRPCRouter({
  removeMany: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.string().uuid()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { ids } = input;
      const { id: userId } = ctx.user;

      const commentsToDelete = await db
        .select({ id: comments.id })
        .from(comments)
        .leftJoin(videos, eq(comments.videoId, videos.id))
        .leftJoin(posts, eq(comments.postId, posts.id))
        .where(
          and(
            inArray(comments.id, ids),
            or(
              eq(comments.userId, userId),
              eq(videos.userId, userId),
              eq(posts.userId, userId)
            )
          )
        );

      const validIds = commentsToDelete.map(c => c.id);

      if (validIds.length === 0) {
        return { count: 0 };
      }

      await db.delete(comments).where(inArray(comments.id, validIds));

      return { count: validIds.length };
    }),
  remove: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      const { id: userId } = ctx.user;

      const [comment] = await db
        .select({
           commentUserId: comments.userId,
           videoUserId: videos.userId,
           postUserId: posts.userId,
        })
        .from(comments)
        .leftJoin(videos, eq(comments.videoId, videos.id))
        .leftJoin(posts, eq(comments.postId, posts.id))
        .where(eq(comments.id, id));

      if (!comment) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const isContentOwner = 
        (comment.videoUserId && comment.videoUserId === userId) || 
        (comment.postUserId && comment.postUserId === userId);

      if (comment.commentUserId !== userId && !isContentOwner) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [deletedComment] = await db
        .delete(comments)
        .where(eq(comments.id, id))
        .returning();

      return deletedComment;
    }),
  pin: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      const { id: userId } = ctx.user;

      const [comment] = await db
        .select({
           videoId: comments.videoId,
           postId: comments.postId,
           isPinned: comments.isPinned,
           videoUserId: videos.userId,
           postUserId: posts.userId,
        })
        .from(comments)
        .leftJoin(videos, eq(comments.videoId, videos.id))
        .leftJoin(posts, eq(comments.postId, posts.id))
        .where(eq(comments.id, id));

      if (!comment) throw new TRPCError({ code: "NOT_FOUND" });
      
      const isContentOwner = 
        (comment.videoUserId && comment.videoUserId === userId) || 
        (comment.postUserId && comment.postUserId === userId);

      if (!isContentOwner) throw new TRPCError({ code: "FORBIDDEN" });

      if (comment.isPinned) {
        const [updatedComment] = await db.update(comments)
          .set({ isPinned: false })
          .where(eq(comments.id, id))
          .returning();
        return updatedComment;
      } else {
        // Unpin all other comments for this video/post
        if (comment.videoId) {
          await db.update(comments)
            .set({ isPinned: false })
            .where(eq(comments.videoId, comment.videoId));
        } else if (comment.postId) {
          await db.update(comments)
            .set({ isPinned: false })
            .where(eq(comments.postId, comment.postId));
        }

        const [updatedComment] = await db.update(comments)
          .set({ isPinned: true })
          .where(eq(comments.id, id))
          .returning();
        return updatedComment;
      }
    }),
  heart: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      const { id: userId } = ctx.user;

      const [comment] = await db
        .select({
           creatorHearted: comments.creatorHearted,
           videoUserId: videos.userId,
           postUserId: posts.userId,
        })
        .from(comments)
        .leftJoin(videos, eq(comments.videoId, videos.id))
        .leftJoin(posts, eq(comments.postId, posts.id))
        .where(eq(comments.id, id));

      if (!comment) throw new TRPCError({ code: "NOT_FOUND" });
      
      const isContentOwner = 
        (comment.videoUserId && comment.videoUserId === userId) || 
        (comment.postUserId && comment.postUserId === userId);

      if (!isContentOwner) throw new TRPCError({ code: "FORBIDDEN" });

      const [updatedComment] = await db.update(comments)
        .set({ creatorHearted: !comment.creatorHearted })
        .where(eq(comments.id, id))
        .returning();
      return updatedComment;
    }),
  create: protectedProcedure
    .input(
      z.object({
        parentId: z.string().uuid().nullish(),
        videoId: z.string().uuid().nullish(),
        postId: z.string().uuid().nullish(),
        value: z.string(),
        imageUrl: z.string().url().nullish(),
        timestamp: z.number().nullish(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { parentId, videoId, postId, value, imageUrl, timestamp } = input;
      const { id: userId } = ctx.user;

      if (!videoId && !postId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "videoId or postId is required" });
      }

      const [existingComment] = await db
        .select()
        .from(comments)
        .where(inArray(comments.id, parentId ? [parentId] : []));

      if (!existingComment && parentId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (existingComment?.parentId && parentId) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      const [createdComment] = await db
        .insert(comments)
        .values({ userId, videoId, postId, parentId, value, imageUrl, timestamp })
        .returning();

      if (createdComment) {
        // 1. If it's a reply, notify the parent comment owner
        if (parentId) {
          const [parentComment] = await db
            .select({ userId: comments.userId })
            .from(comments)
            .where(eq(comments.id, parentId));

          if (parentComment && parentComment.userId !== userId) {
            await db.insert(notifications).values({
              userId: parentComment.userId,
              actorId: userId,
              type: "comment_reply",
              videoId: videoId || undefined,
              postId: postId || undefined,
              commentId: createdComment.id,
            });
          }
        } 
        // 2. If it's a new comment, notify the content owner
        else {
          let contentOwnerId: string | undefined;

          if (videoId) {
            const [video] = await db
              .select({ userId: videos.userId })
              .from(videos)
              .where(eq(videos.id, videoId));
            contentOwnerId = video?.userId;
          } else if (postId) {
            const [post] = await db
              .select({ userId: posts.userId })
              .from(posts)
              .where(eq(posts.id, postId));
            contentOwnerId = post?.userId;
          }

          if (contentOwnerId && contentOwnerId !== userId) {
            await db.insert(notifications).values({
              userId: contentOwnerId,
              actorId: userId,
              type: videoId ? "video_comment" : "post_comment",
              videoId: videoId || undefined,
              postId: postId || undefined,
              commentId: createdComment.id,
            });
          }
        }
      }

      return createdComment;
    }),
  getMany: baseProcedure
  .input(
    z.object({
      videoId: z.string().uuid().nullish(),
      postId: z.string().uuid().nullish(),
      parentId: z.string().uuid().nullish(),
      cursor: z
        .object({
          id: z.string().uuid(),
          updatedAt: z.date(),
        })
        .nullish(),
      limit: z.number().min(1).max(100),
      sortBy: z.enum(["top", "newest"]).default("top"),
    }),
  )
  .query(async ({ input, ctx }) => {
    const { clerkUserId } = ctx;
    const { parentId, videoId, postId, cursor, limit, sortBy } = input;

    if (!videoId && !postId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "videoId or postId is required" });
    }

    let userId: string | undefined;

    const [user] = await db
      .select()
      .from(users)
      .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []));

    if (user) {
      userId = user.id;
    }

    const viewerReactions = db.$with("viewer_reactions").as(
      db
        .select({
          commentId: commentReactions.commentId,
          type: commentReactions.type,
        })
        .from(commentReactions)
        .where(inArray(commentReactions.userId, userId ? [userId] : [])),
    );

    const replies = db.$with("replies").as(
      db
        .select({
          parentId: comments.parentId,
          count: count(comments.id).as("count"),
        })
        .from(comments)
        .where(isNotNull(comments.parentId))
        .groupBy(comments.parentId),
    );

    // ⭐ điểm nổi bật comment giống YouTube
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

    const whereClause = and(
      videoId ? eq(comments.videoId, videoId) : eq(comments.postId, postId!),
      parentId
        ? eq(comments.parentId, parentId)
        : isNull(comments.parentId),
      cursor
        ? or(
            lt(comments.updatedAt, cursor.updatedAt),
            and(
              eq(comments.updatedAt, cursor.updatedAt),
              lt(comments.id, cursor.id),
            ),
          )
        : undefined,
    );

    const [totalData, data] = await Promise.all([
      db
        .select({
          count: count(),
        })
        .from(comments)
        .where(
          and(
            videoId ? eq(comments.videoId, videoId) : eq(comments.postId, postId!),
            isNull(comments.parentId),
          ),
        ),

      db
        .with(viewerReactions, replies)
        .select({
          ...getTableColumns(comments),
          user: users,
          viewerReaction: viewerReactions.type,
          replyCount: replies.count,
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
          // For video comments
          videoOwnerId: videos.userId,
          // For post comments
          postOwnerId: posts.userId,
          
          contentOwnerId: sql<string>`COALESCE(${videos.userId}, ${posts.userId})`,
          contentOwnerClerkId: sql<string>`(SELECT clerk_id FROM users WHERE id = COALESCE(${videos.userId}, ${posts.userId}))`,
          contentOwnerName: sql<string>`(SELECT name FROM users WHERE id = COALESCE(${videos.userId}, ${posts.userId}))`,
          contentOwnerImageUrl: sql<string>`(SELECT image_url FROM users WHERE id = COALESCE(${videos.userId}, ${posts.userId}))`,
        })
        .from(comments)
        .where(whereClause)
        .innerJoin(users, eq(comments.userId, users.id))
        .leftJoin(videos, eq(comments.videoId, videos.id))
        .leftJoin(posts, eq(comments.postId, posts.id))
        .leftJoin(viewerReactions, eq(comments.id, viewerReactions.commentId))
        .leftJoin(replies, eq(comments.id, replies.parentId))
        .orderBy(
          desc(comments.isPinned),
          ...(sortBy === "newest"
            ? [desc(comments.createdAt), desc(comments.id)]
            : [desc(score), desc(comments.createdAt), desc(comments.id)]),
        )
        .limit(limit + 1),
    ]);

    const hasMore = data.length > limit;
    const items = hasMore ? data.slice(0, -1) : data;

    const lastItem = items[items.length - 1];

    const nextCursor = hasMore
      ? {
          id: lastItem.id,
          updatedAt: lastItem.updatedAt,
        }
      : null;

    return {
      totalCount: totalData[0].count,
      items,
      nextCursor,
    };
  }),
});

