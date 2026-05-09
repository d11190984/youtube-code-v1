import { z } from "zod";
import { eq, getTableColumns, inArray, isNotNull,sql  } from "drizzle-orm";

import { db } from "@/db";
import { TRPCError } from "@trpc/server";
import { subscriptions, users, videos } from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";

export const usersRouter = createTRPCRouter({
  // GET ONE USER
  getOne: baseProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const { clerkUserId } = ctx;

      let userId;

      const [user] = await db
        .select()
        .from(users)
        .where(
          clerkUserId ? inArray(users.clerkId, [clerkUserId]) : sql`1=0`, // guest vẫn hợp lệ
        );

      if (user) {
        userId = user.id;
      }

      const viewerSubscriptions = db.$with("viewer_subscriptions").as(
        db
          .select()
          .from(subscriptions)
          .where(
            userId ? inArray(subscriptions.viewerId, [userId]) : sql`1=0`, // guest không subscribe ai
          ),
      );

      const [existingUser] = await db
        .with(viewerSubscriptions)
        .select({
          ...getTableColumns(users),
          viewerSubscribed: isNotNull(viewerSubscriptions.viewerId).mapWith(
            Boolean,
          ),
          videoCount: db.$count(videos, eq(videos.userId, users.id)),
          subscriberCount: db.$count(
            subscriptions,
            eq(subscriptions.creatorId, users.id),
          ),
          viewCount: sql<number>`COALESCE((SELECT SUM(${videos.viewsCount}) FROM ${videos} WHERE ${videos.userId} = ${users.id}), 0)`.mapWith(Number),
          bio: users.bio,
        })
        .from(users)
        .leftJoin(
          viewerSubscriptions,
          eq(viewerSubscriptions.creatorId, users.id),
        )
        .where(eq(users.id, input.id));

      if (!existingUser) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return existingUser;
    }),

  // UPDATE BIO
  updateBio: baseProcedure
    .input(z.object({ bio: z.string().max(200) })) // giới hạn 200 ký tự
    .mutation(async ({ input, ctx }) => {
      const { clerkUserId } = ctx; // ID của chính chủ

      if (!clerkUserId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const [updatedUser] = await db
        .update(users)
        .set({ bio: input.bio, updatedAt: new Date() })
        .where(eq(users.clerkId, clerkUserId))
        .returning();

      if (!updatedUser) throw new TRPCError({ code: "NOT_FOUND" });

      return updatedUser;
    }),
  // GET CURRENT USER
  getCurrent: baseProcedure
    .query(async ({ ctx }) => {
      const { clerkUserId } = ctx;

      if (!clerkUserId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const [user] = await db
        .select({
          ...getTableColumns(users),
          videoCount: db.$count(videos, eq(videos.userId, users.id)),
          subscriberCount: db.$count(
            subscriptions,
            eq(subscriptions.creatorId, users.id),
          ),
        })
        .from(users)
        .where(eq(users.clerkId, clerkUserId));

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return user;
    }),
  // UPDATE CHANNEL
  updateChannel: baseProcedure
    .input(z.object({
      name: z.string().min(1).max(50).optional(),
      bio: z.string().max(1000).optional(),
      handle: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { clerkUserId } = ctx;

      if (!clerkUserId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const [updatedUser] = await db
        .update(users)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(users.clerkId, clerkUserId))
        .returning();

      if (!updatedUser) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return updatedUser;
    }),
});
