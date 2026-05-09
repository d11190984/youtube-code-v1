"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorFallback } from "@/components/error-fallback";
import { trpc } from "@/trpc/client";
import { DEFAULT_LIMIT } from "@/constants";

import {
  VideoGridCard,
  VideoGridCardSkeleton,
} from "../components/video-grid-card";
import {
  VideoRowCard,
  VideoRowCardSkeleton,
} from "../components/video-row-card";
import { 
  VideoShortsCard,
  VideoShortsCardSkeleton 
} from "../components/video-shorts-card";
import { VideoGetManyOutput } from "../../types";

interface SuggestionsSectionProps {
  videoId: string;
  isManual?: boolean;
  isShort?: boolean;
}

type Video = VideoGetManyOutput["items"][number] & {
  playlist?: {
    id: string;
    name: string;
    videos: { id: string; title: string; thumbnailUrl?: string | null }[];
  };
  progress?: number; // 🔥 chắc chắn có progress
};

// Helper map video với progress mặc định
const mapVideoWithProgress = (video: Video) => ({
  ...video,
  progress: video.progress ?? 0,
});

export const SuggestionsSection = ({
  videoId,
  isManual,
  isShort,
}: SuggestionsSectionProps) => {
  return (
    <Suspense fallback={<SuggestionsSectionSkeleton />}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <SuggestionsSectionSuspense 
          videoId={videoId} 
          isManual={isManual} 
          isShort={isShort} 
        />
      </ErrorBoundary>
    </Suspense>
  );
};
export const SuggestionsSectionSkeleton = () => {
  return (
    <>
      <div className="hidden md:block space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <VideoRowCardSkeleton key={index} size="compact" />
        ))}
      </div>
      <div className="block md:hidden space-y-10">
        {Array.from({ length: 6 }).map((_, index) => (
          <VideoGridCardSkeleton key={index} />
        ))}
      </div>
    </>
  );
};

const SuggestionsSectionSuspense = ({ videoId, isShort }: SuggestionsSectionProps) => {
  const [data] = trpc.suggestions.getMany.useSuspenseQuery({
    videoId,
    limit: DEFAULT_LIMIT,
  });

  // 🔥 Lọc video: Nếu đang xem video ngang, ẩn các video dọc (Shorts)
  const filteredItems = data.items.filter((item) => {
    const itemIsShort = !!(item.videoHeight && item.videoWidth && item.videoHeight > item.videoWidth);
    
    if (isShort === false) {
      // Đang xem video ngang (16:9), ẩn các video dọc
      return !itemIsShort;
    }
    return true;
  });

  // 🔥 map video để đảm bảo progress luôn là number
  const videosWithProgress: Video[] = filteredItems.map((video) => ({
    ...video,
    progress: video.progress ?? 0, // null → 0
  }));

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block space-y-3">
        {videosWithProgress.map((video: Video) => {
          return (
            <VideoRowCard
              key={video.id}
              data={video}
              size="compact"
              progress={video.progress} // 🔥 truyền xuống RowCard
            />
          );
        })}
      </div>

      {/* Mobile */}
      <div className="block md:hidden space-y-10">
        {videosWithProgress.map((video: Video) => {
          const isShort = !!(video.videoWidth && video.videoHeight && video.videoWidth < video.videoHeight);

          if (isShort) {
             return (
              <div key={video.id} className="flex justify-center">
                <VideoShortsCard
                  data={{
                    ...video,
                    viewCount: video.viewsCount,
                  }}
                  className="w-[180px] sm:w-[210px]"
                />
              </div>
            );
          }

          return (
            <VideoGridCard
              key={video.id}
              data={video}
              progress={video.progress} // 🔥 truyền xuống GridCard
            />
          );
        })}
      </div>
    </>
  );
};
