"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { SlidersHorizontalIcon, XIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface SearchFiltersProps {
  type?: "all" | "video" | "shorts" | "channel";
  duration?: "any" | "under_3" | "3_to_20" | "over_20";
  uploadDate?: "any" | "today" | "this_week" | "this_month" | "this_year";
}

export const SearchFilters = ({
  type = "all",
  duration = "any",
  uploadDate = "any",
}: SearchFiltersProps) => {
  const t = useTranslations("Search");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentValue = params.get(key) || (key === "type" ? "all" : "any");

    // Nếu click lại vào option đang chọn -> Xóa filter đó (trở về mặc định)
    if (currentValue === value || value === "all" || value === "any") {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    router.push(`/search?${params.toString()}`);
    setOpen(false); // Đóng modal sau khi chọn
  };

  const FilterItem = ({
    label,
    value,
    currentValue,
    filterKey,
  }: {
    label: string;
    value: string;
    currentValue: string;
    filterKey: string;
  }) => {
    const isActive = currentValue === value;

    return (
      <button
        onClick={() => handleFilterChange(filterKey, value)}
        className={cn(
          "flex items-center justify-between py-1.5 text-sm transition-colors w-full text-left",
          isActive
            ? "font-medium text-blue-600 dark:text-blue-400"
            : "text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white"
        )}
      >
        <span>{label}</span>
        {isActive && <XIcon className="size-3.5" />}
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 rounded-full font-medium">
          <SlidersHorizontalIcon className="size-4" />
          <span className="hidden sm:inline">{t("filters")}</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-[700px] w-[95vw] rounded-2xl p-0 gap-0 bg-white dark:bg-zinc-900 border-none shadow-2xl overflow-hidden">
        <DialogHeader className="p-4 px-6 border-b border-neutral-200 dark:border-neutral-800 flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-normal">{t("searchFilters")}</DialogTitle>
        </DialogHeader>

        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {/* Grid layout cho Desktop (3 cột), flex-col cho Mobile (1 cột) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
            
            {/* Column 1: Loại */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-black dark:text-white border-b border-neutral-200 dark:border-neutral-800 pb-2">
                {t("type")}
              </h3>
              <div className="flex flex-col gap-1">
                <FilterItem label="Video" value="video" currentValue={type} filterKey="type" />
                <FilterItem label="Shorts" value="shorts" currentValue={type} filterKey="type" />
                <FilterItem label={t("channel")} value="channel" currentValue={type} filterKey="type" />
              </div>
            </div>

            {/* Column 2: Thời lượng */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-black dark:text-white border-b border-neutral-200 dark:border-neutral-800 pb-2">
                {t("duration")}
              </h3>
              <div className="flex flex-col gap-1">
                <FilterItem label={t("under3Mins")} value="under_3" currentValue={duration} filterKey="duration" />
                <FilterItem label={t("from3to20Mins")} value="3_to_20" currentValue={duration} filterKey="duration" />
                <FilterItem label={t("over20Mins")} value="over_20" currentValue={duration} filterKey="duration" />
              </div>
            </div>

            {/* Column 3: Ngày tải lên */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-black dark:text-white border-b border-neutral-200 dark:border-neutral-800 pb-2">
                {t("uploadDate")}
              </h3>
              <div className="flex flex-col gap-1">
                <FilterItem label={t("today")} value="today" currentValue={uploadDate} filterKey="uploadDate" />
                <FilterItem label={t("thisWeek")} value="this_week" currentValue={uploadDate} filterKey="uploadDate" />
                <FilterItem label={t("thisMonth")} value="this_month" currentValue={uploadDate} filterKey="uploadDate" />
                <FilterItem label={t("thisYear")} value="this_year" currentValue={uploadDate} filterKey="uploadDate" />
              </div>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
