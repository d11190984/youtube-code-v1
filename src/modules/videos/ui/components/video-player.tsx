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
  trackingEnabled?: boolean;
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
      trackingEnabled = true,
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

    const updateProgressMutation = trpc.videos.updateProgress.useMutation({
      onError: (err) => {
        console.log("SAVE PROGRESS ERROR:", err.message);
      },
    });

    const [showNext, setShowNext] = useState(false);
    const [countdown, setCountdown] = useState(6);
    const [hasRedirected, setHasRedirected] = useState(false);

    const hasCountedView = useRef(false);
    const hasSeeked = useRef(false);

    // ✅ lưu progress cuối cùng an toàn
    const lastKnownProgress = useRef(0);
    const savingRef = useRef(false);
    const localResumeRef = useRef(savedProgress);
    useEffect(() => {
      localResumeRef.current = savedProgress;
    }, [savedProgress]);
    // =========================
    // Tăng view khi play lần đầu
    // =========================
    useEffect(() => {
      const player = playerRef.current;
      if (!player) return;

      const handlePlay = async () => {
        if (hasCountedView.current) return;

        try {
          // ✅ chỉ tăng view, tuyệt đối không reset progress ở đây
          await incrementViewMutation.mutateAsync({ videoId });

          hasCountedView.current = true;
        } catch (err) {
          console.log("PLAY EVENT ERROR:", err);
        }

        onPlay?.();
      };

      player.addEventListener("play", handlePlay);

      return () => {
        player.removeEventListener("play", handlePlay);
      };
    }, [videoId, onPlay]);

    // =========================
    // Resume progress cũ
    // =========================
    useEffect(() => {
      const player = playerRef.current;
      if (!player) return;

      const handleCanPlay = () => {
        if (hasSeeked.current) return;

        if (!trackingEnabled) {
          player.currentTime = 0;
          lastKnownProgress.current = 0;
          hasSeeked.current = true;
          return;
        }

        const duration = Math.floor(player.duration || 0);
        const resumeAt = localResumeRef.current || 0;

        if (resumeAt > 0 && duration > 0) {
          const watchedPercent = (resumeAt / duration) * 100;

          if (watchedPercent < 95) {
            player.currentTime = resumeAt;
            lastKnownProgress.current = resumeAt;
          } else {
            player.currentTime = 0;
            lastKnownProgress.current = 0;
          }
        }

        hasSeeked.current = true;
      };

      player.addEventListener("canplay", handleCanPlay);
      return () => player.removeEventListener("canplay", handleCanPlay);
    }, [videoId, trackingEnabled, savedProgress]);

    useEffect(() => {
      if (!trackingEnabled) return;

      const player = playerRef.current;
      if (!player) return;

      let lastSaved = 0;

      const handleTimeUpdate = () => {
        const current = Math.floor(player.currentTime || 0);

        lastKnownProgress.current = current;
        localResumeRef.current = current;

        // 🔥 update cache local tức thì
        utils.videos.getOne.setData({ id: videoId }, (old: any) => {
          if (!old) return old;
          return {
            ...old,
            progress: current,
          };
        });

        if (current - lastSaved >= 2 && !savingRef.current) {
          lastSaved = current;
          savingRef.current = true;

          updateProgressMutation.mutate(
            {
              videoId,
              progress: current,
            },
            {
              onSettled: () => {
                savingRef.current = false;
              },
            },
          );
        }
      };

      player.addEventListener("timeupdate", handleTimeUpdate);

      return () => {
        player.removeEventListener("timeupdate", handleTimeUpdate);
      };
    }, [videoId, trackingEnabled]);

    // =========================
    // Save khi thoát trang / unmount
    // =========================
    useEffect(() => {
      const saveOnExit = () => {
        if (!trackingEnabled) return;
        if (lastKnownProgress.current <= 0) return;

        navigator.sendBeacon(
          "/api/save-progress",
          JSON.stringify({
            videoId,
            progress: lastKnownProgress.current,
          }),
        );

        utils.videos.getMany.invalidate();
        utils.videos.getManyTrending.invalidate();
        utils.videos.getManySubscribed.invalidate();
        utils.videos.getManyShorts.invalidate();
        utils.suggestions.getMany.invalidate();
      };
      window.addEventListener("beforeunload", saveOnExit);

      return () => {
        saveOnExit();
        window.removeEventListener("beforeunload", saveOnExit);
      };
    }, [videoId, trackingEnabled]);
    // =========================
    // Video ended
    // =========================
    useEffect(() => {
      const player = playerRef.current;
      if (!player) return;

      const handleEnded = async () => {
        const duration = Math.floor(player?.duration || 0);

        lastKnownProgress.current = duration;

        if (trackingEnabled) {
          await updateProgressMutation.mutateAsync({
            videoId,
            progress: duration,
          });
        }

        if (loopEnabled) {
          localResumeRef.current = 0;

          if (trackingEnabled) {
            await updateProgressMutation.mutateAsync({
              videoId,
              progress: 0,
              isRestart: true,
            });
          }

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
    }, [
      autoNextEnabled,
      loopEnabled,
      videoId,
      trackingEnabled,
      updateProgressMutation,
    ]);

    // =========================
    // Reset state khi đổi video
    // =========================
    useEffect(() => {
      setShowNext(false);
      setCountdown(6);
      setHasRedirected(false);

      hasCountedView.current = false;
      hasSeeked.current = false;
      lastKnownProgress.current = 0;
    }, [videoId]);

    // =========================
    // Countdown overlay
    // =========================
    useEffect(() => {
      if (!showNext) return;

      const interval = setInterval(() => {
        setCountdown((p) => p - 1);
      }, 1000);

      return () => clearInterval(interval);
    }, [showNext]);

    // =========================
    // Auto next
    // =========================
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
