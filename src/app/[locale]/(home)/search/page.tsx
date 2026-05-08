import { HydrateClient, trpc } from "@/trpc/server";

import { DEFAULT_LIMIT } from "@/constants";

import { SearchView } from "@/modules/search/ui/views/search-view";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    query: string | undefined;
    categoryId: string | undefined;
    type: "all" | "video" | "shorts" | "channel" | undefined;
    duration: "any" | "under_3" | "3_to_20" | "over_20" | undefined;
    uploadDate: "any" | "today" | "this_week" | "this_month" | "this_year" | undefined;
  }>
}

const Page = async ({ searchParams }: PageProps) => {
  const { query, categoryId, type, duration, uploadDate } = await searchParams;

  void trpc.categories.getMany.prefetch();
  void trpc.search.getMany.prefetchInfinite({
    query,
    categoryId,
    limit: DEFAULT_LIMIT,
    type: type || "all",
    duration: duration || "any",
    uploadDate: uploadDate || "any",
  });

  return ( 
    <HydrateClient>
      <SearchView 
        query={query} 
        categoryId={categoryId} 
        type={type}
        duration={duration}
        uploadDate={uploadDate}
      />
    </HydrateClient>
  );
}
 
export default Page;
