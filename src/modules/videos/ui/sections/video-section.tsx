"use client";

import { useTranslations } from "next-intl";
import { Suspense, useEffect, useState, useMemo, useRef } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { ErrorFallback } from "@/components/error-fallback";

import { THUMBNAIL_FALLBACK } from "../../constants";
import { VideoPlayer, VideoPlayerSkeleton } from "../components/video-player";
import { VideoTopRow, VideoTopRowSkeleton } from "../components/video-top-row";

interface VideoSectionProps {
  videoId: string;
  hideInfo?: boolean;
  loopEnabled?: boolean;
}
export const VideoSection = ({ videoId, hideInfo, loopEnabled }: VideoSectionProps) => {
  return (
    <Suspense fallback={<VideoSectionSkeleton />}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <VideoSectionSuspense 
          videoId={videoId} 
          hideInfo={hideInfo} 
          loopEnabled={loopEnabled} 
        />
      </ErrorBoundary>
    </Suspense>
  );
};

export const VideoSectionSkeleton = () => {
  return (
    <>
      <VideoPlayerSkeleton />
      <VideoTopRowSkeleton />
    </>
  );
};
type PlaylistVideo = {
  id: string;
  title: string;
  thumbnail?: string | null;
};

type Playlist = {
  id: string;
  name: string;
  videos: PlaylistVideo[];
};
const VideoSectionSuspense = ({ videoId, hideInfo, loopEnabled: loopEnabledProp }: VideoSectionProps) => {
  const t = useTranslations("Video");
  const params = useSearchParams();

  const [showPlaylist, setShowPlaylist] = useState(false);
  const playlistId = params.get("list");
  const index = Number(params.get("index") || 0);
  const { data: trackingEnabled, isLoading: trackingLoading } =
    trpc.playlists.getHistoryTracking.useQuery();
  // ✅ fallback khi loading hoặc guest

  const [currentVideoId, setCurrentVideoId] = useState(videoId);
  const [currentIndex, setCurrentIndex] = useState(index);

  const [autoNextEnabled, setAutoNextEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem("autoNext");
    return saved === null ? true : saved === "true";
  });

  const [loopEnabled, setLoopEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("loop");
    return saved === "true";
  });

  const [video] = trpc.videos.getOne.useSuspenseQuery(
    { id: currentVideoId },
    {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  );
  const isVertical = (video.videoHeight || 0) > (video.videoWidth || 0);
  const localProgress =
    typeof window !== "undefined"
      ? parseInt(
          localStorage.getItem(`video-${currentVideoId}-progress`) || "0",
          10,
        )
      : 0;

  // Nếu video đã xem đến 2 giây cuối, coi như đã xem hết để xem lại từ đầu
  // LƯU Ý: video.duration trong DB đang là miliseconds (ms), cần chia 1000 để so với giây (s)
  const durationInSeconds = (video.duration || 0) / 1000;
  const isVideoFinished = (video.progress || 0) >= Math.max(durationInSeconds - 2, 0);
  const isLocalFinished = localProgress >= Math.max(durationInSeconds - 2, 0);

  const finalProgress = trackingEnabled 
    ? (isVideoFinished ? 0 : (video.progress || 0)) 
    : (isLocalFinished ? 0 : localProgress);

  console.log("[VIDEO_SECTION]", {
    videoId: video.id,
    videoProgress: video.progress,
    videoDurationMs: video.duration,
    videoDurationSec: durationInSeconds,
    localProgress,
    isVideoFinished,
    finalProgress,
    trackingEnabled
  });
  // 🔹 playlist public
  const { data: playlists } =
    trpc.playlists.getPublicMixPlaylists.useQuery() as {
      data: Playlist[] | undefined;
    };

  const playlist = playlists?.find((p: Playlist) => p.id === playlistId);
  const next = playlist?.videos?.[currentIndex + 1];

  // 🔹 suggestion random nếu không có playlist
  const [history, setHistory] = useState<string[]>([]);
  useEffect(() => {
    if (!playlistId) {
      setHistory((prev) =>
        prev.includes(currentVideoId) ? prev : [...prev, currentVideoId],
      );
    }
  }, [currentVideoId, playlistId]);

  const { data: suggestions } = trpc.suggestions.getMany.useQuery(
    { videoId: currentVideoId, limit: 5, excludeIds: history, isShort: isVertical },
    { enabled: !playlistId },
  );
  useEffect(() => {
    setCurrentVideoId(videoId);
  }, [videoId]);
  const nextVideo = useMemo(() => {
    if (playlistId && next) {
      return {
        id: next.id,
        title: next.title,
        thumbnail: next.thumbnail || THUMBNAIL_FALLBACK,
        playlistId,
        index: currentIndex + 1,
      };
    }

    if (!suggestions?.items?.length) return undefined;

    const randomIndex = Math.floor(Math.random() * suggestions.items.length);
    const v = suggestions.items[randomIndex];

    return {
      id: v.id,
      title: v.title,
      thumbnail: v.thumbnailUrl || THUMBNAIL_FALLBACK,
    };
  }, [playlistId, next, suggestions, currentIndex]);

  const playerRef = useRef<any>(null);

  useEffect(() => {
    localStorage.setItem("autoNext", autoNextEnabled.toString());
  }, [autoNextEnabled]);

  useEffect(() => {
    localStorage.setItem("loop", loopEnabled.toString());
  }, [loopEnabled]);
  if (trackingLoading || trackingEnabled === undefined) {
    return <VideoSectionSkeleton />;
  }

  const playerWrapperClass = isVertical
    ? cn(
        "aspect-[9/16] mx-auto w-full h-full",
        !hideInfo && "max-w-[470px] max-h-[550px]",
      )
    : "aspect-video";

  return (
    <div className={cn("flex flex-col gap-4", hideInfo && "h-full gap-0")}>
      {/* 🎬 PLAYER */}
      <div
        className={cn(
          playerWrapperClass,
          "rounded-xl overflow-hidden relative shadow-lg",
          !hideInfo && "w-full",
        )}
      >
        <VideoPlayer
          ref={playerRef}
          key={video.id}
          videoId={video.id}
          title={video.title}
          playbackId={video.muxPlaybackId}
          thumbnailUrl={video.thumbnailUrl}
          savedProgress={trackingEnabled ? finalProgress : 0}
          trackingEnabled={trackingEnabled}
          autoPlay
          nextVideo={nextVideo}
          autoNextEnabled={autoNextEnabled}
          loopEnabled={loopEnabledProp ?? loopEnabled}
          isVertical={isVertical}
        />
      </div>

      {/* 🧾 INFO */}
      {!hideInfo && (
        <VideoTopRow
          video={video}
          playerRef={playerRef}
          autoNextEnabled={autoNextEnabled}
          setAutoNextEnabledAction={setAutoNextEnabled}
          loopEnabled={loopEnabledProp ?? loopEnabled}
          setLoopEnabledAction={setLoopEnabled}
        />
      )}

      {/* 📌 PLAYLIST TOGGLE */}
      {!hideInfo && playlist && (
        <button
          className="text-sm text-blue-500 hover:text-blue-600 font-medium mt-1 self-start"
          onClick={() => setShowPlaylist((prev) => !prev)}
        >
          {showPlaylist ? t("hidePlaylist") : t("showPlaylist")}
        </button>
      )}

      {/* 📚 PLAYLIST */}
      {!hideInfo && showPlaylist && playlist && (
        <div className="w-full mt-2 max-h-72 overflow-y-auto bg-gray-900/90 backdrop-blur-md rounded-lg shadow-xl p-3 border border-gray-700">
          <div className="text-white font-semibold text-sm mb-2">
            {playlist.name}
          </div>

          {playlist.videos.map((v, i) => (
            <div
              key={v.id}
              className={cn(
                "flex gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-700/50",
                i === currentIndex ? "bg-gray-700/70" : "",
              )}
              onClick={() => {
                setCurrentVideoId(v.id);
                setCurrentIndex(i);
                window.history.pushState(
                  null,
                  "",
                  `/videos/${v.id}?list=${playlist.id}&index=${i}`,
                );
              }}
            >
              <div className="relative w-20 aspect-video rounded overflow-hidden">
                <img
                  src={v.thumbnail || THUMBNAIL_FALLBACK}
                  className="w-full h-full object-cover"
                />

                {i === currentIndex && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="text-white text-lg">▶️</span>
                  </div>
                )}
              </div>

              <div className="flex-1 text-white text-sm line-clamp-2">
                {i + 1}. {v.title}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
