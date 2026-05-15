"use client";

import { ResultsSection } from "../sections/results-section";
import { CategoriesSection } from "../sections/categories-section";
import { SearchFilters } from "../components/search-filters";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { trpc } from "@/trpc/client";
import { useAuth } from "@clerk/nextjs";

interface PageProps {
  query: string | undefined;
  categoryId: string | undefined;
  type: "all" | "video" | "shorts" | "channel" | undefined;
  duration: "any" | "under_3" | "3_to_20" | "over_20" | undefined;
  uploadDate: "any" | "today" | "this_week" | "this_month" | "this_year" | undefined;
};

export const SearchView = ({
  query,
  categoryId,
  type,
  duration,
  uploadDate,
}: PageProps) => {
  const t = useTranslations("Search");
  const { isSignedIn } = useAuth();
  const createHistory = trpc.search.createHistory.useMutation();

  useEffect(() => {
    if (query && query.trim()) {
      if (isSignedIn) {
        createHistory.mutate({ query: query.trim() });
      } else {
        try {
          const stored = localStorage.getItem("search_history");
          let history: string[] = stored ? JSON.parse(stored) : [];
          history = [query.trim(), ...history.filter(h => h !== query.trim())].slice(0, 10);
          localStorage.setItem("search_history", JSON.stringify(history));
        } catch (e) {
          console.error("Failed to save local history", e);
        }
      }
    }
  }, [query, isSignedIn]);

  return (
    <div className="max-w-[1300px] mx-auto mb-10 flex flex-col gap-y-6 px-4 pt-2.5">
      <CategoriesSection categoryId={categoryId} />
      
      <div className="flex items-center justify-between mt-2 mb-2">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t("searchResults")}</h2>
        <SearchFilters type={type} duration={duration} uploadDate={uploadDate} />
      </div>

      <ResultsSection 
        query={query} 
        categoryId={categoryId} 
        type={type}
        duration={duration}
        uploadDate={uploadDate}
      />
    </div>
  );
};
