// VideosSection.tsx
"use client";

import { useEffect } from "react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { trpc } from "@/trpc/client";
import { DEFAULT_LIMIT } from "@/constants";
import { InfiniteScroll } from "@/components/infinite-scroll";

import {
  VideoGridCard,
  VideoGridCardSkeleton,
} from "@/modules/videos/ui/components/video-grid-card";

interface VideosSectionProps {
  userId: string;
  sortBy?: "latest" | "popular" | "oldest";
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

const VideosSectionSuspense = ({ userId, sortBy }: VideosSectionProps) => {
  const [videos, query] = trpc.videos.getMany.useSuspenseInfiniteQuery(
    { userId, limit: DEFAULT_LIMIT },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  useEffect(() => {
    query.refetch(); // tự động refetch khi sortBy đổi
  }, [sortBy]);

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

  return (
    <div>
      <div className="gap-4 gap-y-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
        {sortedVideos.map((video) => (
          <VideoGridCard key={video.id} data={video} />
        ))}
      </div>
      <InfiniteScroll
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        fetchNextPage={query.fetchNextPage}
      />
    </div>
  );
};
