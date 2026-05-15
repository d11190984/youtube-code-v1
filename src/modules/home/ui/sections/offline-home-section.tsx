"use client";

import { useRouter } from "@/i18n/routing";
import { DownloadIcon, PlayCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { DownloadedVideo, downloadManager } from "@/lib/download-manager";
import { VideoGridCard } from "@/modules/videos/ui/components/video-grid-card";
import { VideoMenu } from "@/modules/videos/ui/components/video-menu";

export const OfflineHomeSection = () => {
  const t = useTranslations("Home");
  const router = useRouter();
  const [videos, setVideos] = useState<DownloadedVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVideos = async () => {
      try {
        const data = await downloadManager.getVideos();
        setVideos(data.sort((a, b) => b.downloadedAt - a.downloadedAt));
      } catch (e) {

      } finally {
        setLoading(false);
      }
    };
    loadVideos();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 gap-y-10">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-video w-full rounded-xl" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-3xl bg-muted/10 border-muted-foreground/20">
        <div className="p-4 bg-muted rounded-full mb-4">
          <DownloadIcon className="w-12 h-12 text-muted-foreground/50" />
        </div>
        <h2 className="text-xl font-semibold">{t("youAreOffline")}</h2>
        <p className="text-muted-foreground mt-2 max-w-[400px]">
          {t("downloadToWatch")}
        </p>
      </div>
    );
  }

  const shuffleVideos = (array: DownloadedVideo[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Only suggest if we have more than 1 video, and exclude the very first one if possible
  const suggestedVideos = videos.length > 1 
    ? shuffleVideos(videos.slice(1)).slice(0, 10) 
    : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <DownloadIcon className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{t("downloads")}</h2>
          <p className="text-sm text-muted-foreground">{t("readyToWatchOffline")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 gap-y-10">
        {videos.map((video) => (
          <div 
            key={video.id} 
            className="cursor-pointer"
            onClick={() => router.push("/playlists/download")}
          >
            <VideoGridCard
              data={{
                id: video.id,
                title: video.title,
                thumbnailUrl: video.thumbnailUrl,
                user: {
                  name: video.authorName,
                  imageUrl: video.authorImageUrl || "",
                  id: "",
                },
                viewCount: 0,
                createdAt: new Date(video.downloadedAt),
                duration: video.duration,
                muxStatus: "ready",
                muxPlaybackId: video.playbackId,
              } as any}
              menu={<VideoMenu videoId={video.id} playbackId={video.playbackId} onRemove={() => setVideos(v => v.filter(x => x.id !== video.id))} />}
            />
          </div>
        ))}
      </div>

      {suggestedVideos.length > 0 && (
        <>
          <div className="flex items-center gap-3 pt-4 border-t border-muted">
            <PlayCircleIcon className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-bold">{t("suggestedDownloadedVideos")}</h2>
          </div>
          <p className="text-sm text-muted-foreground -mt-4 italic">
            {t("basedOnYourDownloads")}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 gap-y-10 opacity-80">
            {suggestedVideos.map((video) => (
              <div 
                key={video.id + "-suggested"} 
                className="cursor-pointer"
                onClick={() => router.push("/playlists/download")}
              >
                <VideoGridCard
                  data={{
                    id: video.id,
                    title: video.title,
                    thumbnailUrl: video.thumbnailUrl,
                    user: {
                      name: video.authorName,
                      imageUrl: video.authorImageUrl || "",
                      id: "",
                    },
                    viewCount: 0,
                    createdAt: new Date(video.downloadedAt),
                    duration: video.duration,
                    muxStatus: "ready",
                    muxPlaybackId: video.playbackId,
                  } as any}
                  menu={<VideoMenu videoId={video.id} playbackId={video.playbackId} onRemove={() => setVideos(v => v.filter(x => x.id !== video.id))} />}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
