"use client";

import { useState } from "react";
import { 
  XIcon, 
  Trash2Icon, 
  ChevronDownIcon,
  PencilIcon
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/trpc/client";
import { useConfirm } from "@/hooks/use-confirm";
import { BulkEditModal } from "./bulk-edit-modal";

interface PostBulkActionsProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onSuccess?: () => void;
}

export const PostBulkActions = ({ 
  selectedIds, 
  onClearSelection,
  onSuccess 
}: PostBulkActionsProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [ConfirmDialog, confirm] = useConfirm(
    "Xóa bài đăng?",
    "Hành động này sẽ xóa vĩnh viễn các bài đăng đã chọn. Bạn có chắc chắn không?"
  );

  const utils = trpc.useUtils();
  const removeMany = trpc.posts.removeMany.useMutation({
    onSuccess: () => {
      toast.success("Đã xóa các bài đăng đã chọn");
      utils.posts.getMany.invalidate();
      onClearSelection();
      onSuccess?.();
    },
    onError: () => {
      toast.error("Có lỗi xảy ra khi xóa bài đăng");
    },
  });

  const updateMany = trpc.posts.updateMany.useMutation({
    onSuccess: () => {
      toast.success("Đã cập nhật các bài đăng đã chọn");
      utils.posts.getMany.invalidate();
      onClearSelection();
      onSuccess?.();
    },
    onError: () => {
      toast.error("Có lỗi xảy ra khi cập nhật bài đăng");
    },
  });

  const handleDelete = async () => {
    const ok = await confirm();
    if (ok) {
      removeMany.mutate({ ids: selectedIds });
    }
  };

  const handleBulkEdit = (content: string) => {
    updateMany.mutate({ ids: selectedIds, content });
  };

  if (selectedIds.length === 0) return null;

  return (
    <div className="sticky top-0 z-50 flex h-14 w-full items-center justify-between bg-white px-6 dark:bg-zinc-950 border-b">
      <ConfirmDialog />
      <BulkEditModal 
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onConfirm={handleBulkEdit}
        title="Chỉnh sửa nội dung"
        label="Nội dung mới"
        type="textarea"
        placeholder="Nhập nội dung mới cho tất cả bài đăng đã chọn"
      />
      <div className="flex items-center gap-x-4">
        <Button variant="ghost" size="icon" onClick={onClearSelection}>
          <XIcon className="size-5" />
        </Button>
        <span className="text-sm font-medium">
          Đã chọn {selectedIds.length}
        </span>
        
        <div className="h-6 w-px bg-border mx-2" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-x-2">
              Chỉnh sửa <ChevronDownIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
              <PencilIcon className="size-4 mr-2" />
              Nội dung
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-x-2">
              Thao tác khác <ChevronDownIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              <Trash2Icon className="size-4 mr-2" />
              Xóa vĩnh viễn
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
