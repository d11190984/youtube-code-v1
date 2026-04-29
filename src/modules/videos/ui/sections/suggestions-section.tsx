"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { trpc } from "@/trpc/client";
import { DEFAULT_LIMIT } from "@/constants";
import { useRouter } from "next/navigation";
import { VideoPlayerHandle } from "../components/video-player";

import {
  VideoGridCard,
  VideoGridCardSkeleton,
} from "../components/video-grid-card";
import {
  VideoRowCard,
  VideoRowCardSkeleton,
} from "../components/video-row-card";
import { VideoGetManyOutput } from "../../types";

interface SuggestionsSectionProps {
  videoId: string;
  isManual?: boolean;
  playerRef: React.RefObject<VideoPlayerHandle>;
}

type Video = VideoGetManyOutput["items"][number] & {
  playlist?: {
    id: string;
    name: string;
    videos: { id: string; title: string; thumbnailUrl?: string | null }[];
  };
  progress?: number;
};

export const SuggestionsSection = ({
  videoId,
  isManual,
  playerRef,
}: SuggestionsSectionProps) => {
  return (
    <Suspense fallback={<SuggestionsSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <SuggestionsSectionSuspense
          videoId={videoId}
          isManual={isManual}
          playerRef={playerRef}
        />
      </ErrorBoundary>
    </Suspense>
  );
};

export const SuggestionsSectionSkeleton = () => {
  return (
    <>
      <div className="hidden md:block space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <VideoRowCardSkeleton key={index} size="compact" />
        ))}
      </div>
      <div className="block md:hidden space-y-10">
        {Array.from({ length: 6 }).map((_, index) => (
          <VideoGridCardSkeleton key={index} />
        ))}
      </div>
    </>
  );
};

const SuggestionsSectionSuspense = ({
  videoId,
  playerRef,
}: SuggestionsSectionProps) => {
  const router = useRouter();

  const [data] = trpc.suggestions.getMany.useSuspenseQuery(
    {
      videoId,
      limit: DEFAULT_LIMIT,
    },
    {
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    },
  );

  const videosWithProgress: Video[] = data.items.map((video) => ({
    ...video,
    progress: video.progress ?? 0,
  }));

  const handleNavigate = async (targetId: string) => {
    await playerRef.current?.saveCurrentProgress();
    router.push(`/videos/${targetId}`);
  };

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block space-y-3">
        {videosWithProgress.map((video: Video) => (
          <VideoRowCard
            key={video.id}
            data={video}
            size="compact"
            progress={video.progress}
          />
        ))}
      </div>

      {/* Mobile */}
      <div className="block md:hidden space-y-10">
        {videosWithProgress.map((video: Video) => (
          <VideoGridCard
            key={video.id}
            data={video}
            progress={video.progress}
          />
        ))}
      </div>
    </>
  );
};
