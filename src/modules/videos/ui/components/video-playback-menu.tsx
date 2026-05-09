"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  RepeatIcon,
  SkipForwardIcon,
  SettingsIcon,
  ClockIcon,
  DownloadIcon,
  Loader2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { downloadManager } from "@/lib/download-manager";
import { VideoGetOneOutput } from "../../types";

interface Props {
  video: VideoGetOneOutput;
  playerRef: React.RefObject<any>;
  playbackId?: string | null;
  assetId?: string | null;

  autoNextEnabled: boolean;
  setAutoNextEnabledAction: (v: boolean) => void;
  loopEnabled: boolean;
  setLoopEnabledAction: (v: boolean) => void;
  playbackRate: number;
  setPlaybackRate: (r: number) => void;
}

const SPEED_OPTIONS = [0.5, 1, 1.5, 2];

export const VideoPlaybackMenu = ({
  video,
  playerRef,
  playbackId,
  assetId,
  autoNextEnabled,
  setAutoNextEnabledAction,
  loopEnabled,
  setLoopEnabledAction,
  playbackRate,
  setPlaybackRate,
}: Props) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (downloading) return;

    if (!assetId || !playbackId) {
      toast.error("Không tìm thấy thông tin video");
      return;
    }

    setDownloading(true);
    toast.success("Đang bắt đầu tải video để xem ngoại tuyến...");

    try {
      const downloadUrl = `https://stream.mux.com/${playbackId}/highest.mp4`;
      const response = await fetch(downloadUrl);
      let blob: Blob;

      if (!response.ok) {
        // Fallback to API if direct fetch fails
        const apiResponse = await fetch(`/api/download-video?assetId=${assetId}`);
        if (!apiResponse.ok) throw new Error("Tải xuống thất bại");
        blob = await apiResponse.blob();
      } else {
        blob = await response.blob();
      }

      // 1. Tải file về máy người dùng
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${video.title || "video"}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // 2. Lưu vào mục Nội dung tải xuống (Offline)
      await downloadManager.saveVideo({
        id: video.id,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl || null,
        duration: video.duration,
        authorName: video.user.name,
        authorImageUrl: video.user.imageUrl,
        downloadedAt: Date.now(),
        size: blob.size,
        playbackId: playbackId,
      }, blob);

      toast.success("Đã tải video về máy và lưu vào mục Nội dung tải xuống!");
    } catch (error) {
      console.error("OFFLINE DOWNLOAD ERROR:", error);
      toast.error("Không thể tải video.");
    } finally {
      setDownloading(false);
    }
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <SettingsIcon className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-56 p-2 rounded-xl shadow-lg"
      >
        {/* AUTO NEXT */}
        <DropdownMenuItem
          className="flex items-center justify-between"
          onClick={() => setAutoNextEnabledAction(!autoNextEnabled)}
        >
          <div className="flex items-center gap-2">
            <SkipForwardIcon className="w-4 h-4 text-gray-500" />
            <span>Tự chuyển</span>
          </div>
          <div
            className={`w-9 h-5 flex items-center rounded-full p-1 transition ${
              autoNextEnabled ? "bg-blue-500" : "bg-gray-300"
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full transition ${
                autoNextEnabled ? "translate-x-4" : ""
              }`}
            />
          </div>
        </DropdownMenuItem>
        {/* LOOP */}
        <DropdownMenuItem
          className="flex items-center justify-between"
          onClick={() => setLoopEnabledAction(!loopEnabled)}
        >
          <div className="flex items-center gap-2">
            <RepeatIcon className="w-4 h-4 text-gray-500" />
            <span>Lặp lại</span>
          </div>
          <div
            className={`w-9 h-5 flex items-center rounded-full p-1 transition ${
              loopEnabled ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full transition ${
                loopEnabled ? "translate-x-4" : ""
              }`}
            />
          </div>
        </DropdownMenuItem>

        {/* DOWNLOAD Submenu */}
        <DropdownMenuItem
          className={`flex items-center gap-2 ${downloading ? "opacity-50 pointer-events-none" : ""}`}
          onClick={handleDownload}
        >
          {downloading ? (
            <Loader2Icon className="w-4 h-4 text-gray-500 animate-spin" />
          ) : (
            <DownloadIcon className="w-4 h-4 text-gray-500" />
          )}
          <span>{downloading ? "Đang tải..." : "Tải video"}</span>
        </DropdownMenuItem>
        {/* SPEED Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Icon giống Tự chuyển/Lặp lại */}
              <ClockIcon className="w-4 h-4 text-gray-500" />
              <span>Tốc độ phát</span>
            </div>
          </DropdownMenuSubTrigger>

          <DropdownMenuSubContent className="w-36 p-2">
            {SPEED_OPTIONS.map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={() => {
                  setPlaybackRate(s);
                  if (playerRef.current) playerRef.current.playbackRate = s;
                }}
              >
                {s}x
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
