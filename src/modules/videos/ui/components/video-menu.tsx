import { toast } from "sonner";
import { useState } from "react";
import {
  ListPlusIcon,
  MoreVerticalIcon,
  ShareIcon,
  Trash2Icon,
  PlusIcon,
  ListVideoIcon,
} from "lucide-react";

import { APP_URL } from "@/constants";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { PlaylistAddModal } from "@/modules/playlists/ui/components/playlist-add-modal";
import { MixPlaylistCreateModal } from "@/modules/playlists/ui/components/mix-playlist-create-modal";
import { MixPlaylistAddModal } from "@/modules/playlists/ui/components/mix-playlist-add-modal";
import { usePlayerStore } from "@/modules/videos/store/use-player-store";

interface VideoMenuProps {
  videoId: string;
  title?: string;
  thumbnailUrl?: string;
  playbackId?: string;
  variant?: "ghost" | "secondary";
  onRemove?: () => void;
}

export const VideoMenu = ({
  videoId,
  title,
  thumbnailUrl,
  playbackId,
  variant = "ghost",
  onRemove,
}: VideoMenuProps) => {
  const [isOpenPlaylistAddModal, setIsOpenPlaylistAddModal] = useState(false);
  const [isOpenCreateModal, setIsOpenCreateModal] = useState(false);
  const [isOpenMixAddModal, setIsOpenMixAddModal] = useState(false);
  
  const addToQueue = usePlayerStore((state) => state.addToQueue);

  const onShare = () => {
    const fullUrl = `${APP_URL}/videos/${videoId}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success("Đã sao chép liên kết");
  };

  const handleAddToQueue = () => {
    if (!title || !playbackId) {
      toast.error("Không thể thêm vào hàng chờ: Thiếu thông tin");
      return;
    }
    addToQueue({
      id: videoId,
      title,
      thumbnailUrl,
      playbackId,
    });
    toast.success("Đã thêm vào hàng chờ");
  };

  return (
    <>
      {/* thêm vào danh sách phát thường */}
      <PlaylistAddModal
        videoId={videoId}
        open={isOpenPlaylistAddModal}
        onOpenChange={setIsOpenPlaylistAddModal}
      />

      {/* tạo danh sách kết hợp */}
      <MixPlaylistCreateModal
        open={isOpenCreateModal}
        onOpenChange={setIsOpenCreateModal}
        initialVideoIds={[videoId]}
      />
      <MixPlaylistAddModal
        videoId={videoId}
        open={isOpenMixAddModal}
        onOpenChange={setIsOpenMixAddModal}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size="icon" className="rounded-full">
            <MoreVerticalIcon />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={handleAddToQueue}>
            <ListVideoIcon className="mr-2 size-4" />
            Thêm vào hàng chờ
          </DropdownMenuItem>

          <DropdownMenuItem onClick={onShare}>
            <ShareIcon className="mr-2 size-4" />
            Chia sẻ
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setIsOpenPlaylistAddModal(true)}>
            <ListPlusIcon className="mr-2 size-4" />
            Thêm vào danh sách phát
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setIsOpenCreateModal(true)}>
            <PlusIcon className="mr-2 size-4" />
            Tạo danh sách kết hợp mới
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsOpenMixAddModal(true)}>
            <ListPlusIcon className="mr-2 size-4" />
            Thêm vào danh sách kết hợp
          </DropdownMenuItem>
          {onRemove && (
            <DropdownMenuItem onClick={onRemove}>
              <Trash2Icon className="mr-2 size-4" />
              Xóa khỏi lịch sử
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
