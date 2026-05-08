"use client";

import { PlusIcon, VideoIcon, SquarePenIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StudioUploadModal } from "@/modules/studio/ui/components/studio-upload-modal";
import { useRouter } from "next/navigation";

export const CreateButton = () => {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" className="rounded-full gap-2 px-4 h-9 font-medium hover:bg-neutral-200 dark:hover:bg-neutral-800">
          <PlusIcon className="size-5" />
          <span className="hidden sm:inline">Tạo</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 rounded-xl p-1">
        <StudioUploadModal>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-3 cursor-pointer rounded-lg py-2">
            <VideoIcon className="size-5" />
            <span>Tải video lên</span>
          </DropdownMenuItem>
        </StudioUploadModal>
        <DropdownMenuItem 
          onClick={() => router.push("/studio")} 
          className="gap-3 cursor-pointer rounded-lg py-2"
        >
          <SquarePenIcon className="size-5" />
          <span>Tạo bài đăng</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
