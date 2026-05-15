import { HydrateClient, trpc } from "@/trpc/server";
import { CommunityView } from "@/modules/studio/ui/views/community-view";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    tab: string;
  }>;
}

const Page = async ({ params }: PageProps) => {
  const { tab } = await params;
  
  const validTabs = ["comments", "viewer-posts", "mentions", "settings"];
  
  if (!validTabs.includes(tab)) {
    return notFound();
  }

  void trpc.studio.getCommunityComments.prefetchInfinite({ limit: 20 });
  const t = await getTranslations("Studio");

  return (
    <HydrateClient>
      <Suspense fallback={<div className="p-8">{t("loadingCommunity")}</div>}>
        <ErrorBoundary fallback={<div className="p-8 text-red-500">{t("errorLoadingCommunity")}</div>}>
          <CommunityView currentTab={tab} />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default Page;
