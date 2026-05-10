"use client";

import { Suspense, useState } from "react";
import { Loader2Icon, ListFilterIcon } from "lucide-react";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorFallback } from "@/components/error-fallback";

import { trpc } from "@/trpc/client";
import { DEFAULT_LIMIT } from "@/constants";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { CommentForm } from "@/modules/comments/ui/components/comment-form";
import { CommentItem } from "@/modules/comments/ui/components/comment-item";

interface CommentsSectionProps {
  videoId: string;
}

export const CommentsSection = ({ videoId }: CommentsSectionProps) => {
  return (
    <Suspense fallback={<CommentsSectionSkeleton />}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <CommentsSectionSuspense videoId={videoId} />
      </ErrorBoundary>
    </Suspense>
  );
};

export const CommentsSectionSkeleton = () => {
  return (
    <div className="mt-6 flex justify-center items-center">
      <Loader2Icon className="text-muted-foreground size-7 animate-spin" />
    </div>
  );
};

const CommentsSectionSuspense = ({ videoId }: CommentsSectionProps) => {
  const [video] = trpc.videos.getOne.useSuspenseQuery({ id: videoId });
  const [sortBy, setSortBy] = useState<"top" | "newest">("top");

  const [comments, query] = trpc.comments.getMany.useSuspenseInfiniteQuery(
    {
      videoId,
      limit: DEFAULT_LIMIT,
      sortBy,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  if (!video.canComment) {
    return (
      <div className="mt-6 p-4 border rounded-xl bg-muted/30 text-center">
        <p className="text-muted-foreground text-sm font-medium">Tính năng bình luận đã bị tắt.</p>
      </div>
    );
  }

  const total = comments.pages[0]?.totalCount || 0;

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">{total} bình luận</h1>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <ListFilterIcon className="size-4" />
                Sắp xếp theo
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setSortBy("top")}>
                Nổi bật nhất
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("newest")}>
                Mới nhất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CommentForm videoId={videoId} />

        <div className="flex flex-col gap-4 mt-2">
          {comments.pages.flatMap((page) => page.items).map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}

          <InfiniteScroll
            isManual
            hasNextPage={query.hasNextPage}
            isFetchingNextPage={query.isFetchingNextPage}
            fetchNextPage={query.fetchNextPage}
          />
        </div>
      </div>
    </div>
  );
};