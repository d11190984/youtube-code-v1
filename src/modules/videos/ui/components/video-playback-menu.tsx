"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadManager } from "@/lib/download-manager";
import { ClockIcon, DownloadIcon, Loader2Icon, RepeatIcon, SettingsIcon, SkipForwardIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";
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

type PlayerRef = React.RefObject<any>;

function scheduleStopTimer(
  playerRef: PlayerRef,
  secs: number,
  setScheduledStopSeconds: (n: number | null) => void,
  stopTimerRef: React.MutableRefObject<number | null>,
  scheduledAtRef: React.MutableRefObject<number | null>
) {
  if (stopTimerRef.current) {
    clearTimeout(stopTimerRef.current);
  }
  setScheduledStopSeconds(secs);
  scheduledAtRef.current = Date.now();
  stopTimerRef.current = window.setTimeout(() => {
    if (playerRef.current && typeof playerRef.current.pause === "function") playerRef.current.pause();
    setScheduledStopSeconds(null);
    stopTimerRef.current = null;
    scheduledAtRef.current = null;
  }, secs * 1000);
}

function cancelStopTimer(
  stopTimerRef: React.MutableRefObject<number | null>,
  setScheduledStopSeconds: (n: number | null) => void,
  scheduledAtRef: React.MutableRefObject<number | null>
) {
  if (stopTimerRef.current) {
    clearTimeout(stopTimerRef.current);
    stopTimerRef.current = null;
  }
  setScheduledStopSeconds(null);
  scheduledAtRef.current = null;
}

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
  const [scheduledStopSeconds, setScheduledStopSeconds] = useState<number | null>(null);
  const stopTimerRef = useRef<number | null>(null);
  const scheduledAtRef = useRef<number | null>(null);
  const t = useTranslations("Playback");
  const tGeneral = useTranslations("General");
  const tShorts = useTranslations("Shorts");

  const handleDownload = async () => {
    if (downloading) return;

    if (!assetId || !playbackId) {
      toast.error(tShorts("noFileError"));
      return;
    }

    setDownloading(true);
    toast.success(tShorts("preparingFile"));

    try {
      const downloadUrl = `https://stream.mux.com/${playbackId}/highest.mp4`;
      const response = await fetch(downloadUrl);
      let blob: Blob;

      if (!response.ok) {
        // Fallback to API if direct fetch fails
        const apiResponse = await fetch(`/api/download-video?assetId=${assetId}`);
        if (!apiResponse.ok) throw new Error("Download failed");
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

      toast.success(tShorts("downloadSuccess"));
    } catch (error) {
      console.error("OFFLINE DOWNLOAD ERROR:", error);
      toast.error(tShorts("downloadError"));
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
            <span>{t("autoPlay")}</span>
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
            <span>{t("loop")}</span>
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
          <span>{downloading ? t("downloading") : t("download")}</span>
        </DropdownMenuItem>
        {/*
          SPEED Submenu (commented out per request)
        
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-gray-500" />
              <span>{t("speed")}</span>
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
        */}

        {/* STOP-TIMER Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-gray-500" />
              <span>Stop after</span>
            </div>
          </DropdownMenuSubTrigger>

          <DropdownMenuSubContent className="w-36 p-2">
            {scheduledStopSeconds ? (
              <>
                <DropdownMenuItem onClick={() => cancelStopTimer(stopTimerRef, setScheduledStopSeconds, scheduledAtRef)}>
                  Cancel scheduled stop
                </DropdownMenuItem>
              </>
            ) : null}

            <DropdownMenuItem onClick={() => scheduleStopTimer(playerRef, 600, setScheduledStopSeconds, stopTimerRef, scheduledAtRef)}>
              10m
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => scheduleStopTimer(playerRef, 900, setScheduledStopSeconds, stopTimerRef, scheduledAtRef)}>
              15m
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => scheduleStopTimer(playerRef, 1200, setScheduledStopSeconds, stopTimerRef, scheduledAtRef)}>
              20m
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => scheduleStopTimer(playerRef, 1800, setScheduledStopSeconds, stopTimerRef, scheduledAtRef)}>
              30m
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
