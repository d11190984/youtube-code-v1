"use client";

import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { Loader2Icon, PlusIcon } from "lucide-react"
import { useTranslations } from "next-intl";

import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button"
import { ResponsiveModal } from "@/components/responsive-modal";

import { StudioUploader } from "./studio-uploader";

interface StudioUploadModalProps {
  children?: React.ReactNode;
}

export const StudioUploadModal = ({ children }: StudioUploadModalProps) => {
  const router = useRouter();
  const utils = trpc.useUtils();
  const t = useTranslations("Studio");
  const create = trpc.videos.create.useMutation({
    onSuccess: () => {
      toast.success(t("uploadVideoStarted"));
      utils.studio.getMany.invalidate();
    },
    onError: () => {
      toast.error(t("muxQuotaError"));
    },
  });

  const onSuccess = () => {
    if (!create.data?.video.id) return;

    create.reset();
    router.push(`/studio/videos/${create.data.video.id}`);
  };

  return (
    <>
      <ResponsiveModal
        title={t("uploadVideo")}
        open={!!create.data?.url}
        onOpenChange={() => create.reset()}
      >
        {create.data?.url 
          ? <StudioUploader endpoint={create.data.url} onSuccess={onSuccess} /> 
          : <Loader2Icon className="animate-spin mx-auto" />
        }
      </ResponsiveModal>
      {children ? (
        <div onClick={() => create.mutate()}>
          {children}
        </div>
      ) : (
        <Button variant="secondary" onClick={() => create.mutate()} disabled={create.isPending}>
          {create.isPending ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
          {t("create")}
        </Button>
      )}
    </>
  );
};
