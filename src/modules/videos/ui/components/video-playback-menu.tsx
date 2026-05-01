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
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  playerRef: React.RefObject<any>;
  playbackId?: string | null;
  autoNextEnabled: boolean;
  setAutoNextEnabledAction: (v: boolean) => void;
  loopEnabled: boolean;
  setLoopEnabledAction: (v: boolean) => void;
  playbackRate: number;
  setPlaybackRate: (r: number) => void;
}

const SPEED_OPTIONS = [0.5, 1, 1.5, 2];

export const VideoPlaybackMenu = ({
  playerRef,
  playbackId,
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

    if (!playbackId) {
      toast.error("Không tìm thấy video");
      return;
    }

    setDownloading(true);

    const toastId = toast.loading("Đang xử lý và chuẩn bị tải video...");

    try {
      const response = await fetch(
        `/api/download-video?playbackId=${playbackId}`,
      );

      if (!response.ok) {
        toast.dismiss(toastId);
        toast.error("Không thể xử lý video");
        return;
      }

      const blob = await response.blob();

      if (blob.size <= 0) {
        toast.dismiss(toastId);
        toast.error("Video tải về rỗng");
        return;
      }

      const downloadUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `video-${playbackId}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      window.URL.revokeObjectURL(downloadUrl);

      toast.dismiss(toastId);
      toast.success("Tải video thành công");
    } catch (error) {
      console.log(error);
      toast.dismiss(toastId);
      toast.error("Tải video thất bại");
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
          <DownloadIcon className="w-4 h-4 text-gray-500" />
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
