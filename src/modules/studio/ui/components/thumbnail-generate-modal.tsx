"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/responsive-modal";
import { useAuth } from "@clerk/nextjs";
import { useTranslations } from "next-intl";

interface ThumbnailGenerateModalProps {
  videoId: string;
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onThumbnailUpdate?: (url: string) => void;
}

interface ThumbnailResponse {
  thumbnailUrl: string;
}

export const ThumbnailGenerateModal = ({
  videoId,
  open,
  onOpenChange = () => {},
  onThumbnailUpdate = () => {},
}: ThumbnailGenerateModalProps) => {
  const t = useTranslations("Studio");
  const [isLoading, setIsLoading] = useState(false);
  const { userId: clerkId } = useAuth();

  const generateFromVideo = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/videos/workflows/thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, clerkId, useVideoFrame: true }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to generate thumbnail");
      }

      const data: ThumbnailResponse = await res.json();

      if (typeof data.thumbnailUrl === "string") {
        onThumbnailUpdate(data.thumbnailUrl);
      } else {
        throw new Error("Invalid response from server");
      }

      toast.success(t("generateThumbnailSuccess"));
      onOpenChange(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(`${t("generateThumbnailError")}: ${err.message}`);
        console.error("Generate thumbnail error:", err);
      } else {
        toast.error(t("generateThumbnailError"));
        console.error("Generate thumbnail unknown error:", err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ResponsiveModal
      title={t("generateThumbnailFromVideo")}
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className="flex justify-end p-4">
        <Button onClick={generateFromVideo} disabled={isLoading}>
          {isLoading ? t("generating") : t("generateThumbnail")}
        </Button>
      </div>
    </ResponsiveModal>
  );
};
