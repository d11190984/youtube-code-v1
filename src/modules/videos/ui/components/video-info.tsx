import { Link } from "@/i18n/routing";
import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS, ja, ko, zhCN, es, fr, de } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user-avatar";
import { UserInfo } from "@/modules/users/ui/components/user-info";
import { VideoMenu } from "./video-menu";
import { VideoGetManyOutput } from "../../types";

const locales: Record<string, any> = {
  vi,
  en: enUS,
  ja,
  ko,
  zh: zhCN,
  es,
  fr,
  de,
};

interface VideoInfoProps {
  data: VideoGetManyOutput["items"][number];
  onRemove?: () => void;
  hideAvatar?: boolean;
};

export const VideoInfoSkeleton = ({ hideAvatar }: { hideAvatar?: boolean }) => {
  return (
    <div className="flex gap-3">
      {!hideAvatar && <Skeleton className="size-10 flex-shrink-0 rounded-full" />}
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-[90%]" />
        <Skeleton className="h-4 w-[70%]" />
      </div>
    </div>
  );
};

export const VideoInfo = ({ data, onRemove, hideAvatar }: VideoInfoProps) => {
  const locale = useLocale();
  const t = useTranslations("Video");

  const compactViews = useMemo(() => {
    if (data.viewCount === 0) return t("noViews");
    
    return new Intl.NumberFormat(locale, {
      notation: "compact",
    }).format(data.viewCount);
  }, [data.viewCount, locale, t]);

  const compactDate = useMemo(() => {
    return formatDistanceToNow(data.createdAt, {
      addSuffix: true,
      locale: locales[locale] || enUS,
    });
  }, [data.createdAt, locale]);

  return (
    <div className="flex gap-3">
      {!hideAvatar && (
        <Link prefetch href={`/users/${data.user.id}`}>
          <UserAvatar imageUrl={data.user.imageUrl} name={data.user.name} />
        </Link>
      )}

      <div className="min-w-0 flex-1">
        <Link prefetch href={`/videos/${data.id}`}>
          <h3 className={cn(
            "font-medium line-clamp-1 lg:line-clamp-2 text-sm break-words leading-snug",
            !hideAvatar && "text-base"
          )}>
            {data.title}
          </h3>
        </Link>

        {!hideAvatar && (
          <Link prefetch href={`/users/${data.user.id}`}>
            <UserInfo name={data.user.name} />
          </Link>
        )}

        <Link prefetch href={`/videos/${data.id}`}>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {data.viewCount > 0 ? `${compactViews} ${t("views")}` : compactViews} • {compactDate}
          </p>
        </Link>
      </div>

      <div className="flex-shrink-0">
        <VideoMenu 
          videoId={data.id} 
          onRemove={onRemove} 
          title={data.title}
          thumbnailUrl={data.thumbnailUrl || undefined}
          playbackId={data.muxPlaybackId || undefined}
        />
      </div>
    </div>
  );
};
