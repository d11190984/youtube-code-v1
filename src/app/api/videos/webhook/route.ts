"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { UTApi } from "uploadthing/server";
import cloudinary from "@/lib/cloudinary";

import { db } from "@/db";
import { mux } from "@/lib/mux";
import { videos } from "@/db/schema";

type MuxWebhookEvent = {
  type: string;
  data: any;
};

const SIGNING_SECRET = process.env.MUX_WEBHOOK_SECRET!;
if (!SIGNING_SECRET) {
  throw new Error("MUX_WEBHOOK_SECRET not set");
}

export const POST = async (request: Request) => {
  const headersList = headers();
  const muxSignature = (await headersList).get("mux-signature");

  if (!muxSignature) {
    return new Response("No signature", { status: 401 });
  }

  let payload: MuxWebhookEvent;

  try {
    const rawBody = await request.text();

    await mux.webhooks.verifySignature(
      rawBody,
      {
        "mux-signature": muxSignature,
      },
      SIGNING_SECRET,
    );

    payload = JSON.parse(rawBody);
  } catch (error) {
    console.log("❌ MUX VERIFY ERROR:", error);
    return new Response("Invalid signature", { status: 401 });
  }

  const updateVideo = async (
    uploadId: string | undefined,
    muxStatus: string,
    updateFields: Record<string, any> = {},
  ) => {
    if (!uploadId) return;

    await db
      .update(videos)
      .set({
        muxStatus,
        ...updateFields,
      })
      .where(eq(videos.muxUploadId, uploadId));
  };

  try {
    switch (payload.type) {
      case "video.asset.created": {
        const data = payload.data;

        await updateVideo(data.upload_id, data.status, {
          muxAssetId: data.id,
        });

        console.log("✅ Video asset created:", data.upload_id);
        break;
      }

      case "video.asset.ready": {
        const data = payload.data;

        const playbackId = data.playback_ids?.[0]?.id;
        if (!playbackId) {
          return new Response("Missing playbackId", { status: 400 });
        }

        const duration = data.duration ? Math.round(data.duration * 1000) : 0;

        let thumbnailUrl: string | undefined;
        let thumbnailKey: string | undefined;
        let previewUrl: string | undefined;
        let previewKey: string | undefined;

        try {
          const utapi = new UTApi();

          const randomPercent = Math.floor(Math.random() * 90) + 5;
          const width = 1280;
          const height = 720;

          // upload thumbnail png -> UploadThing
          const thumb = await utapi.uploadFilesFromUrl(
            `https://image.mux.com/${playbackId}/thumbnail.png?width=${width}&height=${height}&time=${randomPercent}`,
          );

          if (thumb.data) {
            thumbnailUrl = thumb.data.url;
            thumbnailKey = thumb.data.key;
          }

          // upload animated gif -> Cloudinary
          const gif = await cloudinary.uploader.upload(
            `https://image.mux.com/${playbackId}/animated.gif`,
            {
              resource_type: "image",
              folder: "mux-previews",
              public_id: playbackId,
              overwrite: true,
            },
          );

          previewUrl = gif.secure_url;
          previewKey = gif.public_id;
        } catch (mediaErr) {
          console.log("⚠️ Thumbnail/Gif upload fail:", mediaErr);
        }

        await updateVideo(data.upload_id, "ready", {
          muxPlaybackId: playbackId,
          muxAssetId: data.id,
          thumbnailUrl,
          thumbnailKey,
          previewUrl,
          previewKey,
          duration,
        });

        console.log("✅ Video ready:", data.upload_id);
        break;
      }

      case "video.asset.errored": {
        const data = payload.data;

        await updateVideo(data.upload_id, "errored");

        console.log("❌ Video errored:", data.upload_id);
        break;
      }

      case "video.asset.deleted": {
        const data = payload.data;

        if (data.playback_ids?.[0]?.id) {
          try {
            await cloudinary.uploader.destroy(
              `mux-previews/${data.playback_ids[0].id}`,
              {
                resource_type: "image",
              },
            );
          } catch (err) {
            console.log("⚠️ Cloudinary delete fail:", err);
          }
        }

        if (data.upload_id) {
          await db.delete(videos).where(eq(videos.muxUploadId, data.upload_id));
        }

        console.log("🗑️ Video deleted:", data.upload_id);
        break;
      }

      case "video.asset.track.ready": {
        const data = payload.data;

        await db
          .update(videos)
          .set({
            muxTrackId: data.id,
            muxTrackStatus: data.status,
          })
          .where(eq(videos.muxAssetId, data.asset_id));

        console.log("✅ Track ready:", data.asset_id);
        break;
      }

      case "video.asset.static_renditions.ready": {
        const data = payload.data;

        console.log("🔥 STATIC MP4 READY:", data.id);
        break;
      }

      default:
        console.log("ℹ️ Unhandled webhook:", payload.type);
    }

    return new Response("Webhook processed", { status: 200 });
  } catch (error) {
    console.log("❌ WEBHOOK PROCESS ERROR:", error);
    return new Response("Webhook process failed", { status: 500 });
  }
};
