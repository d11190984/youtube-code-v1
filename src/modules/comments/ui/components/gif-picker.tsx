"use client";

import { useEffect, useState } from "react";
import { SearchIcon, XIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { useTranslations } from "next-intl";

interface GifPickerProps {
  onSelect: (url: string) => void;
  children: React.ReactNode;
}

interface TenorGif {
  id: string;
  content_description: string;
  media_formats: {
    gif: {
      url: string;
    };
    tinygif: {
      url: string;
    };
  };
}

export const GifPicker = ({
  onSelect,
  children,
}: GifPickerProps) => {
  const t = useTranslations("Common");
  const [search, setSearch] = useState("");
  const [gifs, setGifs] = useState<TenorGif[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const API_KEY = "LIVDSRZULELA";

  const fetchGifs = async (query = "") => {
    setLoading(true);

    try {
      const searchTerm = query.trim();

      const endpoint = searchTerm
        ? `https://api.tenor.com/v1/search?q=${encodeURIComponent(
            searchTerm
          )}&key=${API_KEY}&limit=30&contentfilter=low`
        : `https://api.tenor.com/v1/trending?key=${API_KEY}&limit=30&contentfilter=low`;

      const response = await fetch(endpoint);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Tenor API Error:", response.status, errorData);
        throw new Error(`Failed to fetch GIFs: ${response.status}`);
      }

      const data = await response.json();
      
      // Map V1 response to our V2-like internal state
      const mappedResults = (data.results || []).map((r: any) => ({
        id: r.id,
        content_description: r.content_description,
        media_formats: {
          gif: {
            url: r.media[0].gif.url,
          },
          tinygif: {
            url: r.media[0].tinygif.url,
          },
        },
      }));

      setGifs(mappedResults);
    } catch (error) {
      console.error("Failed to fetch GIFs", error);
      setGifs([]);
    } finally {
      setLoading(false);
    }
  };

  // Load trending gifs when open
  useEffect(() => {
    if (open && gifs.length === 0) {
      fetchGifs();
    }
  }, [open]);

  // Search debounce
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      fetchGifs(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search, open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[320px] p-0 overflow-hidden bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-xl"
      >
        {/* Search */}
        <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />

            <Input
              placeholder={t("searchGifs")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-neutral-100 dark:bg-neutral-800 border-none"
            />
          </div>

          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setSearch("")}
            >
              <XIcon className="size-4" />
            </Button>
          )}
        </div>

        {/* GIF LIST */}
        <div className="h-[320px] overflow-y-auto p-2">
          {loading ? (
            <div className="grid grid-cols-3 gap-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-md bg-neutral-100 dark:bg-neutral-800 animate-pulse"
                />
              ))}
            </div>
          ) : gifs.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-10">
              {t("noGifsFound")}
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => {
                    onSelect(gif.media_formats.gif.url);
                    setOpen(false);
                  }}
                  className="aspect-square overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-800 hover:opacity-80 transition-opacity"
                >
                  <img
                    loading="lazy"
                    src={gif.media_formats.tinygif.url}
                    alt={gif.content_description}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-center">
          <img
            src="https://tenor.com/assets/img/td-logo-footer.svg"
            className="h-4 opacity-50"
            alt="Powered by Tenor"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};
