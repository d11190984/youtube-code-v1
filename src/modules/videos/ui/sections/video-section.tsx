"use client";

import { Suspense, useEffect, useState, useMemo, useRef } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { THUMBNAIL_FALLBACK } from "../../constants";
import { VideoPlayer, VideoPlayerSkeleton } from "../components/video-player";
import { VideoTopRow, VideoTopRowSkeleton } from "../components/video-top-row";

interface VideoSectionProps {
  videoId: string;
}
export const VideoSection = ({ videoId }: VideoSectionProps) => {
  return (
    <Suspense fallback={<VideoSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <VideoSectionSuspense videoId={videoId} />
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

const VideoSectionSuspense = ({ videoId }: VideoSectionProps) => {
  const params = useSearchParams();

  const [showPlaylist, setShowPlaylist] = useState(false);
  const playlistId = params.get("list");
  const index = Number(params.get("index") || 0);
  const { data: trackingEnabled, isLoading: trackingLoading } =
    trpc.playlists.getHistoryTracking.useQuery();

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

  // 🔹 playlist public
  const { data: playlists } = trpc.playlists.getPublicMixPlaylists.useQuery();
  const playlist = playlists?.find((p) => p.id === playlistId);
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
    { videoId: currentVideoId, limit: 5, excludeIds: history },
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
  return (
    <div className="flex flex-col gap-4">
      {/* 🎬 PLAYER */}
      <div className="aspect-video bg-black rounded-xl overflow-hidden relative shadow-lg">
        <VideoPlayer
          ref={playerRef}
          key={video.id}
          videoId={video.id}
          playbackId={video.muxPlaybackId}
          thumbnailUrl={video.thumbnailUrl}
          savedProgress={trackingEnabled ? video.progress || 0 : 0}
          trackingEnabled={trackingEnabled}
          autoPlay
          nextVideo={nextVideo}
          autoNextEnabled={autoNextEnabled}
          loopEnabled={loopEnabled}
        />
      </div>

      {/* 🧾 INFO */}
      <VideoTopRow
        video={video}
        playerRef={playerRef}
        autoNextEnabled={autoNextEnabled}
        setAutoNextEnabledAction={setAutoNextEnabled}
        loopEnabled={loopEnabled}
        setLoopEnabledAction={setLoopEnabled}
      />

      {/* 📌 PLAYLIST TOGGLE */}
      {playlist && (
        <button
          className="text-sm text-blue-500 hover:text-blue-600 font-medium mt-1 self-start"
          onClick={() => setShowPlaylist((prev) => !prev)}
        >
          {showPlaylist ? "Ẩn danh sách kết hợp" : "Xem danh sách kết hợp"}
        </button>
      )}

      {/* 📚 PLAYLIST */}
      {showPlaylist && playlist && (
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
 
