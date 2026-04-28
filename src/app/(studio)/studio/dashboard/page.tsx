"use client";

import { StudioSidebar } from "@/modules/studio/ui/components/studio-sidebar";
import { StudioDashboard } from "@/modules/studio/ui/sections/studio-dashboard";

export const dynamic = "force-dynamic";

const Page = () => {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <StudioSidebar />

      {/* Main content */}
      <main className="flex-1 px-2 sm:px-4 py-4">
        <h1 className="text-2xl font-bold mb-4">Tổng quan kênh</h1>
        <StudioDashboard />
      </main>
    </div>
  );
};

export default Page;