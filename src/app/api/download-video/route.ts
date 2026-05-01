export const runtime = "nodejs";
export const maxDuration = 300;

import { NextRequest } from "next/server";
import ffmpeg from "fluent-ffmpeg";
import { PassThrough } from "stream";
import path from "path";
import fs from "fs";

const ffmpegBinary = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";

const ffmpegRealPath = path.join(
  process.cwd(),
  "node_modules",
  "ffmpeg-static",
  ffmpegBinary,
);

console.log("REAL FFMPEG PATH:", ffmpegRealPath);
console.log("FFMPEG EXISTS:", fs.existsSync(ffmpegRealPath));

ffmpeg.setFfmpegPath(ffmpegRealPath);

export async function GET(req: NextRequest) {
  const playbackId = req.nextUrl.searchParams.get("playbackId");

  if (!playbackId) {
    return new Response("Missing playbackId", { status: 400 });
  }

  const m3u8Url = `https://stream.mux.com/${playbackId}.m3u8`;
  console.log("DOWNLOAD START:", m3u8Url);

  const nodeStream = new PassThrough();

  ffmpeg()
    .input(m3u8Url)
    .inputOptions([
      "-protocol_whitelist",
      "file,http,https,tcp,tls,crypto",
    ])
    .outputOptions([
      "-movflags",
      "frag_keyframe+empty_moov",
      "-c:v",
      "copy",
      "-c:a",
      "copy",
      "-f",
      "mp4",
    ])
    .on("start", (cmd) => {
      console.log("FFMPEG CMD:", cmd);
    })
    .on("error", (err: Error, stdout: any, stderr: any) => {
      console.log("FFMPEG ERROR:", err);
      console.log("STDOUT:", stdout);
      console.log("STDERR:", stderr);
      nodeStream.destroy(err);
    })
    .on("end", () => {
      console.log("FFMPEG END");
      nodeStream.end();
    })
    .pipe(nodeStream, { end: true });

  const webStream = new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk) => controller.enqueue(chunk));
      nodeStream.on("end", () => controller.close());
      nodeStream.on("error", (err) => controller.error(err));
    },
  });

  return new Response(webStream, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Disposition": `attachment; filename="video-${playbackId}.mp4"`,
      "Cache-Control": "no-store",
    },
  });
}