"use client";

import dynamic from "next/dynamic";

const AnalyticsView = dynamic(
  () => import("@/modules/studio/ui/views/analytics-view").then((mod) => mod.AnalyticsView),
  { ssr: false }
);

const AnalyticsPage = () => {
  return <AnalyticsView />;
};

export default AnalyticsPage;
