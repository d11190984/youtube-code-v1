"use client";

import { useClerk } from "@clerk/nextjs";
import { 
  MessageSquareIcon, 
  Share2Icon, 
  ThumbsDownIcon, 
  ThumbsUpIcon, 
  RotateCcwIcon,
  DownloadIcon,
  RepeatIcon,
  MoreVerticalIcon,
  CheckIcon,
  PlayIcon,
  XCircleIcon
} from "lucide-react";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";

import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { downloadManager } from "@/lib/download-manager";
import { VideoGetOneOutput } from "../../types";
import { CommentsSection } from "../sections/comments-section";

interface ShortsActionsProps {
  video: VideoGetOneOutput;
  isLooping: boolean;
  onToggleLoop: () => void;
  isAutoNext: boolean;
  onToggleAutoNext: () => void;
  onNext: () => void;
  onNotInterested: () => void;
  variant?: "default" | "overlay";
}

export const ShortsActions = ({ 
  video,
  isLooping,
  onToggleLoop,
  isAutoNext,
  onToggleAutoNext,
  onNext,
  onNotInterested,
  variant = "default",
}: ShortsActionsProps) => {
  const clerk = useClerk();
  const utils = trpc.useUtils();
  const t = useTranslations("Shorts");
  const locale = useLocale();

  const like = trpc.videoReactions.like.useMutation({
    onSuccess: () => {
      utils.videos.getOne.invalidate({ id: video.id });
    },
    onError: (error) => {
      toast.error(t("downloadError") || "An error occurred");
      if (error.data?.code === "UNAUTHORIZED") clerk.openSignIn();
    },
  });

  const dislike = trpc.videoReactions.dislike.useMutation({
    onSuccess: () => {
      utils.videos.getOne.invalidate({ id: video.id });
    },
    onError: (error) => {
      toast.error(t("downloadError") || "An error occurred");
      if (error.data?.code === "UNAUTHORIZED") clerk.openSignIn();
    },
  });

  const compactLikes = useMemo(() => {
    return Intl.NumberFormat(locale, { notation: "compact" }).format(video.likeCount);
  }, [video.likeCount, locale]);

  const labelClass = cn(
    "text-xs font-medium drop-shadow-sm",
    variant === "overlay" ? "text-white" : "text-black dark:text-white"
  );

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {/* Like */}
      <div className="flex flex-col items-center gap-1">
        <Button
          onClick={() => like.mutate({ videoId: video.id })}
          disabled={like.isPending || dislike.isPending}
          size="icon"
          variant="secondary"
          className={cn(
            "size-12 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-white shadow-md",
            video.viewerReaction === "like" && "bg-white text-black hover:bg-neutral-200"
          )}
        >
          <ThumbsUpIcon className={cn("size-6", video.viewerReaction === "like" && "fill-current animate-likeBounce")} />
        </Button>
        <span className={labelClass}>{video.showLikeCount ? compactLikes : ""}</span>
      </div>

      {/* Dislike */}
      <div className="flex flex-col items-center gap-1">
        <Button
          onClick={() => dislike.mutate({ videoId: video.id })}
          disabled={like.isPending || dislike.isPending}
          size="icon"
          variant="secondary"
          className={cn(
            "size-12 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-white shadow-md",
            video.viewerReaction === "dislike" && "bg-white text-black hover:bg-neutral-200"
          )}
        >
          <ThumbsDownIcon className={cn("size-6", video.viewerReaction === "dislike" && "fill-current animate-likeBounce")} />
        </Button>
        <span className={labelClass}>{video.showLikeCount ? t("dislike") : ""}</span>
      </div>

      {/* Comments */}
      <div className="flex flex-col items-center gap-1">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="icon"
              variant="secondary"
              className="size-12 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-white shadow-md"
            >
              <MessageSquareIcon className="size-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-[450px] p-0 flex flex-col">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>{t("comments")}</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-4 pb-10">
              <CommentsSection videoId={video.id} />
            </div>
          </SheetContent>
        </Sheet>
        <span className={labelClass}>{video.canComment ? (video.commentCount || 0) : ""}</span>
      </div>

      {/* Share */}
      <div className="flex flex-col items-center gap-1">
        <Button
          onClick={() => {
            const url = `${window.location.origin}/videos/${video.id}`;
            navigator.clipboard.writeText(url);
            toast.success(t("copySuccess"));
          }}
          size="icon"
          variant="secondary"
          className="size-12 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-white shadow-md"
        >
          <Share2Icon className="size-6" />
        </Button>
        <span className={labelClass}>{t("share")}</span>
      </div>

      {/* Download */}
      <div className="flex flex-col items-center gap-1">
        <Button
          onClick={async () => {
            if (!video.muxPlaybackId) {
              toast.error(t("noFileError"));
              return;
            }

            const downloadUrl = `https://stream.mux.com/${video.muxPlaybackId}/highest.mp4`;
            
            try {
              toast.info(t("preparingFile"));
              
              const response = await fetch(downloadUrl);
              let blob: Blob;

              if (!response.ok) {
                // Fallback to API if direct fetch fails
                const apiResponse = await fetch(`/api/download-video?assetId=${video.muxAssetId}`);
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
                playbackId: video.muxPlaybackId,
              }, blob);

              toast.success(t("downloadSuccess"));
            } catch (error) {
              console.error("Download error:", error);
              toast.error(t("downloadError"));
            }
          }}
          size="icon"
          variant="secondary"
          className="size-12 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-white shadow-md"
        >
          <DownloadIcon className="size-6" />
        </Button>
        <span className={labelClass}>{t("download")}</span>
      </div>

      {/* More */}
      <div className="flex flex-col items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="secondary"
              className="size-12 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-white shadow-md"
            >
              <MoreVerticalIcon className="size-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 bg-neutral-900 border-neutral-800 text-white p-1">
            <DropdownMenuItem 
              onClick={onToggleAutoNext}
              className="focus:bg-neutral-800 focus:text-white cursor-pointer flex items-center justify-between py-3"
            >
              <div className="flex items-center gap-3">
                <PlayIcon className="size-4" />
                <span>{t("autoNext")}</span>
              </div>
              {isAutoNext && <CheckIcon className="size-4 text-blue-500" />}
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={onToggleLoop}
              className="focus:bg-neutral-800 focus:text-white cursor-pointer flex items-center justify-between py-3"
            >
              <div className="flex items-center gap-3">
                <RepeatIcon className="size-4" />
                <span>{t("loop")}</span>
              </div>
              {isLooping && <CheckIcon className="size-4 text-blue-500" />}
            </DropdownMenuItem>

            <div className="h-px bg-neutral-800 my-1" />

            <DropdownMenuItem 
              onClick={onNotInterested}
              className="focus:bg-neutral-800 focus:text-red-400 text-red-500 cursor-pointer flex items-center gap-3 py-3"
            >
              <XCircleIcon className="size-4" />
              <span>{t("notInterested")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
