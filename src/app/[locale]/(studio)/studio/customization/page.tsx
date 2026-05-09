import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { CustomizationView } from "@/modules/studio/ui/views/customization-view";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

const Page = () => {
  return (
    <Suspense fallback={<CustomizationLoading />}>
      <ErrorBoundary fallback={<p>Lỗi khi tải trang tùy chỉnh</p>}>
        <CustomizationView />
      </ErrorBoundary>
    </Suspense>
  );
};

const CustomizationLoading = () => {
  return (
    <div className="flex flex-col gap-y-6 w-full max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default Page;
