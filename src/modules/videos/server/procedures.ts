import { z } from "zod";
import { UTApi } from "uploadthing/server";
import {
  and,
  desc,
  eq,
  sql,
  getTableColumns,
  inArray,
  isNotNull,
  lt,
  or,
  lte,
  gt,
} from "drizzle-orm";

import { db } from "@/db";
import { mux } from "@/lib/mux";
import { TRPCError } from "@trpc/server";
import { workflow } from "@/lib/workflow";
import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/trpc/init";
import {
  subscriptions,
  users,
  videoReactions,
  videos,
  videoUpdateSchema,
  videoViews,
  viewEvents,
  comments,
} from "@/db/schema";

const extractHashtags = (text: string | null | undefined): string[] => {
  if (!text) return [];
  const hashtags = text.match(/#[\w\u00C0-\u024F]+/g);
  return hashtags ? Array.from(new Set(hashtags.map(h => h.slice(1).toLowerCase()))) : [];
};

export const videosRouter = createTRPCRouter({
  getManySubscribed: protectedProcedure
    .input(
      z.object({
        cursor: z
          .object({
            id: z.string().uuid(),
            updatedAt: z.date(),
          })
          .nullish(),
        limit: z.number().min(1).max(100),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      const { cursor, limit } = input;

      // danh sách creator mà viewer đang subscribe
      const viewerSubscriptions = db.$with("viewer_subscriptions").as(
        db
          .select({
            userId: subscriptions.creatorId,
          })
          .from(subscriptions)
          .where(eq(subscriptions.viewerId, userId)),
      );

      const data = await db
        .with(viewerSubscriptions)
        .select({
          ...getTableColumns(videos),
          user: users,
          progress: sql<number>`user_progress.progress`,
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
        .innerJoin(
          viewerSubscriptions,
          eq(viewerSubscriptions.userId, users.id),
        )
        .leftJoin(
          db.select({
            videoId: videoViews.videoId,
            userId: videoViews.userId,
            progress: sql<number>`MAX(${videoViews.progress})`.as("progress")
          })
          .from(videoViews)
          .where(eq(videoViews.userId, userId))
          .groupBy(videoViews.videoId, videoViews.userId)
          .as("user_progress"),
          eq(videos.id, sql`user_progress.video_id`)
        )
        .where(
          and(
            eq(videos.visibility, "public"),

            cursor
              ? or(
                  lt(videos.updatedAt, cursor.updatedAt),
                  and(
                    eq(videos.updatedAt, cursor.updatedAt),
                    lt(videos.id, cursor.id),
                  ),
                )
              : undefined,
          ),
        )

        // ✅ FIX QUAN TRỌNG: luôn stable order, KHÔNG RANDOM
        .orderBy(desc(videos.updatedAt), desc(videos.id))
        .limit(limit + 1);

      const hasMore = (data?.length || 0) > limit;
      const items = hasMore ? data.slice(0, limit) : (data || []);

      const lastItem = items[items.length - 1];

      const nextCursor =
        hasMore && lastItem
          ? {
              id: lastItem.id,
              updatedAt: lastItem.updatedAt,
            }
          : null;

      return {
        items,
        nextCursor,
      };
    }),
  getManyTrending: baseProcedure
    .input(
      z.object({
        cursor: z
          .object({
            id: z.string().uuid(),
            viewCount: z.number(),
          })
          .nullish(),
        limit: z.number().min(1).max(100),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { cursor, limit } = input;

      let viewerId: string | undefined;

      if (ctx.clerkUserId) {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.clerkId, ctx.clerkUserId));

        viewerId = user?.id;
      }

      const data = await db
        .select({
          ...getTableColumns(videos),
          user: users,
          progress: sql<number>`user_progress.progress`, // 🔹 tiến độ user hiện tại
          viewCount: videos.viewsCount, // 🔹 lấy tổng viewCount trực tiếp
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
            cursor
              ? or(
                  lt(videos.viewsCount, cursor.viewCount), // dùng trực tiếp videos.viewsCount
                  and(
                    eq(videos.viewsCount, cursor.viewCount),
                    lt(videos.id, cursor.id),
                  ),
                )
              : undefined,
          ),
        )
        .orderBy(desc(videos.viewsCount), desc(videos.id)) // sắp xếp theo viewsCount tổng
        .limit(limit + 1);

      const hasMore = (data?.length || 0) > limit;
      const items = hasMore ? data.slice(0, -1) : (data || []);
      const lastItem = items[items.length - 1];

      const nextCursor = (hasMore && lastItem)
        ? {
            id: lastItem.id,
            viewCount: lastItem.viewCount,
          }
        : null;

      return { items, nextCursor };
    }),
  getManyShorts: baseProcedure
    .input(
      z.object({
        categoryId: z.string().uuid().nullish(),
        cursor: z
          .object({
            id: z.string().uuid(),
            viewCount: z.number(),
          })
          .nullish(),
        limit: z.number().min(1).max(100),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { cursor, limit, categoryId } = input;

      let viewerId: string | undefined;

      if (ctx.clerkUserId) {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.clerkId, ctx.clerkUserId));

        viewerId = user?.id;
      }

      const data = await db
        .select({
          ...getTableColumns(videos),
          user: users,
          progress: sql<number>`user_progress_shorts.progress`, // tiến độ user hiện tại
          viewCount: videos.viewsCount, // tổng viewCount
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
          .as("user_progress_shorts"),
          eq(videos.id, sql`user_progress_shorts.video_id`)
        )
        .where(
          and(
            eq(videos.visibility, "public"),
            gt(videos.videoHeight, videos.videoWidth), // Chỉ lấy video có chiều cao > chiều rộng (9:16)
            categoryId ? eq(videos.categoryId, categoryId) : undefined,
            cursor
              ? or(
                  lt(videos.viewsCount, cursor.viewCount),
                  and(
                    eq(videos.viewsCount, cursor.viewCount),
                    lt(videos.id, cursor.id),
                  ),
                )
              : undefined,
          ),
        )
        .orderBy(desc(videos.viewsCount), desc(videos.id)) // sắp xếp theo tổng viewCount
        .limit(limit + 1);

      const hasMore = (data?.length || 0) > limit;
      const items = hasMore ? data.slice(0, -1) : (data || []);
      const lastItem = items[items.length - 1];

      const nextCursor = (hasMore && lastItem)
        ? {
            id: lastItem.id,
            viewCount: lastItem.viewCount,
          }
        : null;

      return { items, nextCursor };
    }),
  getMany: baseProcedure
    .input(
      z.object({
        categoryId: z.string().uuid().nullish(),
        userId: z.string().uuid().nullish(),
        cursor: z
          .object({
            id: z.string().uuid(),
            createdAt: z.date(),
          })
          .nullish(),
        limit: z.number().min(1).max(100),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { cursor, limit, categoryId, userId } = input;

      let viewerId: string | undefined;

      if (ctx.clerkUserId) {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.clerkId, ctx.clerkUserId));

        viewerId = user?.id;
      }

      const data = await db
        .select({
          ...getTableColumns(videos),
          user: users,
          progress: sql<number>`user_progress.progress`,
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
          .as("user_progress"),
          eq(videos.id, sql`user_progress.video_id`)
        )
        .where(
          and(
            eq(videos.visibility, "public"),
            userId ? eq(videos.userId, userId) : undefined,
            categoryId ? eq(videos.categoryId, categoryId) : undefined,
            cursor
              ? or(
                  lt(videos.createdAt, cursor.createdAt),
                  and(
                    eq(videos.createdAt, cursor.createdAt),
                    lt(videos.id, cursor.id),
                  ),
                )
              : undefined,
          ),
        )
        .orderBy(desc(videos.createdAt), desc(videos.id))
        .limit(limit + 1);

      const hasMore = (data?.length || 0) > limit;
      const items = hasMore ? data.slice(0, -1) : (data || []);
      const lastItem = (items?.length || 0) > 0 ? items[items.length - 1] : null;

      const nextCursor = (hasMore && lastItem)
        ? {
            id: lastItem.id,
            createdAt: lastItem.createdAt,
          }
        : null;

      return { items, nextCursor };
    }),

  getOne: baseProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const { clerkUserId } = ctx;
      let userId: string | undefined;

      if (clerkUserId) {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.clerkId, clerkUserId));
        userId = user?.id;
      }

      const viewerReactions = db.$with("viewer_reactions").as(
        db
          .select({
            videoId: videoReactions.videoId,
            type: videoReactions.type,
          })
          .from(videoReactions)
          .where(
            userId ? inArray(videoReactions.userId, [userId]) : sql`1=0`, // guest thì không match ai, SQL vẫn hợp lệ
          ),
      );

      const viewerSubscriptions = db.$with("viewer_subscriptions").as(
        db
          .select()
          .from(subscriptions)
          .where(userId ? inArray(subscriptions.viewerId, [userId]) : sql`1=0`),
      );

      let [existingVideo] = await db
        .with(viewerReactions, viewerSubscriptions)
        .select({
          ...getTableColumns(videos),
          user: {
            ...getTableColumns(users),
            subscriberCount: db.$count(
              subscriptions,
              eq(subscriptions.creatorId, users.id),
            ),
            viewerSubscribed: isNotNull(viewerSubscriptions.viewerId).mapWith(
              Boolean,
            ),
          },
          viewCount: videos.viewsCount,
          progress: sql<number>`user_progress.progress`,
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
          commentCount: db.$count(
            comments,
            eq(comments.videoId, videos.id)
          ),
          viewerReaction: viewerReactions.type,
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id))
        .leftJoin(viewerReactions, eq(viewerReactions.videoId, videos.id))
        .leftJoin(
          viewerSubscriptions,
          eq(viewerSubscriptions.creatorId, users.id),
        )
        .leftJoin(
          db.select({
            videoId: videoViews.videoId,
            userId: videoViews.userId,
            progress: sql<number>`MAX(${videoViews.progress})`.as("progress")
          })
          .from(videoViews)
          .where(userId ? eq(videoViews.userId, userId) : sql`1=0`)
          .groupBy(videoViews.videoId, videoViews.userId)
          .as("user_progress"),
          eq(videos.id, sql`user_progress.video_id`)
        )
        .where(eq(videos.id, input.id));

      if (!existingVideo) throw new TRPCError({ code: "NOT_FOUND" });

      return existingVideo;
    }),
  generateDescription: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;

      const [video] = await db
        .select()
        .from(videos)
        .where(and(eq(videos.id, input.id), eq(videos.userId, userId)));

      if (!video) throw new TRPCError({ code: "NOT_FOUND" });

      // 1. Lấy Transcript
      let transcript = "";
      if (video.muxPlaybackId && video.muxTrackId) {
        try {
          const res = await fetch(`https://stream.mux.com/${video.muxPlaybackId}/text/${video.muxTrackId}.txt`);
          if (res.ok) transcript = await res.text();
        } catch (e) {
          console.error("Transcript fetch error", e);
        }
      }

      // 2. Gọi AI
      const SYSTEM_PROMPT = `Write ONLY a YouTube video description. Rules: Max 200 characters, no explanation, no hashtags, match actual content.`;
      const inputText = transcript.length > 200 ? `Transcript: ${transcript}` : `Title: ${video.title}. Generate description.`;

      const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY!}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b:free",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: inputText.slice(0, 8000) },
          ],
        }),
      });

      if (!aiResponse.ok) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI failed" });
      const aiData = await aiResponse.json();
      let description = aiData.choices?.[0]?.message?.content?.trim().replace(/[*"]/g, "");

      if (!description) description = "Amazing video content.";

      // 3. Cập nhật DB
      await db.update(videos).set({ description }).where(eq(videos.id, video.id));

      return { description };
    }),
  incrementView: baseProcedure
    .input(z.object({ videoId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      let userId: string | undefined;
      let trackingEnabled = true;

      if (ctx.clerkUserId) {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.clerkId, ctx.clerkUserId));

        userId = user?.id;
        trackingEnabled = user?.trackHistory ?? true;
      }

      await db
        .update(videos)
        .set({
          viewsCount: sql`${videos.viewsCount} + 1`,
        })
        .where(eq(videos.id, input.videoId));

      // 🔹 Ghi nhận sự kiện xem (Event) - Luôn thêm mới để tính analytics theo ngày/giờ
      await db.insert(viewEvents).values({
        userId,
        videoId: input.videoId,
      });

      if (userId && trackingEnabled) {
        await db
          .insert(videoViews)
          .values({
            userId,
            videoId: input.videoId,
            progress: 0,
          })
          .onConflictDoNothing();
      }

      return { success: true };
    }),
  generateTitle: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;

      const [video] = await db
        .select()
        .from(videos)
        .where(and(eq(videos.id, input.id), eq(videos.userId, userId)));

      if (!video) throw new TRPCError({ code: "NOT_FOUND" });

      // 1. Lấy Transcript
      let transcript = "";
      if (video.muxPlaybackId && video.muxTrackId) {
        try {
          const res = await fetch(`https://stream.mux.com/${video.muxPlaybackId}/text/${video.muxTrackId}.txt`);
          if (res.ok) transcript = await res.text();
        } catch (e) {
          console.error("Transcript fetch error", e);
        }
      }

      // 2. Gọi AI
      const SYSTEM_PROMPT = `Generate ONLY a YouTube title. Max 10 words, no quotes, match content.`;
      const inputText = transcript.length > 200 ? `Transcript: ${transcript}` : `Video info: ${video.thumbnailUrl}. Generate title.`;

      const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY!}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b:free",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: inputText.slice(0, 8000) },
          ],
        }),
      });

      if (!aiResponse.ok) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI failed" });
      const aiData = await aiResponse.json();
      let title = aiData.choices?.[0]?.message?.content?.trim().replace(/[*"]/g, "");

      if (!title) title = "Amazing Video";

      // 3. Cập nhật DB
      await db.update(videos).set({ title }).where(eq(videos.id, video.id));

      return { title };
    }),
  generateThumbnail: protectedProcedure
    .input(z.object({ id: z.string().uuid(), prompt: z.string().min(10) }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;

      const { workflowRunId } = await workflow.trigger({
        url: `${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/thumbnail`,
        body: { userId, videoId: input.id, prompt: input.prompt },
      });

      return workflowRunId;
    }),
  updateProgress: protectedProcedure
    .input(
      z.object({
        videoId: z.string(),
        progress: z.number(),
        isRestart: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;

      const [me] = await db.select().from(users).where(eq(users.id, userId));
      if (!me) throw new TRPCError({ code: "NOT_FOUND" });

      if (!me.trackHistory) {
        return { success: true };
      }

      const [videoInfo] = await db
        .select({
          duration: videos.duration,
        })
        .from(videos)
        .where(eq(videos.id, input.videoId));

      if (!videoInfo) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const durationSeconds = Math.floor((videoInfo.duration || 0) / 1000);

      const [existing] = await db
        .select()
        .from(videoViews)
        .where(
          and(
            eq(videoViews.userId, userId),
            eq(videoViews.videoId, input.videoId),
          ),
        );

      const finalProgress = Math.max(0, Math.floor(input.progress));

      if (existing) {
        await db
          .update(videoViews)
          .set({
            progress: finalProgress,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(videoViews.userId, userId),
              eq(videoViews.videoId, input.videoId),
            ),
          );
      } else {
        await db.insert(videoViews).values({
          userId,
          videoId: input.videoId,
          progress: finalProgress,
        });
      }

      return { success: true };
    }),
  revalidate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;

      const [existingVideo] = await db
        .select()
        .from(videos)
        .where(and(eq(videos.id, input.id), eq(videos.userId, userId)));

      if (!existingVideo) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (!existingVideo.muxUploadId) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      const upload = await mux.video.uploads.retrieve(
        existingVideo.muxUploadId,
      );

      if (!upload || !upload.asset_id) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      const asset = await mux.video.assets.retrieve(upload.asset_id);

      if (!asset) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      const playbackId = asset.playback_ids?.[0]?.id || null;
      const duration = asset.duration ? Math.round(asset.duration * 1000) : 0;

      // ⭐ lấy track video thật để biết kích thước
      const videoTrack: any = asset.tracks?.find(
        (t: any) => t.type === "video",
      );

      const videoWidth = videoTrack?.max_width || null;
      const videoHeight = videoTrack?.max_height || null;

      const [updatedVideo] = await db
        .update(videos)
        .set({
          muxStatus: asset.status,
          muxPlaybackId: playbackId,
          muxAssetId: asset.id,
          duration,
          videoWidth,
          videoHeight,
        })
        .where(and(eq(videos.id, input.id), eq(videos.userId, userId)))
        .returning();

      return updatedVideo;
    }),
  restoreThumbnail: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;

      const [existingVideo] = await db
        .select()
        .from(videos)
        .where(and(eq(videos.id, input.id), eq(videos.userId, userId)));

      if (!existingVideo) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (existingVideo.thumbnailKey) {
        const utapi = new UTApi();

        await utapi.deleteFiles(existingVideo.thumbnailKey);
        await db
          .update(videos)
          .set({ thumbnailKey: null, thumbnailUrl: null })
          .where(and(eq(videos.id, input.id), eq(videos.userId, userId)));
      }

      if (!existingVideo.muxPlaybackId) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      const utapi = new UTApi();

      const tempThumbnailUrl = `https://image.mux.com/${existingVideo.muxPlaybackId}/thumbnail.jpg`;
      const uploadedThumbnail =
        await utapi.uploadFilesFromUrl(tempThumbnailUrl);

      if (!uploadedThumbnail.data) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      const { key: thumbnailKey, url: thumbnailUrl } = uploadedThumbnail.data;

      const [updatedVideo] = await db
        .update(videos)
        .set({ thumbnailUrl, thumbnailKey })
        .where(and(eq(videos.id, input.id), eq(videos.userId, userId)))
        .returning();

      return updatedVideo;
    }),
  remove: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;

      const [removedVideo] = await db
        .delete(videos)
        .where(and(eq(videos.id, input.id), eq(videos.userId, userId)))
        .returning();

      if (!removedVideo) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return removedVideo;
    }),
  update: protectedProcedure
    .input(videoUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;

      if (!input.id) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      const [updatedVideo] = await db
        .update(videos)
        .set({
          title: input.title,
          description: input.description,
          categoryId: input.categoryId,
          visibility: input.visibility,
          canComment: input.canComment,
          commentModeration: input.commentModeration,
          commentPermission: input.commentPermission,
          commentSort: input.commentSort,
          showLikeCount: input.showLikeCount,
          tags: input.tags ?? extractHashtags(input.description),
          updatedAt: new Date(),
        })
        .where(and(eq(videos.id, input.id), eq(videos.userId, userId)))
        .returning();

      if (!updatedVideo) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return updatedVideo;
    }),
  create: protectedProcedure.mutation(async ({ ctx }) => {
    const { id: userId } = ctx.user;

    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        passthrough: userId,
        playback_policy: ["public"],
        static_renditions: [
          {
            resolution: "highest",
          },
        ],

        input: [
          {
            generated_subtitles: [
              {
                language_code: "en",
                name: "English",
              },
            ],
          },
        ],
      },
      cors_origin: "*", // TODO: In production, set to your url
    });

    const [video] = await db
      .insert(videos)
      .values({
        userId,
        title: "Untitled",
        muxStatus: "waiting",
        muxUploadId: upload.id,
      })
      .returning();
    return {
      video,
      url: upload.url,
    };
  }),
  removeMany: protectedProcedure
    .input(z.object({ ids: z.array(z.string().uuid()) }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;

      const removedVideos = await db
        .delete(videos)
        .where(and(inArray(videos.id, input.ids), eq(videos.userId, userId)))
        .returning();

      return removedVideos;
    }),
  updateMany: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.string().uuid()),
        title: z.string().optional(),
        description: z.string().optional(),
        visibility: z.enum(["public", "private"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;

      const updatedVideos = await db
        .update(videos)
        .set({
          ...(input.title !== undefined && { title: input.title }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.visibility !== undefined && { visibility: input.visibility }),
          updatedAt: new Date(),
        })
        .where(and(inArray(videos.id, input.ids), eq(videos.userId, userId)))
        .returning();

      return updatedVideos;
    }),
});
