"use client";

import { UploadIcon, SquarePenIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StudioDashboard } from "@/modules/studio/ui/sections/studio-dashboard";

export const dynamic = "force-dynamic";

const Page = () => {
  return (
    <div className="px-4 pt-2 sm:px-8 sm:pt-4 max-w-[1600px]">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold">Trang tổng quan của kênh</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full">
            <UploadIcon className="size-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <SquarePenIcon className="size-5" />
          </Button>
        </div>
      </div>
      <StudioDashboard />
    </div>
  );
};

export default Page;