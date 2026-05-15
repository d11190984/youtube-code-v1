import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, lt, or, getTableColumns, sql, inArray, isNull, lte, gt } from "drizzle-orm";


import { db } from "@/db";
import {
  posts,
  postImages,
  postPolls,
  postPollOptions,
  postPollVotes,
  postReactions,
  users,
  videos,
  comments,
  notifications,
} from "@/db/schema";

import { createTRPCRouter, protectedProcedure, baseProcedure } from "@/trpc/init";

export const postsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        content: z.string().optional(),
        type: z.enum(["text", "image", "poll", "video"]),
        videoId: z.string().uuid().optional(),
        images: z.array(z.object({
          url: z.string(),
          key: z.string().optional(),
        })).optional(),
        poll: z.object({
          type: z.enum(["text", "image"]),
          options: z.array(z.object({
            text: z.string().optional(),
            url: z.string().optional(),
            key: z.string().optional(),
            isCorrect: z.boolean().optional(),
            explanation: z.string().optional(),
          })),
        }).optional(),
        scheduledAt: z.string().datetime().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      
      const [newPost] = await db
        .insert(posts)
        .values({
          userId,
          content: input.content,
          type: input.type,
          videoId: input.videoId,
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        })
        .returning();

      if (input.images && input.type === "image" && input.images.length > 0) {
        await db.insert(postImages).values(
          input.images.map((img) => ({
            postId: newPost.id,
            imageUrl: img.url,
            imageKey: img.key,
          }))
        );
      }

      if (input.poll && input.type === "poll" && input.poll.options.length > 0) {
        const [newPoll] = await db
          .insert(postPolls)
          .values({
            postId: newPost.id,
            type: input.poll.type,
          })
          .returning();

        await db.insert(postPollOptions).values(
          input.poll.options.map((opt) => ({
            pollId: newPoll.id,
            text: opt.text,
            imageUrl: opt.url,
            imageKey: opt.key,
            isCorrect: opt.isCorrect,
            explanation: opt.explanation,
          }))
        );
      }

      return newPost;
    }),

  getMany: baseProcedure
    .input(
      z.object({
        userId: z.string(),
        status: z.enum(["published", "scheduled", "archived"]).default("published"),
        cursor: z
          .object({
            id: z.string().uuid(),
            createdAt: z.date(),
          })
          .nullish(),
        limit: z.number().min(1).max(100),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
        types: z.array(z.string()).nullish(),
        visibility: z.enum(["public", "private"]).nullish(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { userId: inputUserId, status, cursor, limit, sortOrder, types, visibility } = input;
      
      let targetUserId = inputUserId;

      // Nếu inputUserId là Clerk ID, tìm UUID tương ứng
      if (inputUserId.startsWith("user_")) {
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.clerkId, inputUserId));
        
        if (!dbUser) throw new TRPCError({ code: "NOT_FOUND" });
        targetUserId = dbUser.id;
      }

      let viewerId: string | undefined;
      if (ctx.clerkUserId) {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.clerkId, ctx.clerkUserId));
        viewerId = user?.id;
      }

      const now = new Date();

      const data = await db
        .select({
          ...getTableColumns(posts),
          user: users,
          video: videos,
          likeCount: db.$count(
            postReactions,
            and(eq(postReactions.postId, posts.id), eq(postReactions.type, "like"))
          ),
          dislikeCount: db.$count(
            postReactions,
            and(eq(postReactions.postId, posts.id), eq(postReactions.type, "dislike"))
          ),
          commentCount: db.$count(
            comments,
            eq(comments.postId, posts.id)
          ),
        })

        .from(posts)
        .innerJoin(users, eq(posts.userId, users.id))
        .leftJoin(videos, eq(posts.videoId, videos.id))
        .where(
          and(
            eq(posts.userId, targetUserId),
            status === "published" 
              ? or(isNull(posts.scheduledAt), lte(posts.scheduledAt, now))
              : status === "scheduled"
              ? gt(posts.scheduledAt, now)
              : undefined,
            visibility ? eq(sql`'public'`, visibility) : undefined, // Currently posts are public or private? Check schema
            types && types.length > 0 ? (
              or(
                ...types.map(t => {
                  if (t === "quiz") {
                    return and(
                      eq(posts.type, "poll"),
                      sql`EXISTS (SELECT 1 FROM ${postPolls} pp JOIN ${postPollOptions} ppo ON pp.id = ppo.poll_id WHERE pp.post_id = ${posts.id} AND ppo.is_correct = true)`
                    );
                  }
                  if (t === "poll") {
                    return and(
                      eq(posts.type, "poll"),
                      sql`NOT EXISTS (SELECT 1 FROM ${postPolls} pp JOIN ${postPollOptions} ppo ON pp.id = ppo.poll_id WHERE pp.post_id = ${posts.id} AND ppo.is_correct = true)`
                    );
                  }
                  return eq(posts.type, t as any);
                })
              )
            ) : undefined,
            cursor
              ? sortOrder === "desc"
                ? or(
                    lt(posts.createdAt, cursor.createdAt),
                    and(eq(posts.createdAt, cursor.createdAt), lt(posts.id, cursor.id))
                  )
                : or(
                    gt(posts.createdAt, cursor.createdAt),
                    and(eq(posts.createdAt, cursor.createdAt), gt(posts.id, cursor.id))
                  )
              : undefined
          )
        )
        .orderBy(
          sortOrder === "desc" ? desc(posts.createdAt) : posts.createdAt,
          sortOrder === "desc" ? desc(posts.id) : posts.id
        )
        .limit(limit + 1);

      const hasMore = data.length > limit;
      const items = hasMore ? data.slice(0, -1) : data;
      const lastItem = items[items.length - 1];

      const nextCursor = (hasMore && lastItem)
        ? { id: lastItem.id, createdAt: lastItem.createdAt }
        : null;

      const postIds = items.map(p => p.id);

      // Fetch images
      const images = postIds.length > 0 
        ? await db.select().from(postImages).where(inArray(postImages.postId, postIds))
        : [];

      // Fetch polls
      const polls = postIds.length > 0
        ? await db.select().from(postPolls).where(inArray(postPolls.postId, postIds))
        : [];
      
      const pollIds = polls.map(p => p.id);
      const pollOptions = pollIds.length > 0
        ? await db.select().from(postPollOptions).where(inArray(postPollOptions.pollId, pollIds))
        : [];

      // Fetch viewer reactions and votes if viewerId exists
      const viewerReactions = viewerId && postIds.length > 0
        ? await db.select().from(postReactions).where(and(eq(postReactions.userId, viewerId), inArray(postReactions.postId, postIds)))
        : [];

      const viewerVotes = viewerId && pollOptions.length > 0
        ? await db.select().from(postPollVotes).where(and(eq(postPollVotes.userId, viewerId), inArray(postPollVotes.optionId, pollOptions.map(o => o.id))))
        : [];

      // Map everything together
      const postsWithData = await Promise.all(items.map(async (post) => {
        const postImagesList = images.filter(img => img.postId === post.id);
        const postPoll = polls.find(p => p.postId === post.id);
        const postViewerReaction = viewerReactions.find(r => r.postId === post.id);

        let pollWithSelection = null;
        if (postPoll) {
          const options = await Promise.all(pollOptions
            .filter(opt => opt.pollId === postPoll.id)
            .map(async (opt) => {
              const voteCount = await db.$count(postPollVotes, eq(postPollVotes.optionId, opt.id));
              const hasVoted = viewerVotes.some(v => v.optionId === opt.id);
              return {
                ...opt,
                voteCount,
                viewerVoted: hasVoted,
              };
            }));
          
          pollWithSelection = {
            ...postPoll,
            options,
          };
        }

        return {
          ...post,
          images: postImagesList,
          poll: pollWithSelection,
          viewerReaction: postViewerReaction?.type || null,
        };
      }));

      return { items: postsWithData, nextCursor };
    }),

  getOne: baseProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const { id } = input;

      let viewerId: string | undefined;
      if (ctx.clerkUserId) {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.clerkId, ctx.clerkUserId));
        viewerId = user?.id;
      }

      const [post] = await db
        .select({
          ...getTableColumns(posts),
          user: users,
          video: videos,
          likeCount: db.$count(
            postReactions,
            and(eq(postReactions.postId, posts.id), eq(postReactions.type, "like"))
          ),
          dislikeCount: db.$count(
            postReactions,
            and(eq(postReactions.postId, posts.id), eq(postReactions.type, "dislike"))
          ),
          commentCount: db.$count(
            comments,
            eq(comments.postId, posts.id)
          ),
        })
        .from(posts)
        .innerJoin(users, eq(posts.userId, users.id))
        .leftJoin(videos, eq(posts.videoId, videos.id))
        .where(eq(posts.id, id));

      if (!post) throw new TRPCError({ code: "NOT_FOUND" });

      // Fetch images
      const images = await db.select().from(postImages).where(eq(postImages.postId, post.id));

      // Fetch poll
      const [poll] = await db.select().from(postPolls).where(eq(postPolls.postId, post.id));
      
      let pollWithSelection = null;
      if (poll) {
        const options = await db.select().from(postPollOptions).where(eq(postPollOptions.pollId, poll.id));
        
        const optionsWithData = await Promise.all(options.map(async (opt) => {
          const voteCount = await db.$count(postPollVotes, eq(postPollVotes.optionId, opt.id));
          const hasVoted = viewerId 
            ? (await db.select().from(postPollVotes).where(and(eq(postPollVotes.userId, viewerId), eq(postPollVotes.optionId, opt.id)))).length > 0
            : false;
          
          return {
            ...opt,
            voteCount,
            viewerVoted: hasVoted,
          };
        }));

        pollWithSelection = {
          ...poll,
          options: optionsWithData,
        };
      }

      // Fetch viewer reaction
      let viewerReaction = null;
      if (viewerId) {
        const [reaction] = await db.select().from(postReactions).where(and(eq(postReactions.userId, viewerId), eq(postReactions.postId, post.id)));
        viewerReaction = reaction?.type || null;
      }

      return {
        ...post,
        images,
        poll: pollWithSelection,
        viewerReaction,
      };
    }),

  removeMany: protectedProcedure
    .input(z.object({ ids: z.array(z.string().uuid()) }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      await db.delete(posts).where(and(inArray(posts.id, input.ids), eq(posts.userId, userId)));
      return { success: true };
    }),

  updateMany: protectedProcedure
    .input(z.object({ ids: z.array(z.string().uuid()), content: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      await db
        .update(posts)
        .set({ 
          ...(input.content !== undefined && { content: input.content }),
          isEdited: true,
          updatedAt: new Date() 
        })
        .where(and(inArray(posts.id, input.ids), eq(posts.userId, userId)));
      return { success: true };
    }),

  react: protectedProcedure
    .input(
      z.object({
        postId: z.string().uuid(),
        type: z.enum(["like", "dislike", "none"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      const { postId, type } = input;

      if (type === "none") {
        await db
          .delete(postReactions)
          .where(and(eq(postReactions.userId, userId), eq(postReactions.postId, postId)));
        return { success: true };
      }

      const [updatedReaction] = await db
        .insert(postReactions)
        .values({ userId, postId, type: type as "like" | "dislike" })
        .onConflictDoUpdate({
          target: [postReactions.userId, postReactions.postId],
          set: { type: type as "like" | "dislike", updatedAt: new Date() },
        })
        .returning();

      if (updatedReaction && type === "like") {
        const [post] = await db
          .select({ userId: posts.userId })
          .from(posts)
          .where(eq(posts.id, postId));

        if (post && post.userId !== userId) {
          await db.insert(notifications).values({
            userId: post.userId,
            actorId: userId,
            type: "post_like",
            postId: postId,
          });
        }
      }

      return { success: true };
    }),

  vote: protectedProcedure
    .input(
      z.object({
        postId: z.string().uuid(),
        optionId: z.string().uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      const { postId, optionId } = input;

      const [poll] = await db.select().from(postPolls).where(eq(postPolls.postId, postId));
      if (!poll) throw new TRPCError({ code: "NOT_FOUND" });

      const options = await db.select().from(postPollOptions).where(eq(postPollOptions.pollId, poll.id));
      const optionIds = options.map((opt) => opt.id);

      if (!optionIds.includes(optionId)) throw new TRPCError({ code: "BAD_REQUEST" });

      // Remove previous vote for this poll
      await db
        .delete(postPollVotes)
        .where(and(eq(postPollVotes.userId, userId), inArray(postPollVotes.optionId, optionIds)));

      await db.insert(postPollVotes).values({ userId, optionId });

      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({ 
      id: z.string().uuid(), 
      content: z.string().nullable().optional(),
      canComment: z.boolean().optional(),
      commentModeration: z.enum(["none", "basic", "strict", "hold_all"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      const [updatedPost] = await db
        .update(posts)
        .set({ 
          ...(input.content !== undefined && { content: input.content, isEdited: true }),
          ...(input.canComment !== undefined && { canComment: input.canComment }),
          ...(input.commentModeration !== undefined && { commentModeration: input.commentModeration }),
          updatedAt: new Date() 
        })
        .where(and(eq(posts.id, input.id), eq(posts.userId, userId)))
        .returning();

      if (!updatedPost) throw new TRPCError({ code: "NOT_FOUND" });

      return updatedPost;
    }),

  remove: protectedProcedure

    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      await db.delete(posts).where(and(eq(posts.id, input.id), eq(posts.userId, userId)));
      return { success: true };
    }),
});
