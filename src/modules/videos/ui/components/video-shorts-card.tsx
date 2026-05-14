"use client";

import { Link } from "@/i18n/routing";
import Image from "next/image";
import { useMemo } from "react";

import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { THUMBNAIL_FALLBACK } from "../../constants";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoMenu } from "./video-menu";

interface VideoShortsCardProps {
  data: {
    id: string;
    title: string;
    thumbnailUrl?: string | null;
    previewUrl?: string | null;
    duration: number;
    viewsCount: number;
    viewCount: number;
    videoWidth?: number | null;
    videoHeight?: number | null;
  };
  onRemove?: () => void;
  className?: string;
}

export const VideoShortsCardSkeleton = ({ className }: { className?: string }) => {
  return (
    <div className={cn("relative flex flex-col gap-2 flex-shrink-0", className)}>
      <div className="relative w-full overflow-hidden rounded-xl aspect-[9/16]">
        <div className="absolute inset-0 bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
      </div>
      <div className="space-y-1.5 px-1">
        <Skeleton className="h-4 w-[85%]" />
        <Skeleton className="h-3.5 w-[60%]" />
      </div>
    </div>
  );
};

export const VideoShortsCard = ({ data, onRemove, className }: VideoShortsCardProps) => {
  const locale = useLocale();
  const t = useTranslations("Video");

  const compactViews = useMemo(() => {
    const count = data.viewCount || data.viewsCount || 0;
    if (count === 0) return t("noViews");
    
    return new Intl.NumberFormat(locale, {
      notation: "compact",
    }).format(count);
  }, [data.viewCount, data.viewsCount, locale, t]);

  return (
    <div className={cn("group flex flex-col gap-2 flex-shrink-0", className)}>
      {/* Thumbnail — always 9:16 */}
      <Link prefetch href={`/videos/${data.id}`}>
        <div className="relative w-full overflow-hidden rounded-xl aspect-[9/16] bg-black">
          <Image
            src={data.thumbnailUrl || THUMBNAIL_FALLBACK}
            alt={data.title}
            fill
            className="h-full w-full object-cover transition-all duration-300 group-hover:scale-105 group-hover:opacity-0"
          />
          <Image
            unoptimized={!!data.previewUrl}
            src={data.previewUrl || data.thumbnailUrl || THUMBNAIL_FALLBACK}
            alt={data.title}
            fill
            className="h-full w-full object-cover opacity-0 transition-all duration-300 group-hover:scale-105 group-hover:opacity-100"
          />
        </div>
      </Link>

      {/* Info & Menu */}
      <div className="flex gap-2 items-start justify-between px-1">
        <div className="flex-1 flex flex-col min-w-0">
          <Link prefetch href={`/videos/${data.id}`}>
            <h3 className="text-sm font-medium line-clamp-2 leading-tight">
              {data.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {(data.viewCount || data.viewsCount) > 0 ? `${compactViews} ${t("views")}` : compactViews}
            </p>
          </Link>
        </div>
        
        {/* Menu (3 dots) - chỉ hiện khi hover trên card */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity -mt-1 -mr-1">
          <VideoMenu videoId={data.id} onRemove={onRemove} />
        </div>
      </div>
    </div>
  );
};
