"use client";

import Link from "next/link";
import { Suspense } from "react";
import { format } from "date-fns";
import { useState } from "react";
import { 
  ArrowDownIcon, 
  ArrowUpIcon, 
  Globe2Icon, 
  LockIcon 
} from "lucide-react";
import { ErrorBoundary } from "react-error-boundary";

import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { STATUS_MAP, VISIBILITY_MAP } from "@/lib/status-map";

import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { ErrorFallback } from "@/components/error-fallback";
import { InfiniteScroll } from "@/components/infinite-scroll";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { VideoThumbnail } from "@/modules/videos/ui/components/video-thumbnail";
import { BulkActions } from "@/modules/studio/ui/components/bulk-actions";

interface VideosSectionProps {
  limit: number;
  isShorts?: boolean;
}

export const VideosSection = ({ limit, isShorts }: VideosSectionProps) => {
  return (
    <Suspense key={`${limit}-${isShorts}`} fallback={<VideosSectionSkeleton />}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <VideosSectionSuspense limit={limit} isShorts={isShorts} />
      </ErrorBoundary>
    </Suspense>
  );
};

const VideosSectionSkeleton = () => {
  return (
    <>
      <div className="border-y">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6 w-[40px]">
                <Checkbox disabled />
              </TableHead>
              <TableHead className="w-[510px]">Video</TableHead>
              <TableHead>Quyền riêng tư</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  Ngày
                  <ArrowDownIcon className="size-4" />
                </div>
              </TableHead>
              <TableHead className="text-right">Lượt xem</TableHead>
              <TableHead className="text-right">Bình luận</TableHead>
              <TableHead className="text-right pr-6">Lượt thích</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell className="pl-6">
                  <Checkbox disabled />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-20 w-36" />
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-4 w-[100px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-4 w-12 ml-auto" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-4 w-12 ml-auto" />
                </TableCell>
                <TableCell className="text-right pr-6">
                  <Skeleton className="h-4 w-12 ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

const VideosSectionSuspense = ({ limit, isShorts }: VideosSectionProps) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [videos, query] = trpc.studio.getMany.useSuspenseInfiniteQuery(
    {
      limit,
      isShorts,
      sortOrder,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const allItems = videos.pages.flatMap((page) => page.items);
  const allIds = allItems.map((video) => video.id);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === allIds.length ? [] : allIds);
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
    setSelectedIds([]); // Clear selection when sorting changes
  };

  return (
    <div>
      <BulkActions 
        selectedIds={selectedIds} 
        videos={allItems}
        onClearSelection={() => setSelectedIds([])} 
      />
      <div className="border-y">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6 w-[40px]">
                <Checkbox 
                  checked={selectedIds.length === allIds.length && allIds.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[510px]">Video</TableHead>
              <TableHead>Quyền riêng tư</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead 
                className="cursor-pointer select-none group"
                onClick={toggleSortOrder}
              >
                <div className="flex items-center gap-1">
                  Ngày
                  {sortOrder === "desc" ? (
                    <ArrowDownIcon className="size-4" />
                  ) : (
                    <ArrowUpIcon className="size-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="text-right">Lượt xem</TableHead>
              <TableHead className="text-right">Bình luận</TableHead>
              <TableHead className="text-right pr-6">Lượt thích</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allItems.map((video) => (
              <Link
                prefetch
                href={`/studio/videos/${video.id}`}
                key={video.id}
                legacyBehavior
              >
                <TableRow className="cursor-pointer">
                  <TableCell className="pl-6">
                    <Checkbox 
                      checked={selectedIds.includes(video.id)}
                      onCheckedChange={() => toggleSelection(video.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "relative shrink-0 overflow-hidden rounded-md bg-black max-h-[180px]",
                          video.videoHeight &&
                            video.videoWidth &&
                            video.videoHeight > video.videoWidth
                            ? "w-20 aspect-[9/16]"
                            : "w-36 aspect-video",
                        )}
                      >
                        <VideoThumbnail
                          title={video.title}
                          duration={video.duration || 0}
                          imageUrl={video.thumbnailUrl}
                          previewUrl={video.previewUrl}
                          videoWidth={video.videoWidth ?? undefined}
                          videoHeight={video.videoHeight ?? undefined}
                        />
                      </div>
                      <div className="flex flex-col overflow-hidden gap-y-1">
                        <span className="text-sm line-clamp-1">
                          {video.title}
                        </span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {video.description || "Không có mô tả"}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {video.visibility === "private" ? (
                        <LockIcon className="size-4 mr-2" />
                      ) : (
                        <Globe2Icon className="size-4 mr-2" />
                      )}
                      {
                        VISIBILITY_MAP[
                          video.visibility as keyof typeof VISIBILITY_MAP
                        ]
                      }
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {STATUS_MAP[
                        video.muxStatus as keyof typeof STATUS_MAP
                      ] || "Lỗi"}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex flex-col">
                      <span>
                        {format(new Date(video.createdAt), "d 'thg' M, yyyy")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Đã đăng
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {video.viewCount}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {video.commentCount}
                  </TableCell>
                  <TableCell className="text-right text-sm pr-6">
                    {video.likeCount}
                  </TableCell>
                </TableRow>
              </Link>
            ))}
          </TableBody>
        </Table>
      </div>
      <InfiniteScroll
        isManual
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        fetchNextPage={query.fetchNextPage}
      />
    </div>
  );
};
