import Image from "next/image";
import { formatDuration } from "@/lib/utils";
import { THUMBNAIL_FALLBACK } from "../../constants";
import { Skeleton } from "@/components/ui/skeleton";

interface VideoThumbnailProps {
  title: string;
  duration: number; // milliseconds
  imageUrl?: string | null;
  previewUrl?: string | null;
  progress?: number; // seconds watched
}

export const VideoThumbnailSkeleton = () => {
  return (
    <div className="relative w-full overflow-hidden rounded-xl aspect-video">
      <Skeleton className="size-full" />
    </div>
  );
};

export const VideoThumbnail = ({
  title,
  imageUrl,
  previewUrl,
  duration,
  progress = 0,
}: VideoThumbnailProps) => {
  const totalSeconds = duration / 1000;

  const isWatched = totalSeconds > 0 && progress / totalSeconds >= 0.95;

  const progressPercent = isWatched
    ? 100
    : totalSeconds > 0
      ? Math.min((progress / totalSeconds) * 100, 100)
      : 0;

  return (
    <div className="relative group">
      <div className="relative w-full overflow-hidden rounded-xl aspect-video">
        <Image
          src={imageUrl || THUMBNAIL_FALLBACK}
          alt={title}
          fill
          className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-0"
        />

        <Image
          unoptimized={!!previewUrl}
          src={previewUrl || THUMBNAIL_FALLBACK}
          alt={title}
          fill
          className="h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />

        <div className="absolute bottom-2 right-2 px-1 py-0.5 rounded bg-black/80 text-white text-xs font-medium">
          {formatDuration(duration)}
        </div>

        {progressPercent > 0 && (
          <div className="absolute bottom-0 left-0 w-full h-[3px] bg-neutral-700/60">
            <div
              className="h-full bg-red-600 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};