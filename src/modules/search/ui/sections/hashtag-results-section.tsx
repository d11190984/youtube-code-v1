"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { trpc } from "@/trpc/client";
import { DEFAULT_LIMIT } from "@/constants";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { VideoRowCard, VideoRowCardSkeleton } from "@/modules/videos/ui/components/video-row-card";
import { VideoGridCard, VideoGridCardSkeleton } from "@/modules/videos/ui/components/video-grid-card";

interface HashtagResultsSectionProps {
  tag: string;
};

export const HashtagResultsSection = (props: HashtagResultsSectionProps) => {
  return (
    <Suspense 
      key={props.tag}  
      fallback={<HashtagResultsSectionSkeleton />}
    >
      <ErrorBoundary fallback={<p className="text-center py-10">Đã xảy ra lỗi khi tìm kiếm hashtag.</p>}>
        <HashtagResultsSectionSuspense {...props} />
      </ErrorBoundary>
    </Suspense>
  );
};

export const HashtagResultsSectionSkeleton = () => {
  return (
    <div>
      <div className="hidden flex-col gap-4 md:flex">
        {Array.from({ length: 5 }).map((_, index) => (
          <VideoRowCardSkeleton key={index} />
        ))}
      </div>
      <div className="flex flex-col gap-4 p-4 gap-y-10 pt-6 md:hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <VideoGridCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}

const HashtagResultsSectionSuspense = ({
  tag,
}: HashtagResultsSectionProps) => {
  const [results, resultsQuery] = trpc.search.getHashtagMany.useSuspenseInfiniteQuery(
    { 
      tag, 
      limit: DEFAULT_LIMIT 
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const items = results.pages.flatMap((page) => page.items);

  if (items.length === 0) {
    return <div className="text-center py-20 text-muted-foreground">Không tìm thấy video nào với hashtag này.</div>;
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {items.map((item: any) => {
          return (
            <div key={`video-${item.id}`}>
              {/* Mobile / Grid */}
              <div className="block md:hidden mb-10">
                <VideoGridCard data={item} />
              </div>

              {/* Desktop / Row */}
              <div className="hidden md:block mb-4">
                <VideoRowCard data={item} />
              </div>
            </div>
          );
        })}
      </div>

      <InfiniteScroll
        hasNextPage={resultsQuery.hasNextPage}
        isFetchingNextPage={resultsQuery.isFetchingNextPage}
        fetchNextPage={resultsQuery.fetchNextPage}
      />
    </>
  )
}
