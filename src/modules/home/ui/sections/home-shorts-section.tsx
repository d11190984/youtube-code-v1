"use client";

import { Link } from "@/i18n/routing";
import { Suspense, useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { ChevronLeftIcon, ChevronRightIcon, FlameIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { trpc } from "@/trpc/client";

import {
  VideoShortsCard,
  VideoShortsCardSkeleton,
} from "@/modules/videos/ui/components/video-shorts-card";

interface HomeShortsSectionProps {
  categoryId?: string;
};

export const HomeShortsSection = ({ categoryId }: HomeShortsSectionProps) => {
  return (
    <Suspense key={categoryId} fallback={<HomeShortsSectionSkeleton />}>
      <ErrorBoundary fallback={null}>
        <HomeShortsSectionSuspense categoryId={categoryId} />
      </ErrorBoundary>
    </Suspense>
  );
};

const HomeShortsSectionSkeleton = () => {
  const t = useTranslations("Sidebar");
  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10">
          <FlameIcon className="size-5 text-red-500" />
        </div>
        <span className="text-lg font-bold">{t("shorts")}</span>
      </div>

      {/* Cards row */}
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <VideoShortsCardSkeleton key={i} className="w-[180px] sm:w-[210px]" />
        ))}
      </div>
    </div>
  );
};

const HomeShortsSectionSuspense = ({ categoryId }: HomeShortsSectionProps) => {
  const t = useTranslations("Sidebar");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const [videos] = trpc.videos.getManyShorts.useSuspenseInfiniteQuery(
    { limit: 20, categoryId },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  const shortsVideos = videos.pages.flatMap((page) => page.items);

  if (shortsVideos.length === 0) return null;

  const updateScrollState = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  const scroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <div className="flex flex-col gap-3 relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/feed/shorts" className="flex items-center gap-2 group">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
            <FlameIcon className="size-5 text-red-500" />
          </div>
          <span className="text-lg font-bold group-hover:text-red-500 transition-colors">
            {t("shorts")}
          </span>
        </Link>
      </div>

      {/* Scroll wrapper */}
      <div className="relative group/shelf">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 dark:bg-neutral-800/90 shadow-lg flex items-center justify-center opacity-0 group-hover/shelf:opacity-100 transition-opacity duration-200 hover:scale-110"
          >
            <ChevronLeftIcon className="size-5" />
          </button>
        )}

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 dark:bg-neutral-800/90 shadow-lg flex items-center justify-center opacity-0 group-hover/shelf:opacity-100 transition-opacity duration-200 hover:scale-110"
          >
            <ChevronRightIcon className="size-5" />
          </button>
        )}

        {/* Scrollable row */}
          <div
            ref={scrollContainerRef}
            onScroll={updateScrollState}
            className="flex gap-3 overflow-x-auto scrollbar-hide pb-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {shortsVideos.map((video) => (
              <VideoShortsCard
                key={video.id}
                data={video}
                className="w-[180px] sm:w-[210px]"
              />
            ))}
          </div>
      </div>
    </div>
  );
};
