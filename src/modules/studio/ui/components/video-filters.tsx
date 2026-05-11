"use client";

import { useState } from "react";
import { ListFilterIcon, XIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VideoFiltersProps {
  onFilterChange: (filters: {
    title?: string;
    description?: string;
    viewCount?: number;
    visibility?: "public" | "private";
  }) => void;
}

export const VideoFilters = ({ onFilterChange }: VideoFiltersProps) => {
  const [activeFilters, setActiveFilters] = useState<{
    title?: string;
    description?: string;
    viewCount?: number;
    visibility?: "public" | "private";
  }>({});

  const [currentFilterType, setCurrentFilterType] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");

  const handleApplyFilter = () => {
    if (!currentFilterType) return;

    let newValue: any = inputValue;
    if (currentFilterType === "viewCount") {
      newValue = parseInt(inputValue) || 0;
    }

    const updatedFilters = {
      ...activeFilters,
      [currentFilterType]: newValue,
    };

    setActiveFilters(updatedFilters);
    onFilterChange(updatedFilters);
    setCurrentFilterType(null);
    setInputValue("");
  };

  const removeFilter = (key: string) => {
    const updatedFilters = { ...activeFilters };
    delete (updatedFilters as any)[key];
    setActiveFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const getFilterLabel = (key: string, value: any) => {
    switch (key) {
      case "title":
        return `Tiêu đề có chứa "${value}"`;
      case "description":
        return `Mô tả có chứa "${value}"`;
      case "viewCount":
        return `Lượt xem >= ${value}`;
      case "visibility":
        return `Quyền riêng tư: ${value === "public" ? "Công khai" : "Riêng tư"}`;
      default:
        return `${key}: ${value}`;
    }
  };

  return (
    <div className="flex flex-col gap-y-2 p-4 border-b">
      <div className="flex items-center gap-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-x-2 text-sm font-medium">
              <ListFilterIcon className="size-5" />
              Lọc
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={() => setCurrentFilterType("title")}>
              Tiêu đề
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCurrentFilterType("viewCount")}>
              Lượt xem
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCurrentFilterType("description")}>
              Mô tả
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCurrentFilterType("visibility")}>
              Quyền riêng tư
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {currentFilterType && (
          <div className="flex items-center gap-x-2 animate-in fade-in slide-in-from-left-2 duration-200">
            {currentFilterType === "visibility" ? (
              <Select
                value={inputValue}
                onValueChange={(val: string) => {
                  setInputValue(val);
                  // Apply immediately for select
                  const updatedFilters = {
                    ...activeFilters,
                    visibility: val as "public" | "private",
                  };
                  setActiveFilters(updatedFilters);
                  onFilterChange(updatedFilters);
                  setCurrentFilterType(null);
                  setInputValue("");
                }}
              >
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Chọn quyền riêng tư" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Công khai</SelectItem>
                  <SelectItem value="private">Riêng tư</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-x-2">
                <Input
                  placeholder={
                    currentFilterType === "title" 
                      ? "Nhập tiêu đề..." 
                      : currentFilterType === "viewCount" 
                      ? "Nhập số lượt xem tối thiểu..." 
                      : "Nhập mô tả..."
                  }
                  value={inputValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
                  className="h-9 w-[250px]"
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter") handleApplyFilter();
                    if (e.key === "Escape") setCurrentFilterType(null);
                  }}
                  autoFocus
                />
                <Button size="sm" onClick={handleApplyFilter}>
                  Áp dụng
                </Button>
                <Button size="icon" variant="ghost" className="size-8" onClick={() => setCurrentFilterType(null)}>
                  <XIcon className="size-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {Object.keys(activeFilters).length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries(activeFilters).map(([key, value]) => (
            <Badge
              key={key}
              variant="secondary"
              className="px-3 py-1.5 gap-x-2 rounded-full font-normal text-sm bg-muted/50 hover:bg-muted"
            >
              {getFilterLabel(key, value)}
              <XIcon
                className="size-3.5 cursor-pointer hover:text-red-500 transition-colors"
                onClick={() => removeFilter(key)}
              />
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
            onClick={() => {
              setActiveFilters({});
              onFilterChange({});
            }}
          >
            Xóa tất cả
          </Button>
        </div>
      )}
    </div>
  );
};
