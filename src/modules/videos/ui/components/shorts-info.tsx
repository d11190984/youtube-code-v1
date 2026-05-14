"use client";

import { Link } from "@/i18n/routing";
import { MusicIcon } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useTranslations } from "next-intl";

import { UserAvatar } from "@/components/user-avatar";
import { VideoGetOneOutput } from "../../types";
import { Button } from "@/components/ui/button";

interface ShortsInfoProps {
  video: VideoGetOneOutput;
}

export const ShortsInfo = ({ video }: ShortsInfoProps) => {
  const t = useTranslations("Video");
  const { userId } = useAuth();

  return (
    <div className="flex flex-col gap-3 p-4 text-white">
      {/* Channel Info */}
      <div className="flex items-center gap-3">
        <Link href={`/users/${video.user.id}`} className="flex items-center gap-2">
          <UserAvatar size="sm" imageUrl={video.user.imageUrl} name={video.user.name} />
          <span className="font-bold text-sm">
            @{video.user.handle || video.user.name.replace(/\s+/g, "").toLowerCase()}
          </span>
        </Link>
        {userId !== video.user.clerkId && (
          <Button variant="secondary" size="sm" className="rounded-full h-8 px-4 bg-white text-black hover:bg-neutral-200 font-medium">
            {t("subscribe")}
          </Button>
        )}
      </div>

      {/* Title */}
      <div className="min-w-0">
        <h2 className="text-sm font-medium line-clamp-2 leading-snug break-words">
          {video.title}
        </h2>
      </div>

      {/* Music / Remix info */}
      <div className="flex items-center gap-2 overflow-hidden">
        <MusicIcon className="size-3 flex-shrink-0" />
        <div className="text-xs whitespace-nowrap animate-marquee">
          {video.title} - {video.user.name}
        </div>
      </div>
    </div>
  );
};
