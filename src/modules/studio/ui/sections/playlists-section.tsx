"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { Suspense, useState } from "react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { Globe2Icon, LockIcon, SearchIcon } from "lucide-react";
import { ErrorBoundary } from "react-error-boundary";

import { ErrorFallback } from "@/components/error-fallback";
import { trpc } from "@/trpc/client";
import { VISIBILITY_MAP } from "@/lib/status-map";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { InfiniteScroll } from "@/components/infinite-scroll";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlaylistFilters } from "@/modules/studio/ui/components/playlist-filters";

interface PlaylistsSectionProps {
  limit: number;
}

export const PlaylistsSection = ({ limit }: PlaylistsSectionProps) => {
  const t = useTranslations("Studio");
  const [filters, setFilters] = useState<{
    name?: string;
    visibility?: "public" | "private";
  }>({});

  return (
    <div>
      <PlaylistFilters onFilterChange={(newFilters) => setFilters(newFilters)} />
      <Suspense key={`${limit}-${JSON.stringify(filters)}`} fallback={<PlaylistsSectionSkeleton />}>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <PlaylistsSectionSuspense limit={limit} filters={filters} />
        </ErrorBoundary>
      </Suspense>
    </div>
  );
};

const PlaylistsSectionSkeleton = () => {
  const t = useTranslations("Studio");
  return (
    <div className="border-y">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6 w-[510px]">{t("playlists")}</TableHead>
            <TableHead>{t("type")}</TableHead>
            <TableHead>{t("privacy")}</TableHead>
            <TableHead>{t("lastUpdated")}</TableHead>
            <TableHead className="text-right">{t("videoCount")}</TableHead>
            <TableHead className="text-right pr-6">{t("views")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell className="pl-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-20 w-36" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
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
  );
};

interface PlaylistsSectionSuspenseProps extends PlaylistsSectionProps {
  filters: {
    name?: string;
    visibility?: "public" | "private";
  };
}

const PlaylistsSectionSuspense = ({ limit, filters }: PlaylistsSectionSuspenseProps) => {
  const t = useTranslations("Studio");
  const [playlists, query] = trpc.playlists.getMany.useSuspenseInfiniteQuery(
    {
      limit,
      ...filters,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const allItems = playlists.pages.flatMap((page) => page.items);

  return (
    <div>
      <div className="border-y">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6 w-[510px]">{t("playlists")}</TableHead>
              <TableHead>{t("type")}</TableHead>
              <TableHead>{t("privacy")}</TableHead>
              <TableHead>{t("lastUpdated")}</TableHead>
              <TableHead className="text-right">{t("videoCount")}</TableHead>
              <TableHead className="text-right pr-6">{t("views")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-[400px] text-center text-muted-foreground">
                   <div className="flex flex-col items-center justify-center gap-y-4">
                    <SearchIcon className="size-16 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">{t("noPlaylistsMatching")}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {allItems.map((playlist: any) => (
              <Link
                prefetch
                href={`/playlists/${playlist.id}`}
                key={playlist.id}
                legacyBehavior
              >
                <TableRow className="cursor-pointer">
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0 w-36 aspect-video overflow-hidden rounded-md bg-black">
                        {playlist.thumbnailUrl ? (
                          <img
                            src={playlist.thumbnailUrl}
                            alt={playlist.name}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-muted-foreground text-xs">
                            {t("empty")}
                          </div>
                        )}
                        <div className="absolute bottom-0 right-0 bg-black/80 px-2 py-1 text-[10px] text-white flex items-center gap-1">
                            {playlist.videoCount} video
                        </div>
                      </div>
                      <div className="flex flex-col overflow-hidden gap-y-1">
                        <span className="text-sm font-medium line-clamp-1">
                          {playlist.name}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {playlist.isMixPlaylist ? t("combined") : t("standard")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {playlist.visibility === "private" ? (
                        <LockIcon className="size-4 mr-2" />
                      ) : (
                        <Globe2Icon className="size-4 mr-2" />
                      )}
                      {t(playlist.visibility)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(playlist.updatedAt), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {playlist.videoCount}
                  </TableCell>
                  <TableCell className="text-right text-sm pr-6">
                    {playlist.viewCount.toLocaleString()}
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
