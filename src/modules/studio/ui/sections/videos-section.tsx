"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { Suspense } from "react";
import { format } from "date-fns";
import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { 
  ArrowDownIcon, 
  ArrowUpIcon, 
  Globe2Icon, 
  LockIcon,
  PencilIcon,
  BarChart2Icon,
  MessageSquareIcon,
  YoutubeIcon,
  MoreVerticalIcon,
  Share2Icon,
  MegaphoneIcon,
  DownloadIcon,
  SparklesIcon,
  Trash2Icon,
  ExternalLinkIcon,
  CalendarIcon,
  EyeIcon,
  ThumbsUpIcon,
  ActivityIcon,
  SearchIcon
} from "lucide-react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { STATUS_MAP, VISIBILITY_MAP } from "@/lib/status-map";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

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
import { VideoEditModal } from "@/modules/studio/ui/components/video-edit-modal";
import { VideoFilters } from "@/modules/studio/ui/components/video-filters";

interface VideosSectionProps {
  limit: number;
  isShorts?: boolean;
}

export const VideosSection = ({ limit, isShorts }: VideosSectionProps) => {
  const [filters, setFilters] = useState<{
    title?: string;
    description?: string;
    viewCount?: number;
    visibility?: "public" | "private";
  }>({});

  return (
    <div>
      <VideoFilters onFilterChange={(newFilters) => setFilters(newFilters)} />
      <Suspense key={`${limit}-${isShorts}-${JSON.stringify(filters)}`} fallback={<VideosSectionSkeleton />}>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <VideosSectionSuspense limit={limit} isShorts={isShorts} filters={filters} />
        </ErrorBoundary>
      </Suspense>
    </div>
  );
};

const VideosSectionSkeleton = () => {
  const t = useTranslations("Studio");
  return (
    <>
      <div className="border-y">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6 w-[40px]">
                <Checkbox disabled />
              </TableHead>
              <TableHead className="w-[510px]">{t("video")}</TableHead>
              <TableHead>{t("privacy")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  {t("date")}
                  <ArrowDownIcon className="size-4" />
                </div>
              </TableHead>
              <TableHead className="text-right">{t("views")}</TableHead>
              <TableHead className="text-right">{t("comments")}</TableHead>
              <TableHead className="text-right pr-6">{t("likes")}</TableHead>
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

interface VideosSectionSuspenseProps extends VideosSectionProps {
  filters: {
    title?: string;
    description?: string;
    viewCount?: number;
    visibility?: "public" | "private";
  };
}

const VideosSectionSuspense = ({ limit, isShorts, filters }: VideosSectionSuspenseProps) => {
  const t = useTranslations("Studio");
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<{
    id: string;
    title: string;
    description: string | null;
  } | null>(null);

  const utils = trpc.useUtils();
  const remove = trpc.videos.remove.useMutation({
    onSuccess: () => {
      toast.success(t("deleteSuccess"));
      utils.studio.getMany.invalidate();
    },
    onError: () => {
      toast.error(t("errorOccurred"));
    },
  });

  const [videos, query] = trpc.studio.getMany.useSuspenseInfiniteQuery(
    {
      limit,
      isShorts,
      sortOrder,
      ...filters,
    },
    {
      getNextPageParam: (lastPage: any) => lastPage.nextCursor,
    },
  );

  const allItems = videos.pages.flatMap((page: any) => page.items);
  const allIds = allItems.map((video: any) => video.id);

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
              <TableHead className="w-[510px]">{t("video")}</TableHead>
              <TableHead>{t("privacy")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead 
                className="cursor-pointer select-none group"
                onClick={toggleSortOrder}
              >
                <div className="flex items-center gap-1">
                  {t("date")}
                  {sortOrder === "desc" ? (
                    <ArrowDownIcon className="size-4" />
                  ) : (
                    <ArrowUpIcon className="size-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="text-right">{t("views")}</TableHead>
              <TableHead className="text-right">{t("comments")}</TableHead>
              <TableHead className="text-right pr-6">{t("likes")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-[400px] text-center text-muted-foreground">
                   <div className="flex flex-col items-center justify-center gap-y-4">
                    <SearchIcon className="size-16 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">{t("noVideosMatching")}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {allItems.map((video: any) => (
              <TableRow 
                key={video.id}
                className="cursor-pointer group"
                onClick={() => router.push(`/studio/videos/${video.id}`)}
              >
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
                      <div className="flex flex-col overflow-hidden justify-center min-h-[80px]">
                        <span className="text-sm font-medium line-clamp-1 group-hover:text-blue-500 transition-colors">
                          {video.title}
                        </span>
                        
                        <div className="flex items-center gap-x-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/studio/videos/${video.id}`);
                                  }}
                                >
                                  <PencilIcon className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t("edit")}</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/studio/videos/${video.id}/analytics`);
                                  }}
                                >
                                  <BarChart2Icon className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t("analytics")}</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/studio/videos/${video.id}/comments`);
                                  }}
                                >
                                  <MessageSquareIcon className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t("comments")}</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`/videos/${video.id}`, "_blank");
                                  }}
                                >
                                  <YoutubeIcon className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t("viewOnYouTube")}</TooltipContent>
                            </Tooltip>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVerticalIcon className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="w-64">
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingVideo({
                                      id: video.id,
                                      title: video.title,
                                      description: video.description,
                                    });
                                    setEditModalOpen(true);
                                  }}
                                >
                                  <PencilIcon className="mr-2 size-4" />
                                  {t("editTitleDesc")}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(`${window.location.origin}/videos/${video.id}`);
                                    toast.success(t("linkCopied"));
                                  }}
                                >
                                  <Share2Icon className="mr-2 size-4" />
                                  {t("getShareLink")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                  <MegaphoneIcon className="mr-2 size-4" />
                                  {t("promote")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => e.stopPropagation()} asChild>
                                  <a 
                                    href={video.muxPlaybackId ? `https://stream.mux.com/${video.muxPlaybackId}/highest.mp4` : "#"} 
                                    download 
                                    target="_blank"
                                  >
                                    <DownloadIcon className="mr-2 size-4" />
                                    {t("download")}
                                  </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                  <SparklesIcon className="mr-2 size-4" />
                                  {t("videoIdeas")}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600 focus:text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    remove.mutate({ id: video.id });
                                  }}
                                >
                                  <Trash2Icon className="mr-2 size-4" />
                                  {t("deletePermanently")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TooltipProvider>
                        </div>

                        <span className="text-xs text-muted-foreground line-clamp-1 group-hover:hidden transition-all">
                          {video.description || t("noDescription")}
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
                      {t(video.visibility)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {t(video.muxStatus || "error")}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex flex-col">
                      <span>
                        {format(new Date(video.createdAt), "d MMM, yyyy")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t("published")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell 
                    className="text-right text-sm cursor-pointer hover:text-blue-500 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/studio/videos/${video.id}/analytics`);
                    }}
                  >
                    {video.viewCount}
                  </TableCell>
                  <TableCell 
                    className="text-right text-sm cursor-pointer hover:text-blue-500 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/studio/videos/${video.id}/comments`);
                    }}
                  >
                    {video.commentCount}
                  </TableCell>
                  <TableCell className="text-right text-sm pr-6">
                    {video.likeCount}
                  </TableCell>
                </TableRow>
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
      {editingVideo && (
        <VideoEditModal
          videoId={editingVideo.id}
          title={editingVideo.title}
          description={editingVideo.description}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
        />
      )}
    </div>
  );
};
