"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { SearchIcon, XIcon, HistoryIcon, KeyboardIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { APP_URL } from "@/constants";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";

import { VirtualKeyboard } from "./virtual-keyboard";
import { useIsMobile } from "@/hooks/use-mobile";

interface SearchInputProps {
  onExpand?: () => void;
  onCollapse?: () => void;
  isExpanded?: boolean;
  disabled?: boolean;
}

export const SearchInput = (props: SearchInputProps) => {
  return (
    <Suspense fallback={<Skeleton className="h-10 w-full max-w-[600px] rounded-full" />}>
      <SearchInputSuspense {...props} />
    </Suspense>
  );
};

const MAX_HISTORY = 10;

const SearchInputSuspense = ({ onExpand, onCollapse, isExpanded, disabled }: SearchInputProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus when expanded on mobile
  useEffect(() => {
    if (isExpanded && isMobile && inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [isExpanded, isMobile, disabled]);
  
  const query = searchParams.get("query") || "";
  const categoryId = searchParams.get("categoryId") || "";

  const [value, setValue] = useState(query);
  const [history, setHistory] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("search_history");
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load search history", e);
    }
  }, []);

  // Sync history to localStorage
  const saveHistory = (newHistory: string[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem("search_history", JSON.stringify(newHistory));
    } catch (e) {
      console.error("Failed to save search history", e);
    }
  };

  const addSearchToHistory = (searchTerm: string) => {
    const term = searchTerm.trim();
    if (!term) return;

    // Bỏ qua search trùng, đẩy lên đầu
    const filtered = history.filter(item => item !== term);
    const newHistory = [term, ...filtered].slice(0, MAX_HISTORY);
    saveHistory(newHistory);
  };

  const removeHistoryItem = (e: React.MouseEvent, termToRemove: string) => {
    e.preventDefault();
    e.stopPropagation();
    const newHistory = history.filter(item => item !== termToRemove);
    saveHistory(newHistory);
  };

  const executeSearch = (searchTerm: string) => {
    if (disabled) return;
    const url = new URL("/search", APP_URL);
    const newQuery = searchTerm.trim();

    if (newQuery) {
      url.searchParams.set("query", encodeURIComponent(newQuery));
      addSearchToHistory(newQuery);
    } else {
      url.searchParams.delete("query");
    }

    if (categoryId) {
      url.searchParams.set("categoryId", categoryId);
    }

    setValue(newQuery);
    setIsFocused(false);
    router.push(url.toString());
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    executeSearch(value);
  }

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const showHistory = isFocused && history.length > 0 && !disabled;

  // On mobile, if not expanded, only show the search trigger icon
  if (isMobile && !isExpanded) {
    return (
      <div className="flex justify-end w-full">
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          className="rounded-full"
          onClick={onExpand}
        >
          <SearchIcon className="size-5" />
        </Button>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative flex w-full max-w-[600px]">
      <form className="flex w-full" onSubmit={handleSearch}>
        <div className="relative w-full">
          {/* Magnifying glass icon inside input (left) */}
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <SearchIcon className="size-4 text-muted-foreground opacity-0 group-focus-within:opacity-100 transition-opacity" />
          </div>
          
          <input
            ref={inputRef}
            value={value}
            disabled={disabled}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            type="text"
            placeholder={disabled ? "Đang ngoại tuyến" : "Tìm kiếm"}
            className="w-full pl-4 focus:pl-10 py-2 pr-16 rounded-l-full border border-neutral-300 dark:border-neutral-700 focus:outline-none focus:border-blue-500 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isMobile ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled}
                onClick={() => inputRef.current?.focus()}
                className="h-8 w-8 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800"
              >
                <KeyboardIcon className="size-5 text-muted-foreground" />
              </Button>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={disabled}
                    className="h-8 w-8 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800"
                  >
                    <KeyboardIcon className="size-5 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="bottom" align="center" className="p-0 border-none bg-transparent shadow-none w-auto sm:align-end">
                  <VirtualKeyboard 
                    onInput={(char) => setValue((prev) => prev + char)}
                    onBackspace={() => setValue((prev) => prev.slice(0, -1))}
                    onClose={() => {}} // Popover handles closing
                  />
                </PopoverContent>
              </Popover>
            )}

            {value && !disabled && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setValue("")}
                className="h-8 w-8 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800"
              >
                <XIcon className="size-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>
        <button
          disabled={disabled || !value.trim()}
          type="submit"
          className="px-5 py-2.5 bg-gray-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 border-l-0 rounded-r-full hover:bg-gray-200 dark:hover:bg-neutral-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <SearchIcon className="size-5" />
        </button>
      </form>

      {/* History Dropdown */}
      {showHistory && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1f1f1f] border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg z-50 overflow-hidden py-2">
          {history.map((term, index) => (
            <div
              key={index}
              onClick={() => executeSearch(term)}
              className="flex items-center justify-between px-4 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 cursor-pointer"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <HistoryIcon className="size-4 text-neutral-500 flex-shrink-0" />
                <span className="text-base font-medium truncate text-neutral-900 dark:text-neutral-100">
                  {term}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => removeHistoryItem(e, term)}
                className="text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 p-1 flex-shrink-0 ml-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700"
              >
                <XIcon className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

