export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { mux } from "@/lib/mux";

export async function GET(req: NextRequest) {
  const assetId = req.nextUrl.searchParams.get("assetId");

  if (!assetId) {
    return new Response("Missing assetId", { status: 400 });
  }

  try {
    const asset: any = await mux.video.assets.retrieve(assetId);

    console.log("MUX ASSET RETRIEVE:", asset);

    const playbackId = asset.playback_ids?.[0]?.id;
    const staticFiles = asset.static_renditions?.files || [];

    if (!playbackId || !staticFiles.length) {
      return new Response("MP4 not ready", { status: 404 });
    }

    const bestMp4 = staticFiles.find((f: any) => f.ext === "mp4") || staticFiles[0];

    if (!bestMp4?.name) {
      return new Response("No MP4 file", { status: 404 });
    }

    const mp4Url = `https://stream.mux.com/${playbackId}/${bestMp4.name}`;

    console.log("REDIRECT TO:", mp4Url);

    return Response.redirect(mp4Url, 302);
  } catch (error) {
    console.log("DOWNLOAD VIDEO ERROR:", error);
    return new Response("Download failed", { status: 500 });
  }
}