"use client";

import { useState } from "react";

interface UserTabsProps {
  userId: string;
  activeVideoTab: "latest" | "popular" | "oldest";
  setActiveVideoTabAction: (tab: "latest" | "popular" | "oldest") => void;
}

export const UserTabs = ({
  userId,
  activeVideoTab,
  setActiveVideoTabAction,
}: UserTabsProps) => {
  const [activeTab, setActiveTab] = useState("home");

  const tabs = [
    { key: "home", label: "Trang chủ" },
    { key: "videos", label: "Video" },
    { key: "shorts", label: "Shorts" },
    { key: "posts", label: "Bài đăng" },
  ];

  const videoSubTabs = [
    { key: "latest", label: "Mới nhất" },
    { key: "popular", label: "Phổ biến" },
    { key: "oldest", label: "Cũ nhất" },
  ];

  return (
    <div>
      {/* Main Tabs */}
      <div className="flex gap-6 border-b border-gray-300 mb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`pb-2 text-sm font-medium ${
              activeTab === tab.key
                ? "border-b-2 border-black text-black"
                : "text-gray-500"
            }`}
            onClick={() => {
              setActiveTab(tab.key);
              if (tab.key === "videos")
                setActiveVideoTabAction("latest" as "latest"); // reset sub-tab
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Video Sub-Tabs */}
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
              className={`px-3 py-1 text-sm rounded-full border ${
                activeVideoTab === sub.key
                  ? "bg-black text-white border-black"
                  : "bg-gray-100 text-gray-600 border-gray-300"
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
