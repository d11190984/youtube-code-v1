import { z } from "zod";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { commentReactions } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const commentReactionsRouter = createTRPCRouter({
  like: protectedProcedure
    .input(z.object({ commentId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { commentId } = input;
      const { id: userId } = ctx.user;

      const [existingReaction] = await db
        .select()
        .from(commentReactions)
        .where(
          and(
            eq(commentReactions.commentId, commentId),
            eq(commentReactions.userId, userId),
          )
        );

      if (existingReaction) {
        if (existingReaction.type === "like") {
          const [deletedViewerReaction] = await db
            .delete(commentReactions)
            .where(
              and(
                eq(commentReactions.userId, userId),
                eq(commentReactions.commentId, commentId)
              )
            )
            .returning();
          return deletedViewerReaction;
        } else {
          const [updatedReaction] = await db
            .update(commentReactions)
            .set({ type: "like" })
            .where(
              and(
                eq(commentReactions.userId, userId),
                eq(commentReactions.commentId, commentId)
              )
            )
            .returning();
          return updatedReaction;
        }
      }

      const [createdCommentReaction] = await db
        .insert(commentReactions)
        .values({ userId, commentId, type: "like" })
        .returning();

      return createdCommentReaction;
    }),
  dislike: protectedProcedure
    .input(z.object({ commentId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { commentId } = input;
      const { id: userId } = ctx.user;

      const [existingReaction] = await db
        .select()
        .from(commentReactions)
        .where(
          and(
            eq(commentReactions.commentId, commentId),
            eq(commentReactions.userId, userId),
          )
        );

      if (existingReaction) {
        if (existingReaction.type === "dislike") {
          const [deletedViewerReaction] = await db
            .delete(commentReactions)
            .where(
              and(
                eq(commentReactions.userId, userId),
                eq(commentReactions.commentId, commentId)
              )
            )
            .returning();
          return deletedViewerReaction;
        } else {
          const [updatedReaction] = await db
            .update(commentReactions)
            .set({ type: "dislike" })
            .where(
              and(
                eq(commentReactions.userId, userId),
                eq(commentReactions.commentId, commentId)
              )
            )
            .returning();
          return updatedReaction;
        }
      }

      const [createdCommentReaction] = await db
        .insert(commentReactions)
        .values({ userId, commentId, type: "dislike" })
        .returning();

      return createdCommentReaction;
    }),
});
