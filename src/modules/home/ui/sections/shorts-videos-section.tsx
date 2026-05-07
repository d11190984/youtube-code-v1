"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { FlameIcon } from "lucide-react";

import { trpc } from "@/trpc/client";
import { DEFAULT_LIMIT } from "@/constants";
import { InfiniteScroll } from "@/components/infinite-scroll";

import {
  VideoShortsCard,
  VideoShortsCardSkeleton,
} from "@/modules/videos/ui/components/video-shorts-card";

export const ShortsVideosSection = () => {
  return (
    <Suspense fallback={<ShortsVideosSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error loading Shorts</p>}>
        <ShortsVideosSectionSuspense />
      </ErrorBoundary>
    </Suspense>
  );
};

const ShortsVideosSectionSkeleton = () => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10">
          <FlameIcon className="size-5 text-red-500" />
        </div>
        <span className="text-lg font-bold">Shorts</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 gap-y-10">
        {Array.from({ length: 12 }).map((_, index) => (
          <VideoShortsCardSkeleton key={index} className="w-full" />
        ))}
      </div>
    </div>
  );
};

const ShortsVideosSectionSuspense = () => {
  const [videos, query] = trpc.videos.getManyShorts.useSuspenseInfiniteQuery(
    { limit: DEFAULT_LIMIT },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  const shortsVideos = videos.pages.flatMap((page) => page.items);

  if (shortsVideos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <FlameIcon className="size-12 mb-3 opacity-40" />
        <p className="text-lg font-medium">Chưa có Shorts nào</p>
        <p className="text-sm">Hãy upload video dưới 1 phút để tạo Shorts!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10">
          <FlameIcon className="size-5 text-red-500" />
        </div>
        <span className="text-lg font-bold">Shorts</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 gap-y-10">
        {shortsVideos.map((video) => (
          <VideoShortsCard key={video.id} data={video} className="w-full" />
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