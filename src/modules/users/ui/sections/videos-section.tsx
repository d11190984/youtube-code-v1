"use client";

import { useEffect } from "react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { trpc } from "@/trpc/client";
import { DEFAULT_LIMIT } from "@/constants";
import { InfiniteScroll } from "@/components/infinite-scroll";

import { cn } from "@/lib/utils";
import {
  VideoGridCard,
  VideoGridCardSkeleton,
} from "@/modules/videos/ui/components/video-grid-card";

interface VideosSectionProps {
  userId: string;
  sortBy?: "latest" | "popular" | "oldest";
  filterType?: "home" | "videos" | "shorts";
  showCarousel?: boolean;
  onVideosCount?: (count: number) => void; // callback trả về số video
}

export const VideosSection = (props: VideosSectionProps) => {
  return (
    <Suspense fallback={<VideosSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Lỗi khi tải video</p>}>
        <VideosSectionSuspense {...props} />
      </ErrorBoundary>
    </Suspense>
  );
};

export const VideosSectionSkeleton = () => (
  <div className="gap-4 gap-y-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
    {Array.from({ length: 18 }).map((_, index) => (
      <VideoGridCardSkeleton key={index} />
    ))}
  </div>
);

const VideosSectionSuspense = ({
  userId,
  sortBy,
  filterType = "home",
  showCarousel = false,
  onVideosCount,
}: VideosSectionProps) => {
  const [videos, query] = trpc.videos.getMany.useSuspenseInfiniteQuery(
    { userId, limit: DEFAULT_LIMIT },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  useEffect(() => {
    query.refetch();
  }, [sortBy]);

  // Sort video
  const sortedVideos = videos.pages
    .flatMap((page) => page.items)
    .sort((a, b) => {
      if (sortBy === "latest")
        return b.createdAt.getTime() - a.createdAt.getTime();
      if (sortBy === "oldest")
        return a.createdAt.getTime() - b.createdAt.getTime();
      if (sortBy === "popular") return b.viewCount - a.viewCount;
      return 0;
    });

  const filteredVideos = sortedVideos.filter((video) => {
    const isVertical = (video.videoHeight || 0) > (video.videoWidth || 0);
    if (filterType === "shorts") return isVertical;
    return !isVertical;
  });

  // Gọi callback báo số video về parent
  useEffect(() => {
    onVideosCount?.(filteredVideos.length);
  }, [filteredVideos.length]);

  if (filteredVideos.length === 0) return null; // Không render nếu không có video

  return (
    <div>
      {showCarousel ? (
        <div className="flex overflow-x-auto gap-4 no-scrollbar">
          {filteredVideos.map((video) => (
            <div key={video.id} className="min-w-[150px] sm:min-w-[200px]">
              <VideoGridCard data={video} />
            </div>
          ))}
        </div>
      ) : (
        <div className={cn(
          "gap-4 gap-y-10 grid",
          filterType === "shorts" 
            ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4"
        )}>
          {filteredVideos.map((video) => (
            <VideoGridCard key={video.id} data={video} />
          ))}
        </div>
      )}
      <InfiniteScroll
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        fetchNextPage={query.fetchNextPage}
      />
    </div>
  );
};
