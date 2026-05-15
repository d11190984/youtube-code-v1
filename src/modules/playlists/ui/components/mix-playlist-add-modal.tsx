"use client";

import { toast } from "sonner";
import { Loader2Icon, SquareCheckIcon, SquareIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { trpc } from "@/trpc/client";
import { DEFAULT_LIMIT } from "@/constants";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/responsive-modal";
import { InfiniteScroll } from "@/components/infinite-scroll";

interface MixPlaylistAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
}

export const MixPlaylistAddModal = ({
  open,
  onOpenChange,
  videoId,
}: MixPlaylistAddModalProps) => {
  const t = useTranslations("Playlists");
  const utils = trpc.useUtils();

  const {
    data: playlists,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = trpc.playlists.getManyMixForVideo.useInfiniteQuery(
    {
      limit: DEFAULT_LIMIT,
      videoId,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!videoId && open,
    },
  );

  const addVideo = trpc.playlists.addVideo.useMutation({
    onSuccess: async () => {
      toast.success(t("videoAddedToMix"));

      await Promise.all([
        utils.playlists.getPublicMixPlaylists.invalidate(),
        utils.playlists.getManyMixForVideo.invalidate({ videoId }),
        utils.playlists.getMany.invalidate(),
        utils.playlists.getVideos.invalidate(),
      ]);
    },
    onError: (err) => {
      console.error("ADD MIX VIDEO ERROR:", err);
      toast.error(err.message || t("errorOccurred"));
    },
  });

  const removeVideo = trpc.playlists.removeVideo.useMutation({
    onSuccess: async () => {
      toast.success(t("videoRemovedFromMix"));

      await Promise.all([
        utils.playlists.getPublicMixPlaylists.invalidate(),
        utils.playlists.getManyMixForVideo.invalidate({ videoId }),
        utils.playlists.getMany.invalidate(),
        utils.playlists.getVideos.invalidate(),
      ]);
    },
    onError: (err) => {
      console.error("REMOVE MIX VIDEO ERROR:", err);
      toast.error(err.message || t("errorOccurred"));
    },
  });

  return (
    <ResponsiveModal
      title={t("addToMixPlaylist")}
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className="flex flex-col gap-2">
        {isLoading && (
          <div className="flex justify-center p-4">
            <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading &&
          playlists?.pages
            .flatMap((page) => page.items)
            .map((playlist) => (
              <Button
                key={playlist.id}
                variant="ghost"
                className="w-full justify-start px-2 [&_svg]:size-5"
                size="lg"
                onClick={() => {
                  if (playlist.containsVideo) {
                    removeVideo.mutate({
                      playlistId: playlist.id,
                      videoId,
                    });
                  } else {
                    addVideo.mutate({
                      playlistId: playlist.id,
                      videoId,
                    });
                  }
                }}
                disabled={removeVideo.isPending || addVideo.isPending}
              >
                {playlist.containsVideo ? (
                  <SquareCheckIcon className="mr-2" />
                ) : (
                  <SquareIcon className="mr-2" />
                )}
                {playlist.name}
              </Button>
            ))}

        {!isLoading && (
          <InfiniteScroll
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            isManual
          />
        )}
      </div>
    </ResponsiveModal>
  );
};