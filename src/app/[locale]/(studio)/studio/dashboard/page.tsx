"use client";

import { useRouter } from "@/i18n/routing";
import { UploadIcon, SquarePenIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StudioUploadModal } from "@/modules/studio/ui/components/studio-upload-modal";
import { StudioDashboard } from "@/modules/studio/ui/sections/studio-dashboard";
import { useTranslations } from "next-intl";

export const dynamic = "force-dynamic";

const Page = () => {
  const router = useRouter();
  const t = useTranslations("Studio");

  return (
    <div className="px-4 pt-2 sm:px-8 sm:pt-4 max-w-[1600px]">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold">{t("channelDashboard")}</h1>
        <div className="flex items-center gap-2">
          <StudioUploadModal>
            <Button variant="outline" className="rounded-full gap-2 px-4 shadow-sm border-neutral-200 dark:border-neutral-800">
              <UploadIcon className="size-4" />
              <span className="hidden sm:inline text-xs font-bold">{t("uploadVideo")}</span>
            </Button>
          </StudioUploadModal>
          
          <Button 
            variant="outline" 
            className="rounded-full gap-2 px-4 shadow-sm border-neutral-200 dark:border-neutral-800"
            onClick={() => router.push("/users/current?tab=posts")}
          >
            <SquarePenIcon className="size-4" />
            <span className="hidden sm:inline text-xs font-bold">{t("createPost")}</span>
          </Button>
        </div>
      </div>
      <StudioDashboard />
    </div>
  );
};

export default Page;