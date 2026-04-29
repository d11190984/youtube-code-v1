"use client";

import Link from "next/link";
import { useState } from "react";
import { VideoInfo, VideoInfoSkeleton } from "./video-info";
import { VideoThumbnail, VideoThumbnailSkeleton } from "./video-thumbnail";
import { VideoGetManyOutput } from "../../types";
import { VideoPlaylist } from "./video-playlist";

interface VideoGridCardProps {
  data: VideoGetManyOutput["items"][number];
  onRemove?: () => void;
  playlist?: {
    id: string;
    name: string;
    videos: { id: string; title: string; thumbnailUrl?: string | null }[];
  };
  currentIndex?: number;
  progress?: number;
  menu?: React.ReactNode;
}

export const VideoGridCardSkeleton = () => {
  return (
    <div className="flex flex-col gap-2 w-full">
      <VideoThumbnailSkeleton />
      <VideoInfoSkeleton />
    </div>
  );
};

export const VideoGridCard = ({
  data,
  onRemove,
  playlist,
  currentIndex = 0,
  menu,
}: VideoGridCardProps) => {
  const [showPlaylist, setShowPlaylist] = useState(false);

  const handleTogglePlaylist = () => setShowPlaylist((prev) => !prev);
  const progress = data.progress ?? 0;

  const saveCurrentWatchingProgress = () => {
    const player = document.querySelector("mux-player") as any;
    if (!player) return;

    const currentVideoId = window.location.pathname.split("/").pop();
    const currentTime = Math.floor(player.currentTime || 0);

    navigator.sendBeacon(
      "/api/save-progress",
      new Blob(
        [
          JSON.stringify({
            videoId: currentVideoId,
            progress: currentTime,
          }),
        ],
        { type: "application/json" },
      ),
    );
  };

  return (
    <div className="flex flex-col gap-2 w-full group relative">
      {menu && <div className="absolute top-2 right-2 z-10">{menu}</div>}

      <Link
        prefetch
        href={`/videos/${data.id}`}
        onClick={saveCurrentWatchingProgress}
      >
        <VideoThumbnail
          imageUrl={data.thumbnailUrl}
          previewUrl={data.previewUrl}
          title={data.title}
          duration={data.duration}
          progress={progress}
        />
      </Link>

      <VideoInfo data={data} onRemove={onRemove} />

      {playlist && (
        <button
          className="text-sm text-blue-400 hover:underline"
          onClick={handleTogglePlaylist}
        >
          {showPlaylist ? "Ẩn danh sách kết hợp" : "Xem danh sách kết hợp"}
        </button>
      )}

      {showPlaylist && playlist && (
        <div className="w-full mt-2 max-h-[300px] overflow-y-auto">
          <VideoPlaylist playlist={playlist} currentIndex={currentIndex} />
        </div>
      )}
    </div>
  );
};
