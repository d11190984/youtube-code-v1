import { HydrateClient, trpc } from "@/trpc/server";
import { CommunityView } from "@/modules/studio/ui/views/community-view";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { getTranslations } from "next-intl/server";

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const Page = async () => {
  return redirect("/studio/community/comments");
};

export default Page;
