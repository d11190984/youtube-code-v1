"use client";

import { SearchIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/trpc/client";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export const StudioSearch = () => {
  const t = useTranslations("Studio");
  const tGen = useTranslations("General");
  const tPlaylists = useTranslations("Playlists");
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";
  
  const [value, setValue] = useState(query);
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: results, isLoading } = trpc.studio.getRecentVideos.useQuery({
    query: value,
  }, {
    enabled: isFocused,
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!value.trim()) return;
    
    setIsFocused(false);
    router.push(`/studio?query=${encodeURIComponent(value)}`);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full max-w-[600px]" ref={dropdownRef}>
      <form
        onSubmit={onSubmit}
        className="flex items-center w-full"
      >
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <SearchIcon className="size-4 text-neutral-400" />
          </div>
          <input
            value={value}
            onFocus={() => setIsFocused(true)}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t("searchChannelPlaceholder")}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>
      </form>

      {isFocused && (
        <div className="absolute top-full mt-2 w-full bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="p-4 border-b border-neutral-800">
            <h3 className="text-sm font-bold text-white">
              {value ? t("searchResults") : t("recentVideos")}
            </h3>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-sm text-neutral-400">{tGen("loading")}</div>
            ) : results?.length === 0 ? (
              <div className="p-4 text-sm text-neutral-400">{tGen("noResults")}</div>
            ) : (
              results?.map((video) => (
                <Link
                  key={video.id}
                  href={`/studio/videos/${video.id}`}
                  onClick={() => setIsFocused(false)}
                  className="flex items-center gap-4 p-3 hover:bg-neutral-800 transition-colors group"
                >
                  <div className="relative aspect-video w-24 rounded-md overflow-hidden bg-neutral-800 shrink-0">
                    <img 
                      src={video.thumbnailUrl || "/placeholder.png"} 
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="text-sm font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                      {video.title}
                    </h4>
                    <p className="text-xs text-neutral-400 line-clamp-1">
                      {video.description || t("noDescription")}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                      <span>{format(new Date(video.createdAt), "d 'thg' M, yyyy", { locale: vi })}</span>
                      <span>•</span>
                      <span>{video.visibility === 'public' ? t("published") : tPlaylists("private")}</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
