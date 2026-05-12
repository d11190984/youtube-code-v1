import { HydrateClient, trpc } from "@/trpc/server";
import { CommunityView } from "@/modules/studio/ui/views/community-view";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

export const dynamic = "force-dynamic";

const Page = async () => {
  void trpc.studio.getCommunityComments.prefetchInfinite({ limit: 20 });

  return (
    <HydrateClient>
      <Suspense fallback={<div className="p-8">Đang tải cộng đồng...</div>}>
        <ErrorBoundary fallback={<div className="p-8 text-red-500">Đã xảy ra lỗi khi tải dữ liệu cộng đồng</div>}>
          <CommunityView />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
};

export default Page;
