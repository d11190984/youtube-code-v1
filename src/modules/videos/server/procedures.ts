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
} from "@/db/schema";

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
          progress: videoViews.progress,
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
          videoViews,
          and(eq(videoViews.videoId, videos.id), eq(videoViews.userId, userId)),
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

      const hasMore = data.length > limit;
      const items = hasMore ? data.slice(0, limit) : data;

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
          progress: videoViews.progress, // 🔹 tiến độ user hiện tại
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
          videoViews,
          viewerId
            ? and(
                eq(videoViews.videoId, videos.id),
                eq(videoViews.userId, viewerId),
              )
            : sql`1=0`,
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

      const hasMore = data.length > limit;
      const items = hasMore ? data.slice(0, -1) : data;
      const lastItem = items[items.length - 1];

      const nextCursor = hasMore
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
          progress: videoViews.progress, // tiến độ user hiện tại
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
          videoViews,
          viewerId
            ? and(
                eq(videoViews.videoId, videos.id),
                eq(videoViews.userId, viewerId),
              )
            : sql`1=0`,
        )
        .where(
          and(
            eq(videos.visibility, "public"),
            lte(videos.duration, 60 * 1000), // chỉ video ≤ 1 phút
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

      const hasMore = data.length > limit;
      const items = hasMore ? data.slice(0, -1) : data;
      const lastItem = items[items.length - 1];

      const nextCursor = hasMore
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
            updatedAt: z.date(),
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
          progress: videoViews.progress,
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
          videoViews,
          viewerId
            ? and(
                eq(videoViews.videoId, videos.id),
                eq(videoViews.userId, viewerId),
              )
            : sql`1=0`,
        )
        .where(
          and(
            eq(videos.visibility, "public"),
            userId ? eq(videos.userId, userId) : undefined,
            categoryId ? eq(videos.categoryId, categoryId) : undefined,
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
        .orderBy(desc(videos.updatedAt), desc(videos.id))
        .limit(limit + 1);

      const hasMore = data.length > limit;
      const items = hasMore ? data.slice(0, -1) : data;
      const lastItem = items[items.length - 1];

      const nextCursor = hasMore
        ? {
            id: lastItem.id,
            updatedAt: lastItem.updatedAt,
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
          progress: videoViews.progress,
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
          videoViews,
          userId
            ? and(
                eq(videoViews.videoId, videos.id),
                eq(videoViews.userId, userId),
              )
            : sql`1=0`,
        )
        .where(eq(videos.id, input.id));

      if (!existingVideo) throw new TRPCError({ code: "NOT_FOUND" });

      return existingVideo;
    }),
  generateDescription: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;

      const { workflowRunId } = await workflow.trigger({
        url: `${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/description`,
        body: { userId, videoId: input.id },
      });

      return workflowRunId;
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
      console.log("📥 TRPC generateTitle called", input);

      const { id: userId } = ctx.user;

      console.log("👤 User ID:", userId);

      const { workflowRunId } = await workflow.trigger({
        url: `${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/title`,
        body: { userId, videoId: input.id },
      });

      console.log("🧠 Workflow triggered:", workflowRunId);

      return { workflowRunId };
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

      const oldProgress = existing?.progress ?? 0;
      const newProgress = Math.max(0, Math.floor(input.progress));

      const wasNearlyCompleted =
        durationSeconds > 0 && oldProgress >= durationSeconds * 0.85;

      let finalProgress = oldProgress;

      // ====================================
      // CASE 1: user bấm restart thủ công
      // ====================================
      if (input.isRestart) {
        finalProgress = 0;
      }

      // ====================================
      // CASE 2: currentTime=0 giả lúc load
      // ====================================
      else if (newProgress === 0 && oldProgress > 5 && !wasNearlyCompleted) {
        return { success: true };
      }

      // ====================================
      // CASE 3: video đã gần/full completed, user replay từ đầu
      // cho phép tụt xuống
      // ====================================
      else if (wasNearlyCompleted && newProgress < oldProgress) {
        finalProgress = newProgress;
      }

      // ====================================
      // CASE 4: xem tiến tới bình thường
      // ====================================
      else if (newProgress >= oldProgress) {
        finalProgress = newProgress;
      }

      // ====================================
      // CASE 5: jitter nhẹ
      // ====================================
      else if (oldProgress - newProgress < 3) {
        finalProgress = newProgress;
      }

      // ====================================
      // CASE 6: tua lùi mạnh -> bỏ qua
      // ====================================
      else {
        return { success: true };
      }

      await db
        .insert(videoViews)
        .values({
          userId,
          videoId: input.videoId,
          progress: finalProgress,
        })
        .onConflictDoUpdate({
          target: [videoViews.userId, videoViews.videoId],
          set: {
            progress: finalProgress,
            updatedAt: new Date(),
          },
        });

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
});
