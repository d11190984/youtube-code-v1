"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/trpc/client";
import { PlaylistGetManyOutput } from "../../../types";
import { useRouter } from "@/i18n/routing";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVerticalIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";

interface PlaylistInfoProps {
  data: PlaylistGetManyOutput["items"][number];
}

export const PlaylistInfoSkeleton = () => {
  return (
    <div className="flex gap-3">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-5 w-[90%]" />
        <Skeleton className="h-5 w-[70%]" />
        <Skeleton className="h-5 w-[50%]" />
      </div>
    </div>
  );
};

export const PlaylistInfo = ({ data }: PlaylistInfoProps) => {
  const t = useTranslations("Playlists");
  const [visibility, setVisibility] = useState<"public" | "private">(
    data.visibility,
  );
  const utils = trpc.useUtils(); // ✅ THÊM DÒNG NÀY
  const router = useRouter();
  // TRPC mutation update visibility
  const updateVisibility = trpc.playlists.updateVisibility.useMutation({
    onSuccess: (data) => {
      toast.success(
        t("updateSuccess"),
      );
      // 🔥 refresh lại dữ liệu
      utils.playlists.getPublicMixPlaylists.invalidate();
      utils.playlists.getMany.invalidate(); // 👈 thêm luôn cho chắc
    },
    onError: () => toast.error(t("updateError")),
  });

  const handleChange = (newVisibility: "public" | "private") => {
    setVisibility(newVisibility); // update UI ngay
    updateVisibility.mutate({ playlistId: data.id, visibility: newVisibility }); // gửi lên server
  };
  const removePlaylist = trpc.playlists.remove.useMutation({
    onSuccess: () => {
      toast.success(t("deleteSuccess"));
      utils.playlists.getPublicMixPlaylists.invalidate();
      utils.playlists.getMany.invalidate();
    },
    onError: () => toast.error(t("deleteError")),
  });
  const handleRemove = () => {
    if (!confirm(t("deleteConfirm", { name: data.name }))) return;
    removePlaylist.mutate({ id: data.id });
  };
  return (
    <div className="flex gap-3 items-center">
      <div className="min-w-0 flex-1">
        <h3 className="font-medium line-clamp-1 lg:line-clamp-2 text-sm break-words">
          {data.name}
        </h3>
        <p className="text-sm text-muted-foreground">
          {data.isMixPlaylist ? t("mixPlaylist") : t("playlist")}
        </p>
        <p
          className="text-sm text-muted-foreground font-semibold hover:text-primary cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            if (data.firstVideoId) {
              router.push(
                `/videos/${data.firstVideoId}?list=${data.id}&index=0`,
              );
            }
          }}
        >
          {data.isMixPlaylist ? t("playList") : t("viewAll")}
        </p>
      </div>

      {/* Dropdown chọn public/private */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="rounded-full">
            <MoreVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={() => handleChange("public")}>
            {t("public")} {visibility === "public" ? "✔️" : ""}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleChange("private")}>
            {t("private")} {visibility === "private" ? "✔️" : ""}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleRemove}
            className="text-red-500 focus:text-red-500"
          >
            <Trash2Icon className="mr-2 size-4" />
            {t("removePlaylist")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
