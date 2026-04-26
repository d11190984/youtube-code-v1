// UserView.tsx
"use client";

import { useState } from "react";
import { UserSection } from "../sections/user-section";
import { VideosSection } from "../sections/videos-section";
import { UserTabs } from "../components/user-tabs";

interface UserViewProps {
  userId: string;
}

export const UserView = ({ userId }: UserViewProps) => {
  const [activeVideoTab, setActiveVideoTab] = useState<
    "latest" | "popular" | "oldest"
  >("latest");

  return (
    <div className="flex flex-col max-w-[1300px] px-4 pt-2.5 mx-auto mb-10 gap-y-6">
      <UserSection userId={userId} />
      <UserTabs
        userId={userId}
        activeVideoTab={activeVideoTab}
        setActiveVideoTabAction={setActiveVideoTab} // ✅ trùng với interface
      />
      <VideosSection userId={userId} sortBy={activeVideoTab} />
    </div>
  );
};
