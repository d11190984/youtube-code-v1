"use client";

import { useMemo, useState, useEffect } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { enUS, vi, ja, ko, zhCN, de, es, fr } from "date-fns/locale";
import { useTranslations, useLocale } from "next-intl";

const dateFnsLocales = {
  en: enUS,
  vi: vi,
  ja: ja,
  ko: ko,
  zh: zhCN,
  de: de,
  es: es,
  fr: fr,
};

import { VideoOwner } from "./video-owner";
import { VideoReactions } from "./video-reactions";
import { VideoMenu } from "./video-menu";
import { VideoDescription } from "./video-description";
import { VideoGetOneOutput } from "../../types";
import { VideoPlaybackMenu } from "./video-playback-menu";
import { Button } from "@/components/ui/button";
import { ExternalLinkIcon } from "lucide-react";
import { toast } from "sonner";
import { usePlayerStore } from "@/modules/videos/store/use-player-store";

interface VideoTopRowProps {
  video: VideoGetOneOutput;
  playerRef: React.RefObject<any>; // 🔹 ref tới MuxPlayer
  autoNextEnabled: boolean;
  setAutoNextEnabledAction: (v: boolean) => void;
  loopEnabled: boolean;
  setLoopEnabledAction: (v: boolean) => void;
}

export const VideoTopRowSkeleton = () => (
  <div className="flex flex-col gap-4 mt-4">
    <div className="h-6 w-4/5 bg-gray-300 rounded" />
    <div className="h-5 w-3/5 bg-gray-300 rounded" />
  </div>
);

export const VideoTopRow = ({
  video,
  playerRef,
  autoNextEnabled,
  setAutoNextEnabledAction,
  loopEnabled,
  setLoopEnabledAction,
}: VideoTopRowProps) => {
  const t = useTranslations("Video");
  const locale = useLocale();
  const { setVideo, minimize } = usePlayerStore();
  const [playbackRate, setPlaybackRate] = useState(1);

  // Áp dụng playbackRate trực tiếp
  useEffect(() => {
    if (playerRef.current) playerRef.current.playbackRate = playbackRate;
  }, [playbackRate, playerRef]);

  const compactViews = useMemo(
    () =>
      Intl.NumberFormat(locale, { notation: "compact" }).format(
        video.viewCount,
      ),
    [video.viewCount, locale],
  );

  const expandedViews = useMemo(
    () => Intl.NumberFormat(locale).format(video.viewCount),
    [video.viewCount, locale],
  );

  const compactDate = useMemo(
    () =>
      formatDistanceToNowStrict(new Date(video.createdAt), {
        addSuffix: true,
        locale: dateFnsLocales[locale as keyof typeof dateFnsLocales] || enUS,
      }),
    [video.createdAt, locale],
  );

  const expandedDate = useMemo(
    () => new Date(video.createdAt).toLocaleDateString(locale),
    [video.createdAt, locale],
  );
  const handlePiP = async () => {
    const player = playerRef.current;
    if (!player) return;

    const video: any = player.media || player.video || player.shadowRoot?.querySelector("video") || document.querySelector("video");
    if (!video) return toast.error(t("error") || "Video not found");

    try {
      const videoEl: any = player.nativeEl || player.media || player.video || player.shadowRoot?.querySelector("video") || document.querySelector("video");
      
      if (!videoEl) return toast.error(t("error") || "Player not found");

      // Ép mở khóa mạnh mẽ hơn cho các dòng máy kén chọn
      videoEl.disablePictureInPicture = false;
      videoEl.removeAttribute("disablePictureInPicture");
      videoEl.setAttribute("picture-in-picture", "true");

      if (videoEl.paused) await videoEl.play();

      // Thử dùng chuẩn W3C trước
      if (videoEl.requestPictureInPicture) {
        try {
          await videoEl.requestPictureInPicture();
          return; // Thành công
        } catch (innerErr) {
          console.warn("W3C PiP failed, trying fallbacks...", innerErr);
        }
      }

      // Thử dùng chuẩn Webkit (Safari/iPhone)
      if (videoEl.webkitSetPresentationMode) {
        videoEl.webkitSetPresentationMode("picture-in-picture");
      } else {
        toast.error("This browser has blocked Popups.");
      }
    } catch (err: any) {
      console.error("PiP Error:", err);
      // Fallback: Nếu không mở được Popup hệ thống, dùng Mini-player của ứng dụng
      setVideo({
        id: video.id,
        title: video.title,
        playbackId: video.muxPlaybackId,
        thumbnailUrl: video.thumbnailUrl || undefined,
      });
      minimize();
      toast.info("Switched to Mini-player due to browser Popup blocking");
    }
  };

  return (
    <div className="flex flex-col gap-4 mt-4">
      <h1 className="text-xl font-semibold">{video.title}</h1>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <VideoOwner user={video.user} videoId={video.id} />

        <div className="flex overflow-x-auto sm:min-w-[calc(50%-6px)] sm:justify-end sm:overflow-visible pb-2 -mb-2 sm:pb-0 sm:mb-0 gap-2">
          <VideoReactions
            videoId={video.id}
            likes={video.likeCount}
            dislikes={video.dislikeCount}
            viewerReaction={video.viewerReaction}
            showLikeCount={video.showLikeCount}
          />

          <Button 
            variant="secondary" 
            className="rounded-full px-4 font-bold text-xs flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 border-none h-9"
            onClick={handlePiP}
            title="Popup"
          >
            <ExternalLinkIcon className="size-4" />
            <span className="hidden md:inline">Popup</span>
          </Button>

          {/* 🔹 VideoPlaybackMenu tự động lấy track từ playerRef */}
          <VideoPlaybackMenu
            video={video}
            playerRef={playerRef}
            playbackId={video.muxPlaybackId}
            assetId={video.muxAssetId}
            playbackRate={playbackRate}
            setPlaybackRate={setPlaybackRate}
            autoNextEnabled={autoNextEnabled}
            setAutoNextEnabledAction={setAutoNextEnabledAction}
            loopEnabled={loopEnabled}
            setLoopEnabledAction={setLoopEnabledAction}
          />

          <VideoMenu videoId={video.id} variant="secondary" />
        </div>
      </div>

      <VideoDescription
        compactViews={compactViews}
        expandedViews={expandedViews}
        compactDate={compactDate}
        expandedDate={expandedDate}
        description={video.description}
      />
    </div>
  );
};
