export const runtime = "nodejs";

import { NextRequest } from "next/server";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import os from "os";

// 🔥 lấy path ffmpeg thật từ node_modules
const ffmpegRealPath = path.join(
  process.cwd(),
  "node_modules",
  "ffmpeg-static",
  "ffmpeg.exe",
);

ffmpeg.setFfmpegPath(ffmpegRealPath);

export async function GET(req: NextRequest) {
  const playbackId = req.nextUrl.searchParams.get("playbackId");

  if (!playbackId) {
    return new Response("Missing playbackId", { status: 400 });
  }

  const m3u8Url = `https://stream.mux.com/${playbackId}.m3u8`;
  const tempFile = path.join(os.tmpdir(), `${playbackId}-${Date.now()}.mp4`);

  console.log("DOWNLOAD START:", m3u8Url);
  console.log("REAL FFMPEG PATH:", ffmpegRealPath);

  return new Promise<Response>((resolve) => {
    ffmpeg()
      .input(m3u8Url)
      .inputOptions([
        "-protocol_whitelist",
        "file,http,https,tcp,tls,crypto",
      ])
      .outputOptions([
        "-movflags +faststart",
        "-c:v copy",
        "-c:a copy",
      ])
      .on("start", (cmd) => {
        console.log("FFMPEG CMD:", cmd);
      })
      .on("progress", (p) => {
        console.log("Processing:", p.percent);
      })
      .on("end", async () => {
        console.log("FFMPEG END");

        try {
          const fileBuffer = await fs.promises.readFile(tempFile);

          resolve(
            new Response(fileBuffer, {
              headers: {
                "Content-Type": "video/mp4",
                "Content-Disposition": `attachment; filename="video-${playbackId}.mp4"`,
              },
            }),
          );

          setTimeout(() => {
            if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
          }, 10000);
        } catch (e) {
          console.log("READ ERROR:", e);
          resolve(new Response("Read failed", { status: 500 }));
        }
      })
      .on("error", (err: Error, stdout: any, stderr: any) => {
        console.log("FFMPEG ERROR:", err);
        console.log("STDOUT:", stdout);
        console.log("STDERR:", stderr);
        resolve(new Response("Convert failed", { status: 500 }));
      })
      .save(tempFile);
  });
}