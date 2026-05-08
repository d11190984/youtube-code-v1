"use client"; // ✅ chỉ 1 lần

import { useState } from "react";

interface UserTabsProps {
  userId: string;
  activeVideoTab: "latest" | "popular" | "oldest";
  setActiveVideoTabAction: (tab: "latest" | "popular" | "oldest") => void;
  activeTab: "home" | "videos" | "shorts" | "playlists" | "posts";
  setActiveTabAction: (tab: "home" | "videos" | "shorts" | "playlists" | "posts") => void;
}

export const UserTabs = ({
  activeVideoTab,
  setActiveVideoTabAction,
  activeTab,
  setActiveTabAction,
}: UserTabsProps) => {
  const tabs = [
    { key: "home", label: "Trang chủ" },
    { key: "videos", label: "Video" },
    { key: "shorts", label: "Shorts" },
    { key: "playlists", label: "Danh sách phát" },
    { key: "posts", label: "Bài đăng" },
  ];
  const videoSubTabs = [
    { key: "latest", label: "Mới nhất" },
    { key: "popular", label: "Phổ biến" },
    { key: "oldest", label: "Cũ nhất" },
  ];

  return (
    <div>
      <div className="flex gap-6 border-b border-gray-200 dark:border-neutral-800 mb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`pb-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-black dark:border-white text-black dark:text-white"
                : "text-gray-500 hover:text-black dark:hover:text-white"
            }`}
            onClick={() => {
              setActiveTabAction(
                tab.key as "home" | "videos" | "shorts" | "playlists" | "posts",
              );
              if (tab.key === "videos") setActiveVideoTabAction("latest");
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "videos" && (
        <div className="flex gap-3 mb-4">
          {videoSubTabs.map((sub) => (
            <button
              key={sub.key}
              onClick={() =>
                setActiveVideoTabAction(
                  sub.key as "latest" | "popular" | "oldest",
                )
              }
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                activeVideoTab === sub.key
                  ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white"
                  : "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 border-gray-300 dark:border-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-700"
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
