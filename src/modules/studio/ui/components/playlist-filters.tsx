"use client";

import { useState } from "react";
import { FilterIcon, ListFilterIcon, XIcon } from "lucide-react";

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

interface PlaylistFiltersProps {
  onFilterChange: (filters: {
    name?: string;
    visibility?: "public" | "private";
  }) => void;
}

export const PlaylistFilters = ({ onFilterChange }: PlaylistFiltersProps) => {
  const [activeFilters, setActiveFilters] = useState<{
    name?: string;
    visibility?: "public" | "private";
  }>({});

  const [currentFilterType, setCurrentFilterType] = useState<
    "name" | "visibility" | null
  >(null);
  const [inputValue, setInputValue] = useState("");

  const handleApplyFilter = () => {
    if (!currentFilterType) return;

    const newFilters = { ...activeFilters };

    if (currentFilterType === "name") {
      newFilters.name = inputValue;
    } else if (currentFilterType === "visibility") {
      newFilters.visibility = inputValue as "public" | "private";
    }

    setActiveFilters(newFilters);
    onFilterChange(newFilters);
    setCurrentFilterType(null);
    setInputValue("");
  };

  const removeFilter = (key: keyof typeof activeFilters) => {
    const newFilters = { ...activeFilters };
    delete newFilters[key];
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAll = () => {
    setActiveFilters({});
    onFilterChange({});
  };

  return (
    <div className="flex flex-col gap-y-4 p-4 border-b">
      <div className="flex items-center gap-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-x-2">
              <ListFilterIcon className="size-4" />
              Lọc
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={() => setCurrentFilterType("name")}>
              Tiêu đề
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCurrentFilterType("visibility")}>
              Chế độ hiển thị
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-x-2 flex-wrap">
          {activeFilters.name && (
            <Badge variant="secondary" className="gap-x-1 px-2 py-1">
              Tiêu đề: {activeFilters.name}
              <XIcon
                className="size-3 cursor-pointer"
                onClick={() => removeFilter("name")}
              />
            </Badge>
          )}
          {activeFilters.visibility && (
            <Badge variant="secondary" className="gap-x-1 px-2 py-1">
              Chế độ hiển thị:{" "}
              {activeFilters.visibility === "public" ? "Công khai" : "Riêng tư"}
              <XIcon
                className="size-3 cursor-pointer"
                onClick={() => removeFilter("visibility")}
              />
            </Badge>
          )}
          {Object.keys(activeFilters).length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-xs text-muted-foreground"
            >
              Xóa tất cả
            </Button>
          )}
        </div>
      </div>

      {currentFilterType && (
        <div className="flex items-center gap-x-2 bg-neutral-100/50 dark:bg-neutral-800/50 p-2 rounded-lg w-fit">
          <span className="text-sm font-medium">
            {currentFilterType === "name" ? "Tiêu đề" : "Chế độ hiển thị"}:
          </span>
          {currentFilterType === "visibility" ? (
            <Select
              value={inputValue}
              onValueChange={(val: string) => {
                setInputValue(val);
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
                placeholder="Nhập tiêu đề..."
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentFilterType(null)}
              >
                Hủy
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
