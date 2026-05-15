"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { DownloadIcon, Trash2Icon, PlayIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { downloadManager, DownloadedVideo } from "@/lib/download-manager";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DownloadPage() {
  const [videos, setVideos] = useState<DownloadedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<DownloadedVideo | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const t = useTranslations("Offline");

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const data = await downloadManager.getVideos();
      setVideos(data.sort((a, b) => b.downloadedAt - a.downloadedAt));
    } catch (error) {
      console.error("LOAD DOWNLOADS ERROR:", error);
      toast.error(t("errorLoadingDownloadedVideos"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, video: DownloadedVideo) => {
    e.stopPropagation();
    if (!confirm(t("confirmDeleteDownloadedVideo"))) return;

    try {
      await downloadManager.removeVideo(video.id, video.playbackId);
      setVideos(prev => prev.filter(v => v.id !== video.id));
      toast.success(t("videoDeleted"));
    } catch (error) {
      toast.error(t("errorDeletingVideo"));
    }
  };

  const handlePlay = async (video: DownloadedVideo) => {
    try {
      const url = await downloadManager.getVideoUrl(video.playbackId);
      if (url) {
        setVideoUrl(url);
        setSelectedVideo(video);
      } else {
        toast.error(t("noLocalVideoData"));
      }
    } catch (error) {
      toast.error(t("cannotPlayVideo"));
    }
  };

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2Icon className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
          <DownloadIcon className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t("downloadedContent")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("videosAvailableOffline", { count: videos.length })}
          </p>
        </div>
      </div>

      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <DownloadIcon className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-medium">{t("noDownloadedContent")}</h2>
          <p className="text-muted-foreground mt-2">
            {t("downloadVideosToWatchOffline")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((video) => (
            <div 
              key={video.id}
              className="group relative bg-card border rounded-xl overflow-hidden hover:shadow-md transition cursor-pointer"
              onClick={() => handlePlay(video)}
            >
              <div className="relative aspect-video">
                <Image
                  src={video.thumbnailUrl || "/placeholder.jpg"}
                  alt={video.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition flex items-center justify-center">
                  <PlayIcon className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition transform scale-75 group-hover:scale-100" />
                </div>
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-white text-[10px] font-medium rounded">
                  {formatDuration(video.duration)}
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm line-clamp-2 mb-1">{video.title}</h3>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate">{video.authorName}</span>
                  <span>{formatSize(video.size)}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition bg-black/50 hover:bg-red-500 text-white h-8 w-8 rounded-full"
                  onClick={(e) => handleDelete(e, video)}
                >
                  <Trash2Icon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-none">
          <DialogHeader className="p-4 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity">
            <DialogTitle className="text-white">{selectedVideo?.title}</DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full flex items-center justify-center bg-black">
            {videoUrl && (
              <video 
                src={videoUrl} 
                controls 
                autoPlay 
                className="w-full h-full"
                controlsList="nodownload"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
