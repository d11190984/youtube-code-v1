"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { trpc } from "@/trpc/client";
import { DEFAULT_LIMIT } from "@/constants";
import { InfiniteScroll } from "@/components/infinite-scroll";

import {
  PlaylistGridCard,
  PlaylistGridCardSkeleton,
} from "@/modules/playlists/ui/components/playlist-grid-card";

interface PlaylistsSectionProps {
  userId: string;
}

export const PlaylistsSection = (props: PlaylistsSectionProps) => {
  return (
    <Suspense fallback={<PlaylistsSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Lỗi khi tải danh sách phát</p>}>
        <PlaylistsSectionSuspense {...props} />
      </ErrorBoundary>
    </Suspense>
  );
};

const PlaylistsSectionSkeleton = () => {
  return (
    <div className="gap-4 gap-y-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <PlaylistGridCardSkeleton key={index} />
      ))}
    </div>
  );
};

const PlaylistsSectionSuspense = ({ userId }: PlaylistsSectionProps) => {
  const [playlists, query] = trpc.playlists.getManyByUser.useSuspenseInfiniteQuery(
    { userId, limit: DEFAULT_LIMIT },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const items = playlists.pages.flatMap((page) => page.items);

  if (items.length === 0) {
    return <p className="text-muted-foreground">Kênh này chưa có danh sách phát.</p>;
  }

  return (
    <>
      <div className="gap-4 gap-y-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((playlist) => (
          <PlaylistGridCard key={playlist.id} data={playlist} />
        ))}
      </div>

      <InfiniteScroll
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        fetchNextPage={query.fetchNextPage}
      />
    </>
  );
};