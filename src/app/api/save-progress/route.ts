import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, videoViews, videos } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false });

    const raw = await req.text();
    if (!raw) return NextResponse.json({ ok: false });

    const { videoId, progress } = JSON.parse(raw);
    if (!videoId) return NextResponse.json({ ok: false });

    const [me] = await db.select().from(users).where(eq(users.clerkId, clerkId));
    if (!me || !me.trackHistory) return NextResponse.json({ ok: true });

    const [videoInfo] = await db
      .select({
        duration: videos.duration,
      })
      .from(videos)
      .where(eq(videos.id, videoId));

    if (!videoInfo) return NextResponse.json({ ok: false });

    const [existing] = await db
      .select()
      .from(videoViews)
      .where(
        and(eq(videoViews.userId, me.id), eq(videoViews.videoId, videoId)),
      );

    const oldProgress = existing?.progress ?? 0;
    const newProgress = Math.max(0, Math.floor(progress || 0));

    // ✅ nếu beacon gửi completed hoặc gần completed -> bỏ qua
    if (videoInfo.duration > 0 && newProgress >= videoInfo.duration * 0.95) {
      return NextResponse.json({ ok: true });
    }

    // ✅ chặn beacon 0 giả đè progress cũ
    if (newProgress === 0 && oldProgress > 5) {
      return NextResponse.json({ ok: true });
    }

    // ✅ chặn beacon progress lùi mạnh
    if (newProgress < oldProgress - 3) {
      return NextResponse.json({ ok: true });
    }

    await db
      .insert(videoViews)
      .values({
        userId: me.id,
        videoId,
        progress: newProgress,
      })
      .onConflictDoUpdate({
        target: [videoViews.userId, videoViews.videoId],
        set: {
          progress: newProgress,
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.log("SAVE PROGRESS BEACON ERROR:", err);
    return NextResponse.json({ ok: false });
  }
}
