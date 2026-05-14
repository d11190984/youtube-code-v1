"use client";

import { Suspense } from "react";
import { useRouter, usePathname } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { ErrorBoundary } from "react-error-boundary";
import { useTranslations } from "next-intl";

import { trpc } from "@/trpc/client";
import { FilterCarousel } from "@/components/filter-carousel";

interface CategoriesSectionProps {
  categoryId?: string;
};

export const CategoriesSection = ({ categoryId }: CategoriesSectionProps) => {
  return (
    <Suspense fallback={<CategoriesSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error...</p>}>
        <CategoriesSectionSuspense categoryId={categoryId} />
      </ErrorBoundary>
    </Suspense>
  )
}

export const CategoriesSectionSkeleton = () => {
  return <FilterCarousel isLoading data={[]} onSelect={() => {}} />
};

const CategoriesSectionSuspense = ({ categoryId }: CategoriesSectionProps) => {
  const t = useTranslations("Categories");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [categories] = trpc.categories.getMany.useSuspenseQuery();

  const data = categories.map((category) => ({
    value: category.id,
    label: t(category.name),
  }));

  const onSelect = (value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set("categoryId", value);
    } else {
      params.delete("categoryId");
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  return <FilterCarousel onSelect={onSelect} value={categoryId} data={data} />
};
