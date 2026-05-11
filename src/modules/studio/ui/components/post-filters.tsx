"use client";

import { useState } from "react";
import { ListFilterIcon, XIcon, CheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface PostFiltersProps {
  onFilterChange: (filters: {
    types?: string[];
    visibility?: "public" | "private";
  }) => void;
}

const POST_TYPES = [
  { id: "image", label: "Hình ảnh" },
  { id: "playlist", label: "Danh sách phát" },
  { id: "poll", label: "Cuộc thăm dò ý kiến" },
  { id: "quiz", label: "Câu hỏi" },
  { id: "text", label: "Văn bản" },
  { id: "video", label: "Video" },
];

export const PostFilters = ({ onFilterChange }: PostFiltersProps) => {
  const [activeFilters, setActiveFilters] = useState<{
    types?: string[];
    visibility?: "public" | "private";
  }>({});

  const [currentFilterType, setCurrentFilterType] = useState<
    "types" | "visibility" | null
  >(null);
  
  const [tempTypes, setTempTypes] = useState<string[]>([]);

  const handleApplyTypes = () => {
    const newFilters = { ...activeFilters, types: tempTypes };
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
    setCurrentFilterType(null);
  };

  const toggleType = (typeId: string) => {
    setTempTypes((prev) =>
      prev.includes(typeId)
        ? prev.filter((id) => id !== typeId)
        : [...prev, typeId]
    );
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
            <DropdownMenuItem onClick={() => {
              setCurrentFilterType("types");
              setTempTypes(activeFilters.types || []);
            }}>
              Loại
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCurrentFilterType("visibility")}>
              Chế độ hiển thị
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-x-2 flex-wrap">
          {activeFilters.types && activeFilters.types.length > 0 && (
            <Badge variant="secondary" className="gap-x-1 px-2 py-1">
              Loại: {activeFilters.types.map(t => POST_TYPES.find(pt => pt.id === t)?.label).join(", ")}
              <XIcon
                className="size-3 cursor-pointer"
                onClick={() => removeFilter("types")}
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

      {currentFilterType === "types" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg w-[300px] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-neutral-800">
              <span className="font-bold">Loại</span>
              <XIcon 
                className="size-5 cursor-pointer text-neutral-400 hover:text-white" 
                onClick={() => setCurrentFilterType(null)} 
              />
            </div>
            <div className="p-2 flex flex-col">
              {POST_TYPES.map((type) => (
                <div 
                  key={type.id}
                  className="flex items-center gap-x-3 p-3 hover:bg-neutral-800 rounded-md cursor-pointer transition-colors"
                  onClick={() => toggleType(type.id)}
                >
                  <Checkbox 
                    id={type.id} 
                    checked={tempTypes.includes(type.id)}
                    onCheckedChange={() => toggleType(type.id)}
                  />
                  <label 
                    htmlFor={type.id}
                    className="text-sm font-medium leading-none cursor-pointer flex-1"
                  >
                    {type.label}
                  </label>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-neutral-800 flex justify-end">
              <Button 
                onClick={handleApplyTypes}
                className="rounded-full px-6"
                disabled={tempTypes.length === 0}
              >
                Áp dụng
              </Button>
            </div>
          </div>
        </div>
      )}

      {currentFilterType === "visibility" && (
        <div className="flex items-center gap-x-2 bg-neutral-100/50 dark:bg-neutral-800/50 p-2 rounded-lg w-fit">
          <span className="text-sm font-medium">Chế độ hiển thị:</span>
          <Select
            onValueChange={(val: string) => {
              const updatedFilters = {
                ...activeFilters,
                visibility: val as "public" | "private",
              };
              setActiveFilters(updatedFilters);
              onFilterChange(updatedFilters);
              setCurrentFilterType(null);
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
  );
};
