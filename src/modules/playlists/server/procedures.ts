import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, getTableColumns, lt, or, sql } from "drizzle-orm";
import { categories } from "@/db/schema";

import { db } from "@/db";
import { inArray } from "drizzle-orm"; // 🔥 nhớ import
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/trpc/init";
import {
  playlists,
  playlistVideos,
  users,
  videoReactions,
  videos,
  videoViews,
} from "@/db/schema";

export const playlistsRouter = createTRPCRouter({
  remove: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      const { id: userId } = ctx.user;

      const [existingPlaylist] = await db
        .select()
        .from(playlists)
        .where(and(eq(playlists.id, id), eq(playlists.userId, userId)));

      if (!existingPlaylist) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await db.delete(playlistVideos).where(eq(playlistVideos.playlistId, id));

      const [deletedPlaylist] = await db
        .delete(playlists)
        .where(and(eq(playlists.id, id), eq(playlists.userId, userId)))
        .returning();

      return deletedPlaylist;
    }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const { id } = input;
      const { id: userId } = ctx.user;

      const [existingPlaylist] = await db
        .select()
        .from(playlists)
        .where(and(eq(playlists.id, id), eq(playlists.userId, userId)));

      if (!existingPlaylist) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return existingPlaylist;
    }),
  getVideos: protectedProcedure
    .input(
      z.object({
        playlistId: z.string().uuid(),
        cursor: z
          .object({
            id: z.string().uuid(),
            addedAt: z.date(),
          })
          .nullish(),
        limit: z.number().min(1).max(100),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      const { cursor, limit, playlistId } = input;

      const [existingPlaylist] = await db
        .select()
        .from(playlists)
        .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)));

      if (!existingPlaylist) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const videosFromPlaylist = db.$with("playlist_videos").as(
        db
          .select({
            videoId: playlistVideos.videoId,
            addedAt: playlistVideos.createdAt,
          })
          .from(playlistVideos)
          .where(eq(playlistVideos.playlistId, playlistId)),
      );

      const data = await db
        .with(videosFromPlaylist)
        .select({
          ...getTableColumns(videos),
          user: users,
          addedAt: videosFromPlaylist.addedAt,
          viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)),
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
          videosFromPlaylist,
          eq(videos.id, videosFromPlaylist.videoId),
        )
        .where(
          and(
            eq(videos.visibility, "public"),
            cursor
              ? or(
                  lt(videosFromPlaylist.addedAt, cursor.addedAt),
                  and(
                    eq(videosFromPlaylist.addedAt, cursor.addedAt),
                    lt(videos.id, cursor.id),
                  ),
                )
              : undefined,
          ),
        )
        .orderBy(videosFromPlaylist.addedAt, videos.id)
        .limit(limit + 1);

      const hasMore = data.length > limit;
      const items = hasMore ? data.slice(0, -1) : data;

      const lastItem = items[items.length - 1];

      const nextCursor = hasMore
        ? {
            id: lastItem.id,
            addedAt: lastItem.addedAt,
          }
        : null;

      return {
        items,
        nextCursor,
      };
    }),
  removeVideo: protectedProcedure
    .input(
      z.object({
        playlistId: z.string().uuid(),
        videoId: z.string().uuid(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { playlistId, videoId } = input;
      const { id: userId } = ctx.user;

      const [existingPlaylist] = await db
        .select()
        .from(playlists)
        .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)));

      if (!existingPlaylist) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [existingPlaylistVideo] = await db
        .select()
        .from(playlistVideos)
        .where(
          and(
            eq(playlistVideos.playlistId, playlistId),
            eq(playlistVideos.videoId, videoId),
          ),
        );

      if (!existingPlaylistVideo) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [deletedPlaylistVideo] = await db
        .delete(playlistVideos)
        .where(
          and(
            eq(playlistVideos.playlistId, playlistId),
            eq(playlistVideos.videoId, videoId),
          ),
        )
        .returning();

      const remainVideos = await db
        .select()
        .from(playlistVideos)
        .where(eq(playlistVideos.playlistId, playlistId));

      if (remainVideos.length === 0 && !existingPlaylist.isMixPlaylist) {
        await db.delete(playlists).where(eq(playlists.id, playlistId));
      } else {
        await db
          .update(playlists)
          .set({ updatedAt: new Date() })
          .where(eq(playlists.id, playlistId));
      }

      return deletedPlaylistVideo;
    }),
  getManyMixForVideo: protectedProcedure
    .input(
      z.object({
        videoId: z.string().uuid(),
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
      const { cursor, limit, videoId } = input;

      const data = await db
        .select({
          ...getTableColumns(playlists),
          videoCount: db.$count(
            playlistVideos,
            eq(playlists.id, playlistVideos.playlistId),
          ),
          user: users,
          containsVideo: sql<boolean>`(
          SELECT EXISTS (
            SELECT 1
            FROM ${playlistVideos} pv
            WHERE pv.playlist_id = ${playlists.id}
            AND pv.video_id = ${videoId}
          )
        )`,
        })
        .from(playlists)
        .innerJoin(users, eq(playlists.userId, users.id))
        .where(
          and(
            eq(playlists.userId, userId),
            eq(playlists.isMixPlaylist, true),
            cursor
              ? or(
                  lt(playlists.updatedAt, cursor.updatedAt),
                  and(
                    eq(playlists.updatedAt, cursor.updatedAt),
                    lt(playlists.id, cursor.id),
                  ),
                )
              : undefined,
          ),
        )
        .orderBy(desc(playlists.updatedAt), desc(playlists.id))
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

      return {
        items,
        nextCursor,
      };
    }),
  createMixPlaylist: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        videoIds: z.array(z.string().uuid()).default([]),
        description: z.string().optional(),
        visibility: z.enum(["public", "private"]).default("public"), // ✅ Thêm field này
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { name, videoIds, description, visibility } = input;
      const { id: userId } = ctx.user;

      // Kiểm tra tất cả video là của chủ user
      if (videoIds.length > 0) {
        const userVideos = await db
          .select()
          .from(videos)
          .where(and(eq(videos.userId, userId), inArray(videos.id, videoIds)));

        if (userVideos.length !== videoIds.length) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Chỉ chủ sở hữu video mới có quyền tạo playlist kết hợp",
          });
        }
      }
      // Tạo playlist mix với visibility
      const [playlist] = await db
        .insert(playlists)
        .values({
          userId,
          name,
          description,
          isMixPlaylist: true,
          visibility, // ✅ dùng input.visibility
        })
        .returning();

      if (!playlist) throw new TRPCError({ code: "BAD_REQUEST" });

      // Thêm video vào playlist
      if (videoIds.length > 0) {
        await db.insert(playlistVideos).values(
          videoIds.map((id) => ({
            playlistId: playlist.id,
            videoId: id,
          })),
        );
      }

      return playlist;
    }),
  getPublicMixPlaylists: publicProcedure.query(async () => {
    const playlistsData = await db
      .select()
      .from(playlists)
      .where(
        and(
          eq(playlists.visibility, "public"),
          eq(playlists.isMixPlaylist, true),
        ),
      )
      .orderBy(desc(playlists.updatedAt));

    const result = [];

    for (const playlist of playlistsData) {
      const playlistVideosData = await db
        .select({
          id: videos.id,
          title: videos.title,
          description: videos.description,
          thumbnail: videos.thumbnailUrl,
          createdAt: videos.createdAt,
          updatedAt: videos.updatedAt,
        })
        .from(videos)
        .innerJoin(playlistVideos, eq(playlistVideos.videoId, videos.id))
        .where(eq(playlistVideos.playlistId, playlist.id))
        .orderBy(playlistVideos.createdAt);

      if (playlistVideosData.length === 0) continue;

      result.push({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        videos: playlistVideosData,
        videoCount: playlistVideosData.length,
        thumbnail: playlistVideosData[0]?.thumbnail || "/placeholder.jpg",
      });
    }

    return result;
  }),
  updateVisibility: protectedProcedure
    .input(
      z.object({
        playlistId: z.string().uuid(),
        visibility: z.enum(["public", "private"]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { playlistId, visibility } = input;
      const { id: userId } = ctx.user;

      const [updated] = await db
        .update(playlists)
        .set({ visibility })
        .where(
          and(
            eq(playlists.id, playlistId),
            eq(playlists.userId, userId), // ✅ CHẶN NGƯỜI KHÁC
          ),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Bạn không có quyền chỉnh sửa danh sách này",
        });
      }

      return updated;
    }),
  getManyByUser: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        cursor: z
          .object({
            id: z.string().uuid(),
            updatedAt: z.date(),
          })
          .nullish(),
        limit: z.number().min(1).max(100),
      }),
    )
    .query(async ({ input }) => {
      const { userId, cursor, limit } = input;

      const data = await db
        .select({
          ...getTableColumns(playlists),
          videoCount: db.$count(
            playlistVideos,
            eq(playlists.id, playlistVideos.playlistId),
          ),
          user: users,
          thumbnailUrl: sql<string | null>`(
          SELECT v.thumbnail_url
          FROM ${playlistVideos} pv
          JOIN ${videos} v ON v.id = pv.video_id
          WHERE pv.playlist_id = ${playlists.id}
          ORDER BY pv.created_at ASC
          LIMIT 1
        )`,
          firstVideoId: sql<string | null>`(
          SELECT pv.video_id
          FROM ${playlistVideos} pv
          WHERE pv.playlist_id = ${playlists.id}
          ORDER BY pv.created_at ASC
          LIMIT 1
        )`,
        })
        .from(playlists)
        .innerJoin(users, eq(playlists.userId, users.id))
        .where(
          and(
            eq(playlists.userId, userId),
            eq(playlists.visibility, "public"),
            cursor
              ? or(
                  lt(playlists.updatedAt, cursor.updatedAt),
                  and(
                    eq(playlists.updatedAt, cursor.updatedAt),
                    lt(playlists.id, cursor.id),
                  ),
                )
              : undefined,
          ),
        )
        .orderBy(desc(playlists.updatedAt), desc(playlists.id))
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

      return {
        items,
        nextCursor,
      };
    }),
  addVideo: protectedProcedure
    .input(
      z.object({
        playlistId: z.string().uuid(),
        videoId: z.string().uuid(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { playlistId, videoId } = input;
      const { id: userId } = ctx.user;

      const [existingPlaylist] = await db
        .select()
        .from(playlists)
        .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)));

      if (!existingPlaylist) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [existingVideo] = await db
        .select()
        .from(videos)
        .where(eq(videos.id, videoId));

      if (!existingVideo) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [existingPlaylistVideo] = await db
        .select()
        .from(playlistVideos)
        .where(
          and(
            eq(playlistVideos.playlistId, playlistId),
            eq(playlistVideos.videoId, videoId),
          ),
        );

      if (existingPlaylistVideo) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Video đã tồn tại trong danh sách",
        });
      }

      const [createdPlaylistVideo] = await db
        .insert(playlistVideos)
        .values({
          playlistId,
          videoId,
        })
        .returning();

      await db
        .update(playlists)
        .set({ updatedAt: new Date() })
        .where(eq(playlists.id, playlistId));

      return createdPlaylistVideo;
    }),
  getManyForVideo: protectedProcedure
    .input(
      z.object({
        videoId: z.string().uuid(),
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
      const { cursor, limit, videoId } = input;

      const data = await db
        .select({
          ...getTableColumns(playlists),
          videoCount: db.$count(
            playlistVideos,
            eq(playlists.id, playlistVideos.playlistId),
          ),
          user: users,
          containsVideo: videoId
            ? sql<boolean>`(
              SELECT EXISTS (
                SELECT 1
                FROM ${playlistVideos} pv
                WHERE pv.playlist_id = ${playlists.id} AND pv.video_id = ${videoId}
              )
            )`
            : sql<boolean>`false`,
        })
        .from(playlists)
        .innerJoin(users, eq(playlists.userId, users.id))
        .where(
          and(
            eq(playlists.userId, userId),
            eq(playlists.isMixPlaylist, false), // ✅ CHỈ LẤY PLAYLIST THƯỜNG
            cursor
              ? or(
                  lt(playlists.updatedAt, cursor.updatedAt),
                  and(
                    eq(playlists.updatedAt, cursor.updatedAt),
                    lt(playlists.id, cursor.id),
                  ),
                )
              : undefined,
          ),
        )
        .orderBy(desc(playlists.updatedAt), desc(playlists.id))
        // Add 1 to the limit to check if there is more data
        .limit(limit + 1);

      const hasMore = data.length > limit;
      // Remove the last item if there is more data
      const items = hasMore ? data.slice(0, -1) : data;
      // Set the next cursor to the last item if there is more data
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore
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
  getMany: protectedProcedure
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

      const data = await db
        .select({
          ...getTableColumns(playlists),
          videoCount: db.$count(
            playlistVideos,
            eq(playlists.id, playlistVideos.playlistId),
          ),
          user: users,

          thumbnailUrl: sql<string | null>`(
          SELECT v.thumbnail_url
          FROM ${playlistVideos} pv
          JOIN ${videos} v ON v.id = pv.video_id
          WHERE pv.playlist_id = ${playlists.id}
          ORDER BY pv.created_at ASC
          LIMIT 1
        )`,

          firstVideoId: sql<string | null>`(
          SELECT pv.video_id
          FROM ${playlistVideos} pv
          WHERE pv.playlist_id = ${playlists.id}
          ORDER BY pv.created_at ASC
          LIMIT 1
        )`,
        })
        .from(playlists)
        .innerJoin(users, eq(playlists.userId, users.id))
        .where(
          and(
            eq(playlists.userId, userId),
            cursor
              ? or(
                  lt(playlists.updatedAt, cursor.updatedAt),
                  and(
                    eq(playlists.updatedAt, cursor.updatedAt),
                    lt(playlists.id, cursor.id),
                  ),
                )
              : undefined,
          ),
        )
        .orderBy(desc(playlists.updatedAt), desc(playlists.id))
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

      return {
        items,
        nextCursor,
      };
    }),
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        visibility: z.enum(["public", "private"]).default("private"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { name, visibility } = input;
      const { id: userId } = ctx.user;

      const [createdPlaylist] = await db
        .insert(playlists)
        .values({
          userId,
          name,
          visibility,
          isMixPlaylist: false, // ✅ playlist thường
        })
        .returning();

      if (!createdPlaylist) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      return createdPlaylist;
    }),
  getHistoryTracking: publicProcedure.query(async ({ ctx }) => {
    // Lấy ID từ Clerk
    const clerkUserId = ctx.clerkUserId;
    if (!clerkUserId) return false; // guest không có quyền tracking → trả về false

    // Lấy user từ DB
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUserId));

    // Trả về trackHistory hoặc false nếu không có
    return user?.trackHistory ?? false;
  }),
  getLiked: protectedProcedure
    .input(
      z.object({
        cursor: z
          .object({
            id: z.string().uuid(),
            likedAt: z.date(),
          })
          .nullish(),
        limit: z.number().min(1).max(100),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      const { cursor, limit } = input;

      // Subquery: video user đã like
      const viewerVideoReactions = db.$with("viewer_video_reactions").as(
        db
          .select({
            videoId: videoReactions.videoId,
            likedAt: videoReactions.updatedAt,
          })
          .from(videoReactions)
          .where(
            and(
              eq(videoReactions.userId, userId),
              eq(videoReactions.type, "like"),
            ),
          ),
      );

      // Subquery: lấy progress của user trong videoViews
      const viewerVideoProgress = db.$with("viewer_video_progress").as(
        db
          .select({
            videoId: videoViews.videoId,
            progress: videoViews.progress,
          })
          .from(videoViews)
          .where(eq(videoViews.userId, userId)),
      );

      const data = await db
        .with(viewerVideoReactions, viewerVideoProgress)
        .select({
          ...getTableColumns(videos),
          user: users,
          likedAt: viewerVideoReactions.likedAt,
          progress: viewerVideoProgress.progress, // 🔹 Thêm progress
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
        .innerJoin(
          viewerVideoReactions,
          eq(videos.id, viewerVideoReactions.videoId),
        )
        .leftJoin(
          viewerVideoProgress,
          eq(videos.id, viewerVideoProgress.videoId),
        )
        .where(
          and(
            eq(videos.visibility, "public"),
            cursor
              ? or(
                  lt(viewerVideoReactions.likedAt, cursor.likedAt),
                  and(
                    eq(viewerVideoReactions.likedAt, cursor.likedAt),
                    lt(videos.id, cursor.id),
                  ),
                )
              : undefined,
          ),
        )
        .orderBy(desc(viewerVideoReactions.likedAt), desc(videos.id))
        .limit(limit + 1);

      const hasMore = data.length > limit;
      const items = hasMore ? data.slice(0, -1) : data;
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore
        ? {
            id: lastItem.id,
            likedAt: lastItem.likedAt,
          }
        : null;

      return { items, nextCursor };
    }),
  removeFromHistory: protectedProcedure
    .input(z.object({ videoId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { videoId } = input;
      const { id: userId } = ctx.user;

      const [deleted] = await db
        .delete(videoViews)
        .where(
          and(eq(videoViews.userId, userId), eq(videoViews.videoId, videoId)),
        )
        .returning();

      if (!deleted) throw new TRPCError({ code: "NOT_FOUND" });
      return deleted;
    }),
  clearHistory: protectedProcedure.mutation(async ({ ctx }) => {
    const { id: userId } = ctx.user;

    await db.delete(videoViews).where(eq(videoViews.userId, userId));

    return { success: true };
  }),
  toggleHistoryTracking: protectedProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const { enabled } = input;
      const { id: userId } = ctx.user;

      // Giả sử bạn có field 'trackHistory' trong bảng users
      const [updated] = await db
        .update(users)
        .set({ trackHistory: enabled })
        .where(eq(users.id, userId))
        .returning();

      return updated;
    }),
  getHistory: protectedProcedure
    .input(
      z.object({
        cursor: z
          .object({
            id: z.string().uuid(),
            viewedAt: z.date(),
          })
          .nullish(),
        limit: z.number().min(1).max(100),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      const { cursor, limit } = input;

      const viewerVideoViews = db.$with("viewer_video_views").as(
        db
          .select({
            videoId: videoViews.videoId,
            viewedAt: videoViews.updatedAt,
            progress: videoViews.progress, // 🔴 giữ progress
          })
          .from(videoViews)
          .where(eq(videoViews.userId, userId)),
      );

      const data = await db
        .with(viewerVideoViews)
        .select({
          ...getTableColumns(videos),
          user: users,
          viewedAt: viewerVideoViews.viewedAt,
          progress: viewerVideoViews.progress, // 🔴 join progress vào output
          viewCount: videos.viewsCount, // 🔹 dùng tổng viewCount từ videos
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
        .innerJoin(viewerVideoViews, eq(videos.id, viewerVideoViews.videoId))
        .where(
          and(
            eq(videos.visibility, "public"),
            cursor
              ? or(
                  lt(viewerVideoViews.viewedAt, cursor.viewedAt),
                  and(
                    eq(viewerVideoViews.viewedAt, cursor.viewedAt),
                    lt(videos.id, cursor.id),
                  ),
                )
              : undefined,
          ),
        )
        .orderBy(desc(viewerVideoViews.viewedAt), desc(videos.id))
        .limit(limit + 1);

      const hasMore = data.length > limit;
      const items = hasMore ? data.slice(0, -1) : data;
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore
        ? {
            id: lastItem.id,
            viewedAt: lastItem.viewedAt,
          }
        : null;

      return { items, nextCursor };
    }),
});
