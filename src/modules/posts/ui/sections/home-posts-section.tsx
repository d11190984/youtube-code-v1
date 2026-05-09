"use client";

import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { PostCard } from "../components/post-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface HomePostsSectionProps {
  userId: string;
  onPostsCount?: (count: number) => void;
  onSeeAll?: () => void;
}

export const HomePostsSection = (props: HomePostsSectionProps) => {
  return (
    <Suspense fallback={<HomePostsSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Lỗi khi tải bài đăng</p>}>
        <HomePostsSectionSuspense {...props} />
      </ErrorBoundary>
    </Suspense>
  );
};

export const HomePostsSectionSkeleton = () => (
  <div className="space-y-4">
    <div className="h-8 w-48 bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-md" />
    <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="min-w-[320px] h-[200px] rounded-xl flex-shrink-0" />
      ))}
    </div>
  </div>
);

const HomePostsSectionSuspense = ({ userId, onPostsCount, onSeeAll }: HomePostsSectionProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [posts] = trpc.posts.getMany.useSuspenseInfiniteQuery({
    userId,
    limit: 10,
  }, {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const allPosts = posts.pages.flatMap((page) => page.items);

  useEffect(() => {
    onPostsCount?.(allPosts.length);
  }, [allPosts.length, onPostsCount]);

  if (allPosts.length === 0) return null;

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollTo = direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollContainerRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold text-lg">Bài đăng</h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
              onClick={() => scroll("left")}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
              onClick={() => scroll("right")}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
        {onSeeAll && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-blue-500 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/10" 
            onClick={onSeeAll}
          >
            Xem tất cả
          </Button>
        )}
      </div>

      <div className="relative group/posts">
        <div 
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 scroll-smooth items-stretch snap-x snap-mandatory"
        >
          {allPosts.map((post) => (
            <div key={post.id} className="min-w-[320px] max-w-[400px] w-full shrink-0 h-auto snap-start">
              <PostCard post={post} isCompact />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
