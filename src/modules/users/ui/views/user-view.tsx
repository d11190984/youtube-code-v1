"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { UserSection } from "../sections/user-section";
import { VideosSection } from "../sections/videos-section";
import { UserTabs } from "../components/user-tabs";
import { FlameIcon } from "lucide-react";
import { ErrorBoundary } from "react-error-boundary";
import { PlaylistsSection } from "../sections/playlists-section";
import { PostsSection } from "@/modules/posts/ui/sections/posts-section";
import { HomePostsSection } from "@/modules/posts/ui/sections/home-posts-section";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface UserViewProps {
  userId: string;
}

export const UserView = ({ userId }: UserViewProps) => {
  const t = useTranslations("Users");
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const tab = searchParams.get("tab") as "home" | "videos" | "shorts" | "playlists" | "posts" | null;

  const [activeTab, setActiveTab] = useState<
    "home" | "videos" | "shorts" | "playlists" | "posts"
  >(tab || "home");

  // Sync state with URL when tab changes internally
  const handleTabChange = (newTab: typeof activeTab) => {
    setActiveTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", newTab);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const [activeVideoTab, setActiveVideoTab] = useState<
    "latest" | "popular" | "oldest"
  >("latest");

  const [homeCount, setHomeCount] = useState<number | null>(null);
  const [videoCount, setVideoCount] = useState<number | null>(null);
  const [shortsCount, setShortsCount] = useState<number | null>(null);
  const [postCount, setPostCount] = useState<number | null>(null);

  return (
    <div className="flex flex-col max-w-[1300px] px-4 pt-2.5 mx-auto mb-10 gap-y-6">
      <UserSection userId={userId} />

      <UserTabs
        userId={userId}
        activeVideoTab={activeVideoTab}
        setActiveVideoTabAction={setActiveVideoTab}
        activeTab={activeTab}
        setActiveTabAction={handleTabChange}
      />

      {/* Homepage */}
      {activeTab === "home" && (
        <>
          <h2
            className={`font-semibold text-lg mb-4 ${homeCount === 0 ? "hidden" : ""}`}
          >
            {t("forYou")}
          </h2>
          <VideosSection
            userId={userId}
            filterType="home"
            showCarousel
            onVideosCount={setHomeCount}
          />

          <h2
            className={`font-semibold text-lg mb-4 mt-6 ${videoCount === 0 ? "hidden" : ""}`}
          >
            {t("popularVideos")}
          </h2>
          <VideosSection
            userId={userId}
            filterType="videos"
            sortBy="popular"
          />

          <HomePostsSection 
            userId={userId} 
            onPostsCount={setPostCount} 
            onSeeAll={() => handleTabChange("posts")}
          />

          <h2
            className={`font-semibold text-lg mb-4 mt-8 flex items-center gap-2 ${shortsCount === 0 ? "hidden" : ""}`}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10">
              <FlameIcon className="size-5 text-red-500" />
            </div>
            Shorts
          </h2>
          <VideosSection
            userId={userId}
            filterType="shorts"
            onVideosCount={setShortsCount}
          />
        </>
      )}

      {/* Tab Video */}
      {activeTab === "videos" && (
        <VideosSection
          userId={userId}
          filterType="videos"
          sortBy={activeVideoTab}
        />
      )}

      {/* Tab Shorts */}
      {activeTab === "shorts" && (
        <VideosSection userId={userId} filterType="shorts" />
      )}
      {activeTab === "playlists" && <PlaylistsSection userId={userId} />}
      {activeTab === "posts" && <PostsSection userId={userId} />}
    </div>
  );
};
