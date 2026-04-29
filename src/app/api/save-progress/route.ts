import { db } from "@/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";

import { users, videoViews } from "@/db/schema";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ success: false, reason: "unauthorized" });
    }

    // parse body an toàn
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ success: false, reason: "invalid_body" });
    }

    const { videoId, progress } = body;

    if (!videoId || typeof progress !== "number") {
      return NextResponse.json({ success: false, reason: "missing_data" });
    }

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkId));

    if (!user) {
      return NextResponse.json({ success: false, reason: "user_not_found" });
    }

    // ✅ chỉ tăng chứ không tụt progress
    await db
      .insert(videoViews)
      .values({
        userId: user.id,
        videoId,
        progress,
      })
      .onConflictDoUpdate({
        target: [videoViews.userId, videoViews.videoId],
        set: {
          progress: sql`GREATEST(${videoViews.progress}, ${progress})`,
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({
      success: true,
      savedProgress: progress,
    });
  } catch (error) {
    console.error("SAVE_PROGRESS_ERROR", error);

    return NextResponse.json({
      success: false,
      reason: "server_error",
    });
  }
}
