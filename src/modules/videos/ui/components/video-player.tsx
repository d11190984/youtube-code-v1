"use client";

import { useEffect, useRef, useState, forwardRef } from "react";
import { useRouter } from "next/navigation";
import MuxPlayer from "@mux/mux-player-react";
import { THUMBNAIL_FALLBACK } from "../../constants";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";

interface VideoPlayerProps {
  videoId: string;
  playbackId?: string | null;
  thumbnailUrl?: string | null;
  savedProgress?: number;
  autoPlay?: boolean;
  onPlay?: () => void;
  nextVideo?: {
    id: string;
    title: string;
    thumbnail: string;
    playlistId?: string;
    index?: number;
  };
  onEnded?: () => void;
  autoNextEnabled?: boolean;
  loopEnabled?: boolean;
}

export const VideoPlayerSkeleton = () => (
  <div className="aspect-video bg-black rounded-xl" />
);

export const VideoPlayer = forwardRef<any, VideoPlayerProps>(
  (
    {
      videoId,
      playbackId,
      thumbnailUrl,
      savedProgress = 0,
      autoPlay,
      onPlay,
      nextVideo,
      onEnded,
      autoNextEnabled = true,
      loopEnabled = false,
    },
    ref,
  ) => {
    const router = useRouter();
    const internalRef = useRef<any>(null);
    const playerRef = (ref as React.RefObject<any>) || internalRef;
    const utils = trpc.useContext();

    const incrementViewMutation = trpc.videos.incrementView.useMutation({
      onMutate: async () => {
        utils.videos.getOne.setData({ id: videoId }, (old: any) => {
          if (!old) return old;
          return { ...old, viewCount: old.viewCount + 1 };
        });
      },
      onError: () => {
        toast.error("Không thể tăng view");
      },
    });

    const updateProgressMutation = trpc.videos.updateProgress.useMutation();

    const [showNext, setShowNext] = useState(false);
    const [countdown, setCountdown] = useState(6);
    const [hasRedirected, setHasRedirected] = useState(false);
    const hasCountedView = useRef(false);
    const hasSeeked = useRef(false);

    // ✅ Tăng view khi play lần đầu
    useEffect(() => {
      const player = playerRef.current;
      if (!player) return;

      const handlePlay = async () => {
        if (!hasCountedView.current) {
          hasCountedView.current = true;
          await incrementViewMutation.mutateAsync({ videoId });
        }

        onPlay?.();
      };

      player.addEventListener("play", handlePlay);
      return () => player.removeEventListener("play", handlePlay);
    }, [videoId, onPlay, incrementViewMutation]);

    // ✅ Resume tới progress cũ
    useEffect(() => {
      const player = playerRef.current;
      if (!player) return;

      const handleCanPlay = () => {
        if (hasSeeked.current) return;

        const duration = Math.floor(player.duration || 0);

        if (savedProgress > 0 && duration > 0) {
          const watchedPercent = (savedProgress / duration) * 100;

          if (watchedPercent < 95) {
            player.currentTime = savedProgress;
          } else {
            player.currentTime = 0;
          }
        }

        hasSeeked.current = true;
      };

      player.addEventListener("canplay", handleCanPlay);

      return () => {
        player.removeEventListener("canplay", handleCanPlay);
      };
    }, [savedProgress, videoId]);

    // ✅ Video ended
    useEffect(() => {
      const player = playerRef.current;
      if (!player) return;

      const handleEnded = async () => {
        const player = playerRef.current;

        await updateProgressMutation.mutateAsync({
          videoId,
          progress: Math.floor(player?.duration || 0),
        });

        if (loopEnabled) {
          player.currentTime = 0;
          player.play();
          return;
        }

        if (!autoNextEnabled) return;

        setCountdown(6);
        setShowNext(true);
        setHasRedirected(false);
      };

      player.addEventListener("ended", handleEnded);
      return () => player.removeEventListener("ended", handleEnded);
    }, [autoNextEnabled, loopEnabled, videoId]);

    // ✅ Reset state khi đổi video
    useEffect(() => {
      setShowNext(false);
      setCountdown(6);
      setHasRedirected(false);
      hasCountedView.current = false;
      hasSeeked.current = false;
    }, [videoId]);

    // ✅ Save progress mỗi 2s
    useEffect(() => {
      const interval = setInterval(() => {
        const player = playerRef.current;
        if (!player) return;
        if (player.paused) return;

        updateProgressMutation.mutate({
          videoId,
          progress: Math.floor(player.currentTime),
        });
      }, 2000);

      return () => clearInterval(interval);
    }, [videoId]);

    // ✅ Save khi unmount / refresh / đổi route
    useEffect(() => {
      const saveProgress = () => {
        const player = playerRef.current;
        if (!player) return;

        updateProgressMutation.mutate({
          videoId,
          progress: Math.floor(player.currentTime),
        });
      };

      window.addEventListener("beforeunload", saveProgress);

      return () => {
        saveProgress();
        window.removeEventListener("beforeunload", saveProgress);
      };
    }, [videoId]);

    // ✅ Countdown overlay
    useEffect(() => {
      if (!showNext) return;

      const interval = setInterval(() => {
        setCountdown((p) => p - 1);
      }, 1000);

      return () => clearInterval(interval);
    }, [showNext]);

    // ✅ Auto next
    useEffect(() => {
      if (countdown <= 0 && nextVideo && !hasRedirected && autoNextEnabled) {
        setHasRedirected(true);

        if (onEnded) {
          onEnded();
        } else if (nextVideo.playlistId) {
          router.push(
            `/videos/${nextVideo.id}?list=${nextVideo.playlistId}&index=${nextVideo.index}`,
          );
        } else {
          router.push(`/videos/${nextVideo.id}`);
        }
      }
    }, [countdown, nextVideo, hasRedirected, onEnded, router, autoNextEnabled]);

    return (
      <div className="relative w-full h-full">
        <MuxPlayer
          ref={playerRef}
          playbackId={playbackId || ""}
          streamType="on-demand"
          poster={thumbnailUrl || THUMBNAIL_FALLBACK}
          autoPlay={autoPlay}
          className="w-full h-full object-contain"
          accentColor="#FF2056"
        />

        {autoNextEnabled && showNext && nextVideo && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white px-4">
            <p className="mb-2 text-xs sm:text-sm opacity-80 text-center w-full">
              Video tiếp theo sau {countdown}
            </p>

            <div className="w-full max-w-md flex items-center gap-3 mb-4">
              <div className="relative flex-shrink-0 w-24 aspect-video rounded-lg overflow-hidden -translate-y-2">
                <img
                  src={nextVideo.thumbnail}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>

              <p className="text-xs sm:text-sm font-medium line-clamp-2 flex-1">
                {nextVideo.title}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  },
);

VideoPlayer.displayName = "VideoPlayer";
