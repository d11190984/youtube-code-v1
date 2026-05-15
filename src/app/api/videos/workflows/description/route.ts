import { serve } from "@upstash/workflow/nextjs";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { videos } from "@/db/schema";

interface InputType {
  userId: string;
  videoId: string;
}

export const { POST } = serve(async (context) => {

  const input = context.requestPayload as InputType;

  if (!input?.videoId || !input?.userId) {
    throw new Error("Missing videoId or userId");
  }

  const { videoId, userId } = input;

  // ================= GET VIDEO =================
  const video = await context.run("get-video", async () => {
    const [existingVideo] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));

    if (!existingVideo) throw new Error("Video not found");

    return existingVideo;
  });

  // ================= GET TRANSCRIPT =================
  const transcript = await context.run("get-transcript", async () => {
    if (!video.muxPlaybackId || !video.muxTrackId) {

      return "";
    }

    const trackUrl = `https://stream.mux.com/${video.muxPlaybackId}/text/${video.muxTrackId}.txt`;

    const res = await fetch(trackUrl);

    if (!res.ok) {

      return "";
    }

    const text = await res.text();

    if (!text || text.length < 50) {

      return "";
    }

    return text;
  });

  // ================= AI INPUT =================


  const isGoodTranscript = transcript && transcript.length > 200;

  const inputText = isGoodTranscript
    ? `
Transcript:
${transcript}
`
    : `
Video info:

Title: ${video.title || "unknown"}

Generate a short YouTube description based on this video.
`;

  // 🔥 PROMPT CHUẨN (ép AI không nói nhảm)
  const SYSTEM_PROMPT = `
Write ONLY a YouTube video description.

Rules:
- 2-3 sentences
- Max 200 characters
- No explanation
- No hashtags
- No emojis
- Match actual content
- Do NOT assume genre if unclear
`;

  const aiResponse = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
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
        max_tokens: 120,
        temperature: 0.7,
      }),
    },
  );

  if (!aiResponse.ok) {
    const err = await aiResponse.text();
    // AI error occurred
    throw new Error("AI request failed");
  }

  const data = await aiResponse.json();

  let description = data.choices?.[0]?.message?.content?.trim();

  // ================= CLEAN OUTPUT =================
  description = description?.split("\n")[0].replace(/[*"]/g, "").trim();

  // 🔥 ANTI RÁC
  if (
    !description ||
    description.length > 300 ||
    description.toLowerCase().includes("transcript") ||
    description.toLowerCase().includes("user")
  ) {


    description =
      video.description ||
      "Watch this video to discover the key highlights and main ideas.";
  }



  // ================= UPDATE DB =================
  await context.run("update-video", async () => {
    await db
      .update(videos)
      .set({
        description,
        updatedAt: new Date(),
      })
      .where(and(eq(videos.id, video.id), eq(videos.userId, video.userId)));
  });


});
