"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MuxPlayer from "@mux/mux-player-react";

import { THUMBNAIL_FALLBACK } from "../../constants";

interface VideoPlayerProps {
  playbackId?: string | null;
  thumbnailUrl?: string | null;
  autoPlay?: boolean;
  onPlay?: () => void;

  nextVideo?: {
    id: string;
    title: string;
    thumbnail: string;
  };
}

export const VideoPlayerSkeleton = () => {
  return <div className="aspect-video bg-black rounded-xl" />;
};

export const VideoPlayer = ({
  playbackId,
  thumbnailUrl,
  autoPlay,
  onPlay,
  nextVideo,
}: VideoPlayerProps) => {
  const router = useRouter();
  const playerRef = useRef<any>(null);

  const [showNext, setShowNext] = useState(false);
  const [countdown, setCountdown] = useState(6);
  const [hasRedirected, setHasRedirected] = useState(false);

  // 🎬 VIDEO END
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const handleEnded = () => {
      setCountdown(6);
      setHasRedirected(false);
      setShowNext(true);
    };

    player.addEventListener("ended", handleEnded);

    return () => {
      player.removeEventListener("ended", handleEnded);
    };
  }, []);

  // ⏱ COUNTDOWN (CHỈ GIẢM SỐ)
  useEffect(() => {
    if (!showNext) return;

    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [showNext]);

  // 🚀 REDIRECT (TÁCH RIÊNG - QUAN TRỌNG)
  useEffect(() => {
    if (countdown <= 0 && nextVideo?.id && !hasRedirected) {
      setHasRedirected(true);
      router.push(`/videos/${nextVideo.id}`);
    }
  }, [countdown, nextVideo?.id, hasRedirected, router]);

  return (
    <div className="relative w-full h-full">
      {/* 🎬 PLAYER */}
      <MuxPlayer
        ref={playerRef}
        playbackId={playbackId || ""}
        poster={thumbnailUrl || THUMBNAIL_FALLBACK}
        playerInitTime={0}
        autoPlay={autoPlay}
        thumbnailTime={0}
        className="w-full h-full object-contain"
        accentColor="#FF2056"
        onPlay={onPlay}
      />

      {/* 🔥 OVERLAY */}
      {showNext && nextVideo && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white">
          <p className="mb-4 text-sm opacity-80">
            Video tiếp theo sau {countdown}
          </p>

          <div className="w-64 text-center">
            <img
              src={nextVideo.thumbnail}
              className="rounded-lg mb-2"
            />
            <p className="text-sm font-medium line-clamp-2">
              {nextVideo.title}
            </p>
          </div>

          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setShowNext(false)}
              className="px-4 py-2 bg-gray-700 rounded-full"
            >
              HỦY
            </button>

            <button
              onClick={() => router.push(`/videos/${nextVideo.id}`)}
              className="px-4 py-2 bg-white text-black rounded-full font-semibold"
            >
              PHÁT NGAY
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
