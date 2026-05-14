"use client";

import { Suspense, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";
import { formatDistanceToNow } from "date-fns";
import { useTranslations, useLocale } from "next-intl";
import { enUS, vi, ja, ko, zhCN, de, es, fr } from "date-fns/locale";

const dateFnsLocales = {
  en: enUS,
  vi: vi,
  ja: ja,
  ko: ko,
  zh: zhCN,
  de: de,
  es: es,
  fr: fr,
};
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  FilterIcon, 
  ThumbsUpIcon, 
  ThumbsDownIcon, 
  HeartIcon, 
  MoreVerticalIcon, 
  ChevronDownIcon,
  ChevronUpIcon,
  MessageSquareIcon,
  SearchXIcon,
  XIcon,
  InfoIcon,
  ArrowUpRightIcon,
  Trash2Icon,
  FlagIcon,
  BanIcon,
  CheckCheckIcon,
  UserPlusIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  UserMinusIcon,
  ShieldMinusIcon
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuRadioGroup, 
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CommentReplies } from "@/modules/comments/ui/components/comment-replies";
import { InfiniteScroll } from "@/components/infinite-scroll";

interface CommunityViewProps {
  videoId?: string;
}

export const CommunityView = ({ videoId }: CommunityViewProps) => {
  const t = useTranslations("Studio");
  const locale = useLocale();
  const [sortBy, setSortBy] = useState<"newest" | "top">("newest");
  const [statusFilter, setStatusFilter] = useState<"published" | "held">("published");
  const [keyword, setKeyword] = useState<string>("");
  const [tempKeyword, setTempKeyword] = useState<string>("");
  
  // Áp dụng ngay lập tức cho toggle đơn giản
  const [containsQuestions, setContainsQuestions] = useState(false);
  
  // Trạng thái tạm thời cho menu có nhiều lựa chọn
  const [tempContentTypes, setTempContentTypes] = useState<string[]>([]);
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);
  
  const [tempResponseStatuses, setTempResponseStatuses] = useState<string[]>([]);
  const [selectedResponseStatuses, setSelectedResponseStatuses] = useState<string[]>([]);
  
  const [minSubscribers, setMinSubscribers] = useState<number | undefined>();
  const [tempMinSubscribers, setTempMinSubscribers] = useState<number | undefined>();

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleApplyKeyword = () => {
    setKeyword(tempKeyword);
    setIsFilterOpen(false);
  };

  return (
    <div className="flex flex-col gap-y-4 p-4 lg:p-8 bg-neutral-50 dark:bg-[#0f0f0f] min-h-screen text-black dark:text-white">
      <h1 className="text-2xl font-bold mb-4">{videoId ? t("videoComments") : t("community")}</h1>

      <Tabs defaultValue="comments" className="w-full">
        <TabsList className={cn(
          "bg-transparent h-auto p-0 gap-x-6 border-b border-neutral-200 dark:border-white/10 w-full justify-start rounded-none overflow-x-auto scrollbar-hide flex-nowrap",
          videoId && "hidden"
        )}>
          <TabsTrigger 
            value="comments" 
            className="px-0 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-black dark:data-[state=active]:border-white bg-transparent data-[state=active]:bg-transparent font-medium capitalize"
          >
            {t("comments")}
          </TabsTrigger>
          <TabsTrigger 
            value="viewer-posts" 
            className="px-0 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-black dark:data-[state=active]:border-white bg-transparent data-[state=active]:bg-transparent font-medium capitalize text-muted-foreground whitespace-nowrap"
          >
            {t("viewerPosts")}
          </TabsTrigger>
          <TabsTrigger 
            value="mentions" 
            className="px-0 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-black dark:data-[state=active]:border-white bg-transparent data-[state=active]:bg-transparent font-medium capitalize text-muted-foreground whitespace-nowrap"
          >
            {t("mentions")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comments" className="mt-4 outline-none">
          {/* Info bar */}
          {statusFilter === "held" && (
            <div className="flex items-center gap-x-2 bg-neutral-100 dark:bg-white/5 px-4 py-3 rounded-md mb-4 text-sm text-muted-foreground">
               <InfoIcon className="size-4 shrink-0" />
               <span>{t("heldCommentsInfo")}</span>
               <span className="ml-auto hover:text-white cursor-pointer hover:underline text-xs bg-neutral-200 dark:bg-white/10 px-3 py-1.5 rounded-full">{t("learnMore")}</span>
            </div>
          )}

          {/* Lọc & Sắp xếp */}
          <div className="flex items-center gap-x-3 mb-4 text-sm overflow-x-auto pb-2 scrollbar-hide flex-nowrap">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-neutral-200 dark:hover:bg-white/10 rounded-full shrink-0">
               <FilterIcon className="size-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="rounded-full h-8 px-3 text-xs font-medium bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 border-0 shrink-0 whitespace-nowrap">
                  {statusFilter === "published" ? t("published") : t("heldForReview")} <ChevronDownIcon className="size-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-[#282828] border-white/10 text-white rounded-xl shadow-2xl p-2">
                <DropdownMenuRadioGroup value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                  <DropdownMenuRadioItem value="published" className="cursor-pointer focus:bg-white/10 focus:text-white py-2">{t("published")}</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="held" className="cursor-pointer focus:bg-white/10 focus:text-white py-2">{t("heldForReview")}</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="rounded-full h-8 px-3 text-xs font-medium bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 border-0 shrink-0 whitespace-nowrap">
                  {t("sortByLabel")}: {sortBy === "newest" ? t("newest") : t("mostRelevant")} <ChevronDownIcon className="size-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-[#282828] border-white/10 text-white rounded-xl shadow-2xl p-2">
                <DropdownMenuRadioGroup value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                  <DropdownMenuRadioItem value="top" className="cursor-pointer focus:bg-white/10 focus:text-white py-2">{t("mostRelevantDefault")}</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="newest" className="cursor-pointer focus:bg-white/10 focus:text-white py-2">{t("newest")}</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Desktop Filter Button */}
            <div className="hidden lg:block">
              <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" className="rounded-full h-8 px-3 text-xs font-medium bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 border-0 shrink-0 whitespace-nowrap">
                    {t("filterMore")} <ChevronDownIcon className="size-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 bg-[#282828] border-white/10 text-white rounded-xl shadow-2xl py-2 px-0">
                  {/* Từ khoá */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="px-4 py-2 hover:bg-white/10 cursor-pointer">
                      {t("keyword")}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-72 bg-[#282828] border-white/10 text-white rounded-xl p-4 ml-2">
                      <div className="flex flex-col gap-y-3" onClick={(e) => e.stopPropagation()}>
                        <p className="text-sm font-medium">{t("keyword")}</p>
                        <Input 
                          placeholder={t("keywordValue")} 
                          value={tempKeyword}
                          onChange={(e) => setTempKeyword(e.target.value)}
                          className="bg-transparent border-white/20 focus-visible:ring-0 focus-visible:border-blue-500 h-9"
                          onKeyDown={(e) => e.key === "Enter" && handleApplyKeyword()}
                        />
                        <div className="flex justify-end gap-x-4 mt-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              setTempKeyword("");
                              setIsFilterOpen(false);
                            }} 
                            className="hover:bg-white/10 h-8 text-white font-bold"
                          >
                            {t("cancel")}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleApplyKeyword} 
                            className="text-[#3ea6ff] hover:bg-[#3ea6ff]/10 h-8 font-bold"
                          >
                            {t("apply")}
                          </Button>
                        </div>
                      </div>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuItem 
                    className="px-4 py-2 hover:bg-white/10 cursor-pointer flex justify-between items-center"
                    onClick={(e) => {
                      e.preventDefault();
                      setContainsQuestions(!containsQuestions);
                      setIsFilterOpen(false);
                    }}
                  >
                    {t("containsQuestions")}
                    {containsQuestions && <div className="size-2 bg-blue-500 rounded-full" />}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-white/10 my-1" />

                  {/* Loại nội dung */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="px-4 py-2 hover:bg-white/10 cursor-pointer">
                      {t("contentType")}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-64 bg-[#282828] border-white/10 text-white rounded-xl p-0 overflow-hidden ml-2">
                      <div className="p-4 border-b border-white/10 flex justify-between items-center">
                        <span className="text-sm font-medium">{t("contentType")}</span>
                      </div>
                      <div className="p-2 flex flex-col gap-y-1">
                        {[
                          { id: "video", label: t("video") },
                          { id: "shorts", label: t("shorts") },
                          { id: "my-posts", label: t("myPosts") },
                          { id: "viewer-posts", label: t("viewerPosts") },
                        ].map((item) => (
                          <div 
                            key={item.id} 
                            className="flex items-center gap-x-3 px-2 py-2 hover:bg-white/5 rounded-md cursor-pointer group"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTempContentTypes(prev => 
                                prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                              );
                            }}
                          >
                            <Checkbox 
                              checked={tempContentTypes.includes(item.id)}
                              onCheckedChange={() => {
                                setTempContentTypes(prev => 
                                  prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                                );
                              }}
                              className="border-white/30 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                            />
                            <span className="text-sm">{item.label}</span>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 bg-[#1f1f1f] flex justify-end gap-x-2">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="rounded-full hover:bg-white/10 text-white font-bold px-4"
                            onClick={() => {
                              setTempContentTypes(selectedContentTypes);
                              setIsFilterOpen(false);
                            }}
                        >
                          {t("cancel")}
                        </Button>
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 font-bold px-4"
                            disabled={tempContentTypes.length === 0 && selectedContentTypes.length === 0}
                            onClick={() => {
                              setSelectedContentTypes(tempContentTypes);
                              setIsFilterOpen(false);
                            }}
                        >
                          {t("apply")}
                        </Button>
                      </div>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  {/* Số người đăng ký */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="px-4 py-2 hover:bg-white/10 cursor-pointer">
                      {t("minSubscribers")}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-64 bg-[#282828] border-white/10 text-white rounded-xl p-0 overflow-hidden ml-2">
                      <div className="p-4 border-b border-white/10">
                        <span className="text-sm font-medium">{t("minSubscribersLabel")}</span>
                      </div>
                      <DropdownMenuRadioGroup 
                        value={tempMinSubscribers?.toString()} 
                        onValueChange={(v) => setTempMinSubscribers(v ? parseInt(v) : undefined)}
                        className="p-2"
                      >
                        {[
                          { id: "100", label: "100" },
                          { id: "1000", label: "1,000" },
                          { id: "10000", label: "10,000" },
                          { id: "100000", label: "100,000" },
                          { id: "1000000", label: "1,000,000" },
                          { id: "10000000", label: "10,000,000" },
                        ].map((item) => (
                          <DropdownMenuRadioItem 
                            key={item.id} 
                            value={item.id}
                            className="cursor-pointer focus:bg-white/10 focus:text-white py-2"
                            onSelect={(e) => e.preventDefault()}
                          >
                            {item.label}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                      <div className="p-4 bg-[#1f1f1f] flex justify-end gap-x-2">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="rounded-full hover:bg-white/10 text-white font-bold px-4"
                            onClick={() => {
                              setTempMinSubscribers(minSubscribers);
                              setIsFilterOpen(false);
                            }}
                        >
                          {t("cancel")}
                        </Button>
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 font-bold px-4"
                            onClick={() => {
                              setMinSubscribers(tempMinSubscribers);
                              setIsFilterOpen(false);
                            }}
                        >
                          {t("apply")}
                        </Button>
                      </div>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator className="bg-white/10 my-1" />

                  {/* Trạng thái phản hồi */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="px-4 py-2 hover:bg-white/10 cursor-pointer">
                      {t("responseStatus")}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-72 bg-[#282828] border-white/10 text-white rounded-xl p-0 overflow-hidden ml-2">
                      <div className="p-4 border-b border-white/10 flex justify-between items-center">
                        <span className="text-sm font-medium">{t("responseStatus")}</span>
                      </div>
                      <div className="p-2 flex flex-col gap-y-1">
                        {[
                          { id: "not-responded", label: t("notResponded") },
                          { id: "responded", label: t("responded") },
                          { id: "new-reply", label: t("newReplyToYourResponse") },
                        ].map((item) => (
                          <div 
                            key={item.id} 
                            className="flex items-center gap-x-3 px-2 py-2 hover:bg-white/5 rounded-md cursor-pointer group"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTempResponseStatuses(prev => 
                                prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                              );
                            }}
                          >
                            <Checkbox 
                              checked={tempResponseStatuses.includes(item.id)}
                              onCheckedChange={() => {
                                setTempResponseStatuses(prev => 
                                  prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                                );
                              }}
                              className="border-white/30 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                            />
                            <span className="text-sm">{item.label}</span>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 bg-[#1f1f1f] flex justify-end gap-x-2">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="rounded-full hover:bg-white/10 text-white font-bold px-4"
                            onClick={() => {
                              setTempResponseStatuses(selectedResponseStatuses);
                              setIsFilterOpen(false);
                            }}
                        >
                          {t("cancel")}
                        </Button>
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 font-bold px-4"
                            disabled={tempResponseStatuses.length === 0 && selectedResponseStatuses.length === 0}
                            onClick={() => {
                              setSelectedResponseStatuses(tempResponseStatuses);
                              setIsFilterOpen(false);
                            }}
                        >
                          {t("apply")}
                        </Button>
                      </div>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Filter Button */}
            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="secondary" className="rounded-full h-8 px-3 text-xs font-medium bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 border-0 shrink-0 whitespace-nowrap">
                    {t("filterMore")} <ChevronDownIcon className="size-3 ml-1" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[85vh] bg-[#282828] border-white/10 text-white rounded-t-2xl p-0 overflow-hidden flex flex-col">
                  <SheetHeader className="p-4 border-b border-white/10">
                    <SheetTitle className="text-white">{t("filters")}</SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto">
                    <Accordion type="single" collapsible className="w-full">
                      {/* Từ khoá */}
                      <AccordionItem value="keyword" className="border-white/10">
                        <AccordionTrigger className="px-4 hover:no-underline">{t("keyword")}</AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="flex flex-col gap-y-3">
                            <Input 
                              placeholder={t("keywordValue")} 
                              value={tempKeyword}
                              onChange={(e) => setTempKeyword(e.target.value)}
                              className="bg-transparent border-white/20 focus-visible:ring-0 focus-visible:border-blue-500 h-10"
                            />
                            <Button 
                              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full"
                              onClick={() => {
                                handleApplyKeyword();
                              }}
                            >
                              {t("apply")}
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Chứa câu hỏi */}
                      <div 
                        className="flex items-center justify-between px-4 py-4 border-b border-white/10 cursor-pointer"
                        onClick={() => setContainsQuestions(!containsQuestions)}
                      >
                        <span className="text-sm font-medium">{t("containsQuestions")}</span>
                        <Checkbox 
                          checked={containsQuestions}
                          onCheckedChange={(v) => setContainsQuestions(!!v)}
                          className="border-white/30 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                        />
                      </div>

                      {/* Loại nội dung */}
                      <AccordionItem value="content-types" className="border-white/10">
                        <AccordionTrigger className="px-4 hover:no-underline">{t("contentType")}</AccordionTrigger>
                        <AccordionContent className="px-0 pb-0">
                          <div className="flex flex-col">
                            {[
                              { id: "video", label: t("video") },
                              { id: "shorts", label: t("shorts") },
                              { id: "my-posts", label: t("myPosts") },
                              { id: "viewer-posts", label: t("viewerPosts") },
                            ].map((item) => (
                              <div 
                                key={item.id} 
                                className="flex items-center gap-x-3 px-4 py-3 hover:bg-white/5 cursor-pointer"
                                onClick={() => {
                                  setTempContentTypes(prev => 
                                    prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                                  );
                                }}
                              >
                                <Checkbox 
                                  checked={tempContentTypes.includes(item.id)}
                                  className="border-white/30 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                />
                                <span className="text-sm">{item.label}</span>
                              </div>
                            ))}
                            <div className="p-4 bg-[#1f1f1f] flex justify-end">
                              <Button 
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full"
                                onClick={() => setSelectedContentTypes(tempContentTypes)}
                              >
                                {t("apply")}
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Số người đăng ký */}
                      <AccordionItem value="min-subscribers" className="border-white/10">
                        <AccordionTrigger className="px-4 hover:no-underline">{t("minSubscribers")}</AccordionTrigger>
                        <AccordionContent className="px-0 pb-0">
                          <div className="flex flex-col">
                            <DropdownMenuRadioGroup 
                              value={tempMinSubscribers?.toString()} 
                              onValueChange={(v) => setTempMinSubscribers(v ? parseInt(v) : undefined)}
                              className="p-0"
                            >
                              {[
                                { id: "100", label: "100" },
                                { id: "1000", label: "1,000" },
                                { id: "10000", label: "10,000" },
                                { id: "100000", label: "100,000" },
                                { id: "1000000", label: "1,000,000" },
                                { id: "10000000", label: "10,000,000" },
                              ].map((item) => (
                                <DropdownMenuRadioItem 
                                  key={item.id} 
                                  value={item.id}
                                  className="px-4 py-3 cursor-pointer focus:bg-white/10 focus:text-white"
                                >
                                  {item.label}
                                </DropdownMenuRadioItem>
                              ))}
                            </DropdownMenuRadioGroup>
                            <div className="p-4 bg-[#1f1f1f] flex justify-end">
                              <Button 
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full"
                                onClick={() => setMinSubscribers(tempMinSubscribers)}
                              >
                                {t("apply")}
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Trạng thái phản hồi */}
                      <AccordionItem value="response-status" className="border-white/10 border-b-0">
                        <AccordionTrigger className="px-4 hover:no-underline">{t("responseStatus")}</AccordionTrigger>
                        <AccordionContent className="px-0 pb-0">
                          <div className="flex flex-col">
                            {[
                              { id: "not-responded", label: t("notResponded") },
                              { id: "responded", label: t("responded") },
                              { id: "new-reply", label: t("newReplyToYourResponse") },
                            ].map((item) => (
                              <div 
                                key={item.id} 
                                className="flex items-center gap-x-3 px-4 py-3 hover:bg-white/5 cursor-pointer"
                                onClick={() => {
                                  setTempResponseStatuses(prev => 
                                    prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                                  );
                                }}
                              >
                                <Checkbox 
                                  checked={tempResponseStatuses.includes(item.id)}
                                  className="border-white/30 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                />
                                <span className="text-sm">{item.label}</span>
                              </div>
                            ))}
                            <div className="p-4 bg-[#1f1f1f] flex justify-end">
                              <Button 
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full"
                                onClick={() => setSelectedResponseStatuses(tempResponseStatuses)}
                              >
                                {t("apply")}
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Keyword tag */}
            {keyword && (
              <div className="flex items-center gap-x-1 bg-neutral-200 dark:bg-white/10 rounded-full h-8 px-3 text-xs font-medium shrink-0 whitespace-nowrap">
                 {t("keyword")}: {keyword}
                 <button onClick={() => { setKeyword(""); setTempKeyword(""); }} className="ml-1 hover:bg-white/20 rounded-full p-0.5">
                    <XIcon className="size-3" />
                 </button>
              </div>
            )}
            
            {containsQuestions && (
              <div className="flex items-center gap-x-1 bg-neutral-200 dark:bg-white/10 rounded-full h-8 px-3 text-xs font-medium shrink-0 whitespace-nowrap">
                 {t("containsQuestions")}
                 <button onClick={() => setContainsQuestions(false)} className="ml-1 hover:bg-white/20 rounded-full p-0.5">
                    <XIcon className="size-3" />
                 </button>
              </div>
            )}

            {selectedContentTypes.length > 0 && (
              <div className="flex items-center gap-x-1 bg-neutral-200 dark:bg-white/10 rounded-full h-8 px-3 text-xs font-medium shrink-0 whitespace-nowrap">
                 {t("contentType")}: {selectedContentTypes.length}
                 <button 
                  onClick={() => {
                    setSelectedContentTypes([]);
                    setTempContentTypes([]);
                  }} 
                  className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                 >
                    <XIcon className="size-3" />
                 </button>
              </div>
            )}

            {selectedResponseStatuses.length > 0 && (
              <div className="flex items-center gap-x-1 bg-neutral-200 dark:bg-white/10 rounded-full h-8 px-3 text-xs font-medium shrink-0 whitespace-nowrap">
                 {t("responseStatus")}: {selectedResponseStatuses.length}
                 <button 
                  onClick={() => {
                    setSelectedResponseStatuses([]);
                    setTempResponseStatuses([]);
                  }} 
                  className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                 >
                    <XIcon className="size-3" />
                 </button>
              </div>
            )}

            {minSubscribers !== undefined && (
              <div className="flex items-center gap-x-1 bg-neutral-200 dark:bg-white/10 rounded-full h-8 px-3 text-xs font-medium shrink-0 whitespace-nowrap">
                 {t("minSubscribers")}: {minSubscribers.toLocaleString(locale)}
                 <button 
                  onClick={() => {
                    setMinSubscribers(undefined);
                    setTempMinSubscribers(undefined);
                  }} 
                  className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                 >
                    <XIcon className="size-3" />
                 </button>
              </div>
            )}
          </div>

          <div className="border-t border-neutral-200 dark:border-white/10 w-full pt-2 min-h-[400px]">
             <Suspense fallback={
               <div className="flex flex-col items-center justify-center py-24 gap-y-4">
                  <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground animate-pulse">{t("updatingComments")}</p>
               </div>
             }>
                <CommunityCommentsList 
                   sortBy={sortBy}
                   statusFilter={statusFilter}
                   keyword={keyword}
                   containsQuestions={containsQuestions}
                   selectedContentTypes={selectedContentTypes}
                   selectedResponseStatuses={selectedResponseStatuses}
                   setKeyword={setKeyword}
                   setTempKeyword={setTempKeyword}
                   setStatusFilter={setStatusFilter}
                   setContainsQuestions={setContainsQuestions}
                   setSelectedContentTypes={setSelectedContentTypes}
                   setTempContentTypes={setTempContentTypes}
                   setSelectedResponseStatuses={setSelectedResponseStatuses}
                   setTempResponseStatuses={setTempResponseStatuses}
                   minSubscribers={minSubscribers}
                   setMinSubscribers={setMinSubscribers}
                   setTempMinSubscribers={setTempMinSubscribers}
                   videoId={videoId}
                />
             </Suspense>
          </div>
        </TabsContent>

        <TabsContent value="viewer-posts">
           <div className="p-8 text-center text-muted-foreground">
              {t("featureUnderDevelopment")}
           </div>
        </TabsContent>

        <TabsContent value="mentions">
           <div className="p-8 text-center text-muted-foreground">
              {t("featureUnderDevelopment")}
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface CommunityCommentsListProps {
  sortBy: "newest" | "top";
  statusFilter: "published" | "held";
  keyword: string;
  containsQuestions: boolean;
  selectedContentTypes: string[];
  selectedResponseStatuses: string[];
  setKeyword: (v: string) => void;
  setTempKeyword: (v: string) => void;
  setStatusFilter: (v: "published" | "held") => void;
  setContainsQuestions: (v: boolean) => void;
  setSelectedContentTypes: (v: string[]) => void;
  setTempContentTypes: (v: string[]) => void;
  setSelectedResponseStatuses: (v: string[]) => void;
  setTempResponseStatuses: (v: string[]) => void;
  minSubscribers: number | undefined;
  setMinSubscribers: (v: number | undefined) => void;
  setTempMinSubscribers: (v: number | undefined) => void;
  videoId?: string;
}

const CommunityCommentsList = ({
  sortBy,
  statusFilter,
  keyword,
  containsQuestions,
  selectedContentTypes,
  selectedResponseStatuses,
  minSubscribers,
  setKeyword,
  setTempKeyword,
  setStatusFilter,
  setContainsQuestions,
  setSelectedContentTypes,
  setTempContentTypes,
  setSelectedResponseStatuses,
  setTempResponseStatuses,
  setMinSubscribers,
  setTempMinSubscribers,
  videoId,
}: CommunityCommentsListProps) => {
  const t = useTranslations("Studio");
  const locale = useLocale();
  const dateLocale = dateFnsLocales[locale as keyof typeof dateFnsLocales] || vi;
  const { user } = useUser();
  const utils = trpc.useUtils();
  
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [openReplies, setOpenReplies] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const removeManyMutation = trpc.comments.removeMany.useMutation({
    onSuccess: (data) => {
      toast.success(t("deleteCommentsSuccess", { count: data.count }));
      setSelectedIds([]);
      utils.studio.getCommunityComments.invalidate();
    },
    onError: () => toast.error(t("deleteCommentsError")),
  });

  const toggleReplies = (commentId: string) => {
    setOpenReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const replyMutation = trpc.comments.create.useMutation({
    onSuccess: () => {
      toast.success(t("replySent"));
      setReplyingTo(null);
      setReplyText("");
      utils.studio.getCommunityComments.invalidate();
    },
    onError: () => toast.error(t("replyError")),
  });

  const likeMutation = trpc.commentReactions.like.useMutation({
    onSuccess: () => utils.studio.getCommunityComments.invalidate(),
  });

  const dislikeMutation = trpc.commentReactions.dislike.useMutation({
    onSuccess: () => utils.studio.getCommunityComments.invalidate(),
  });

  const heartMutation = trpc.comments.heart.useMutation({
    onSuccess: () => utils.studio.getCommunityComments.invalidate(),
  });

  const removeMutation = trpc.comments.remove.useMutation({
    onSuccess: () => {
      toast.success(t("dismissCommentSuccess"));
      utils.studio.getCommunityComments.invalidate();
    },
    onError: () => toast.error(t("dismissCommentError")),
  });

  const moderateMutation = trpc.studio.setModerationStatus.useMutation({
    onSuccess: () => {
      toast.success(t("updateUserStatusSuccess"));
      utils.studio.getCommunityComments.invalidate();
    },
    onError: () => toast.error(t("updateUserStatusError")),
  });

  const [data, query] = trpc.studio.getCommunityComments.useSuspenseInfiniteQuery({
    limit: 20,
    sortBy,
    status: statusFilter,
    keyword: keyword || undefined,
    containsQuestions: containsQuestions || undefined,
    contentTypes: selectedContentTypes.length > 0 ? selectedContentTypes : undefined,
    responseStatuses: selectedResponseStatuses.length > 0 ? selectedResponseStatuses : undefined,
    minSubscribers,
    videoId,
  }, {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

   const comments = data.pages.flatMap((page) => page.items);

   const toggleSelectAll = () => {
     if (selectedIds.length === comments.length) {
       setSelectedIds([]);
     } else {
       setSelectedIds(comments.map((c) => c.id));
     }
   };

   const toggleSelect = (id: string) => {
     setSelectedIds((prev) =>
       prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
     );
   };

   return (
     <div className="flex flex-col">
       {comments.length > 0 && (
         <div className={cn(
           "flex items-center gap-x-4 px-4 py-2 border-b border-neutral-200 dark:border-white/10 transition-colors sticky top-0 z-20 bg-neutral-50 dark:bg-[#0f0f0f]",
           selectedIds.length > 0 && "bg-white dark:bg-neutral-800"
         )}>
           <Checkbox 
             checked={selectedIds.length > 0 && selectedIds.length === comments.length}
             onCheckedChange={toggleSelectAll}
             className="border-muted-foreground data-[state=checked]:bg-[#3ea6ff] data-[state=checked]:border-[#3ea6ff]" 
           />
           
           {selectedIds.length > 0 ? (
             <div className="flex items-center justify-between flex-1">
                <div className="flex items-center gap-x-6">
                   <div className="flex items-center gap-x-2 text-sm font-medium text-black dark:text-white">
                      <span>{t("selectedCount", { count: selectedIds.length })}</span>
                      <button 
                        onClick={toggleSelectAll}
                        className="text-[#3ea6ff] hover:underline"
                      >
                        ({selectedIds.length === comments.length ? t("deselectAll") : t("selectAll")})
                      </button>
                   </div>
                   <div className="flex items-center gap-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 text-black dark:text-white"
                        onClick={() => setIsDeleteOpen(true)}
                      >
                        <Trash2Icon className="size-5" />
                      </Button>

                      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                        <AlertDialogContent className="bg-[#282828] border-white/10 text-white rounded-2xl max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-bold">{t("deleteCommentsTitle")}</AlertDialogTitle>
                            <AlertDialogDescription className="text-neutral-400">
                              {t("deleteCommentsDescription", { count: selectedIds.length })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-x-2">
                            <AlertDialogCancel className="rounded-full bg-transparent border-none hover:bg-white/10 text-white font-bold px-6">
                              {t("cancel")}
                            </AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => removeManyMutation.mutate({ ids: selectedIds })}
                              className="rounded-full bg-white text-black hover:bg-neutral-200 font-bold px-6"
                            >
                              {t("delete")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 text-black dark:text-white">
                        <FlagIcon className="size-5" />
                      </Button>
                   </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 text-black dark:text-white"
                  onClick={() => setSelectedIds([])}
                >
                   <XIcon className="size-5" />
                </Button>
             </div>
           ) : (
             <span className="text-sm font-medium text-muted-foreground">{t("selectAll")}</span>
           )}
         </div>
       )}

      {comments.length === 0 ? (
         <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="relative mb-8">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500/20 rounded-full blur-[80px]" />
               <div className="relative flex items-center justify-center">
                  <div className="w-28 h-28 bg-neutral-100 dark:bg-white/5 rounded-[2rem] border border-neutral-200 dark:border-white/10 shadow-xl flex items-center justify-center overflow-hidden">
                     <div className="relative">
                        <MessageSquareIcon className="size-14 text-neutral-300 dark:text-neutral-700" />
                        <XIcon className="size-8 text-rose-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]" />
                     </div>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg border-2 border-white dark:border-[#0f0f0f] rotate-12">
                     <SearchXIcon className="size-5 text-white" />
                  </div>
               </div>
            </div>
            
            <div className="space-y-2">
               <h3 className="text-xl font-bold text-black dark:text-white">{t("noCommentsFound")}</h3>
               <p className="text-sm text-muted-foreground max-w-[320px] mx-auto">
                  {t("noCommentsFoundDescription")}
               </p>
            </div>

            <Button 
              variant="outline" 
              className="mt-8 rounded-full px-6 border-neutral-300 dark:border-white/20 hover:bg-neutral-100 dark:hover:bg-white/5 font-bold"
              onClick={() => {
                setKeyword("");
                setTempKeyword("");
                setStatusFilter("published");
                setContainsQuestions(false);
                setSelectedContentTypes([]);
                setTempContentTypes([]);
                setSelectedResponseStatuses([]);
                setTempResponseStatuses([]);
                setMinSubscribers(undefined);
                setTempMinSubscribers(undefined);
              }}
            >
              {t("clearAllFilters")}
            </Button>
         </div>
      ) : (
        comments.map((comment) => (
          <div key={comment.id} className={cn(
            "flex flex-col border-t border-neutral-200 dark:border-white/10",
            selectedIds.includes(comment.id) && "bg-neutral-100 dark:bg-white/10"
          )}>
            <div className="flex gap-x-4 p-4 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors group">
              <div className="pt-2">
                <Checkbox 
                 checked={selectedIds.includes(comment.id)}
                 onCheckedChange={() => toggleSelect(comment.id)}
                 className="border-muted-foreground data-[state=checked]:bg-[#3ea6ff] data-[state=checked]:border-[#3ea6ff]" 
                />
              </div>
              
              <Avatar className="size-10 mt-1">
                <AvatarImage src={comment.user.imageUrl} />
                <AvatarFallback>{comment.user.name[0]}</AvatarFallback>
              </Avatar>

              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex items-center gap-x-2 text-xs text-muted-foreground mb-1">
                    <span className="font-bold text-black dark:text-white bg-neutral-200 dark:bg-white/10 px-2 py-0.5 rounded-full flex items-center gap-x-1">
                      @{comment.user.handle || comment.user.name}
                      {comment.moderationType === "manager_mod" && (
                        <ShieldAlertIcon className="size-4 text-purple-600 fill-purple-600/20" />
                      )}
                      {comment.moderationType === "standard_mod" && (
                        <ShieldCheckIcon className="size-4 text-blue-500 fill-blue-500/20" />
                      )}
                    </span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(comment.createdAt), { locale: dateLocale, addSuffix: true })}</span>
                </div>
                
                <p className="text-sm whitespace-pre-wrap break-words mb-2">
                  {comment.value}
                </p>

                {comment.imageUrl && (
                  <div className="relative mb-3 max-w-sm rounded-lg overflow-hidden border border-neutral-200 dark:border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={comment.imageUrl} 
                        alt="Comment attachment" 
                        className="w-full h-auto object-contain"
                      />
                  </div>
                )}

                <div className="flex items-center gap-x-4 text-xs font-medium text-black dark:text-white mb-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-full h-8 px-4 bg-transparent border-neutral-300 dark:border-white/20 hover:bg-neutral-200 dark:hover:bg-white/10"
                      onClick={() => {
                        setReplyingTo(comment.id);
                        setReplyText("");
                      }}
                    >
                      {t("reply")}
                    </Button>
                    {comment.replyCount > 0 ? (
                      <button 
                        onClick={() => toggleReplies(comment.id)}
                        className="flex items-center gap-x-1 cursor-pointer text-[#3ea6ff] hover:underline transition-colors font-bold"
                      >
                        {t("replyCount", { count: comment.replyCount })} {openReplies.has(comment.id) ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />}
                      </button>
                    ) : (
                      <div className="flex items-center gap-x-1 cursor-pointer hover:text-[#3ea6ff] transition-colors">
                        {t("noReplies")} <ChevronDownIcon className="size-4" />
                      </div>
                    )}
                    
                    <div className="flex items-center gap-x-2 text-muted-foreground ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn("h-8 w-8 hover:bg-neutral-200 dark:hover:bg-white/10 rounded-full", comment.viewerReaction === "like" && "text-black dark:text-white")}
                        onClick={() => likeMutation.mutate({ commentId: comment.id })}
                      >
                        <ThumbsUpIcon className={cn("size-4", comment.viewerReaction === "like" && "fill-current")} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn("h-8 w-8 hover:bg-neutral-200 dark:hover:bg-white/10 rounded-full", comment.viewerReaction === "dislike" && "text-black dark:text-white")}
                        onClick={() => dislikeMutation.mutate({ commentId: comment.id })}
                      >
                        <ThumbsDownIcon className={cn("size-4", comment.viewerReaction === "dislike" && "fill-current")} />
                      </Button>
                      <button 
                        onClick={() => heartMutation.mutate({ id: comment.id })}
                        className="h-8 w-8 hover:bg-neutral-200 dark:hover:bg-white/10 rounded-full flex items-center justify-center relative transition-colors"
                      >
                        {comment.creatorHearted ? (
                          <div className="relative flex items-center justify-center">
                            <Avatar className="size-[20px]">
                              <AvatarImage src={user?.imageUrl} />
                              <AvatarFallback>{user?.firstName?.[0] || user?.username?.[0] || "U"}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-[#0f0f0f] rounded-full p-[1px]">
                                <HeartIcon className="size-2.5 fill-red-500 text-red-500" />
                            </div>
                          </div>
                        ) : (
                          <HeartIcon className="size-4" />
                        )}
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-neutral-200 dark:hover:bg-white/10 rounded-full">
                            <MoreVerticalIcon className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-80 bg-[#282828] border-white/10 text-white rounded-xl shadow-2xl p-2">
                          <DropdownMenuItem 
                            className="cursor-pointer focus:bg-white/10 focus:text-white py-3 text-sm flex items-center" 
                            onClick={() => removeMutation.mutate({ id: comment.id })}
                            disabled={removeMutation.isPending}
                          >
                            <Trash2Icon className="size-5 mr-4 opacity-70" />
                            {t("remove")}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer focus:bg-white/10 focus:text-white py-3 text-sm flex items-center">
                            <FlagIcon className="size-5 mr-4 opacity-70" />
                            {t("report")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/10 my-1" />
                          {comment.moderationType === "hidden" ? (
                            <DropdownMenuItem 
                              className="cursor-pointer focus:bg-white/10 focus:text-white py-3 text-sm flex items-center" 
                              onClick={() => moderateMutation.mutate({ viewerId: comment.userId, type: null })}
                            >
                              <BanIcon className="size-5 mr-4 opacity-70" />
                              {t("unhideUser")}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              className="cursor-pointer focus:bg-white/10 focus:text-white py-3 text-sm flex items-center" 
                              onClick={() => moderateMutation.mutate({ viewerId: comment.userId, type: "hidden" })}
                            >
                              <BanIcon className="size-5 mr-4 opacity-70" />
                              {t("hideUser")}
                            </DropdownMenuItem>
                          )}

                          {comment.moderationType === "approved" ? (
                            <DropdownMenuItem 
                              className="cursor-pointer focus:bg-white/10 focus:text-white py-3 text-sm flex items-center" 
                              onClick={() => moderateMutation.mutate({ viewerId: comment.userId, type: null })}
                            >
                              <UserMinusIcon className="size-5 mr-4 opacity-70" />
                              {t("removeApprovedUser")}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              className="cursor-pointer focus:bg-white/10 focus:text-white py-3 text-sm flex items-center" 
                              onClick={() => moderateMutation.mutate({ viewerId: comment.userId, type: "approved" })}
                            >
                              <CheckCheckIcon className="size-5 mr-4 opacity-70" />
                              {t("approveUser")}
                            </DropdownMenuItem>
                          )}

                          {comment.moderationType === "manager_mod" ? (
                            <DropdownMenuItem 
                              className="cursor-pointer focus:bg-white/10 focus:text-white py-3 text-sm flex items-center" 
                              onClick={() => moderateMutation.mutate({ viewerId: comment.userId, type: null })}
                            >
                              <ShieldMinusIcon className="size-5 mr-4 opacity-70" />
                              {t("removeManagerMod")}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              className="cursor-pointer focus:bg-white/10 focus:text-white py-3 text-sm flex items-center" 
                              onClick={() => moderateMutation.mutate({ viewerId: comment.userId, type: "manager_mod" })}
                            >
                              <ShieldAlertIcon className="size-5 mr-4 opacity-70" />
                              {t("addManagerMod")}
                            </DropdownMenuItem>
                          )}

                          {comment.moderationType === "standard_mod" ? (
                            <DropdownMenuItem 
                              className="cursor-pointer focus:bg-white/10 focus:text-white py-3 text-sm flex items-center" 
                              onClick={() => moderateMutation.mutate({ viewerId: comment.userId, type: null })}
                            >
                              <ShieldMinusIcon className="size-5 mr-4 opacity-70" />
                              {t("removeStandardMod")}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              className="cursor-pointer focus:bg-white/10 focus:text-white py-3 text-sm flex items-center" 
                              onClick={() => moderateMutation.mutate({ viewerId: comment.userId, type: "standard_mod" })}
                            >
                              <ShieldCheckIcon className="size-5 mr-4 opacity-70" />
                              {t("addStandardMod")}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                </div>
                
                {replyingTo === comment.id && (
                  <div className="mt-2 flex gap-x-4">
                    <Avatar className="size-8 mt-1">
                        <AvatarImage src={user?.imageUrl} />
                        <AvatarFallback>{user?.firstName?.[0] || user?.username?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex flex-col">
                        <div className="border-b border-neutral-300 dark:border-white/20 pb-1 focus-within:border-black dark:focus-within:border-white transition-colors relative group">
                          <p className="text-[10px] text-muted-foreground font-medium mb-1 group-focus-within:text-black dark:group-focus-within:text-white">{t("reply")}</p>
                          <textarea 
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder={t("replyPlaceholder")}
                              className="w-full bg-transparent outline-none resize-none text-sm placeholder:text-muted-foreground min-h-[24px]"
                              rows={1}
                              autoFocus
                          />
                        </div>
                        <div className="flex justify-end gap-x-2 mt-3">
                          <Button 
                              variant="ghost" 
                              size="sm" 
                              className="rounded-full px-4 hover:bg-neutral-200 dark:hover:bg-white/10 font-bold" 
                              onClick={() => setReplyingTo(null)}
                          >
                              {t("cancel")}
                          </Button>
                          <Button 
                              variant="secondary" 
                              size="sm" 
                              className="rounded-full px-4 bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-black dark:text-white disabled:opacity-50 font-bold"
                              disabled={!replyText.trim() || replyMutation.isPending}
                              onClick={() => replyMutation.mutate({ 
                                parentId: comment.id, 
                                videoId: comment.videoId || undefined, 
                                postId: comment.postId || undefined, 
                                value: replyText 
                              })}
                          >
                              {t("replyAction")}
                          </Button>
                        </div>
                    </div>
                  </div>
                )}
                
                {openReplies.has(comment.id) && (
                  <div className="mt-4 border-l-2 border-neutral-200 dark:border-white/10 pl-4">
                    <CommentReplies 
                      parentId={comment.id} 
                      videoId={comment.videoId || undefined} 
                      postId={comment.postId || undefined} 
                    />
                  </div>
                )}
              </div>

               {!videoId && (
                 <div className="hidden md:flex w-48 shrink-0 flex-col gap-y-1 ml-4">
                   {comment.videoId ? (
                     <Link href={`/videos/${comment.videoId}`} className="flex items-start gap-x-2 group/video cursor-pointer">
                       <div className="relative w-24 aspect-video rounded-sm overflow-hidden bg-neutral-800 shrink-0">
                         <Image 
                           src={comment.videoThumbnail || "/placeholder.svg"} 
                           alt="thumbnail" 
                           fill 
                           className="object-cover"
                         />
                         <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/video:opacity-100 transition-opacity flex items-center justify-center">
                             <ArrowUpRightIcon className="size-5 text-white" />
                         </div>
                       </div>
                       <p className="text-xs line-clamp-3 text-muted-foreground group-hover/video:text-[#3ea6ff] transition-colors relative">
                         {comment.videoTitle}
                         <span className="absolute -bottom-6 left-0 bg-white/10 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/video:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg z-10">
                           {t("viewCommentOnYouTube")}
                         </span>
                       </p>
                     </Link>
                   ) : comment.postId ? (
                     <div className="flex items-start gap-x-2">
                       <div className="relative w-12 h-12 rounded-sm bg-neutral-800 flex items-center justify-center shrink-0">
                         <MessageSquareIcon className="size-5 text-muted-foreground" />
                       </div>
                       <p className="text-xs line-clamp-3 text-muted-foreground hover:text-blue-500 cursor-pointer">
                         {comment.postContent}
                       </p>
                     </div>
                   ) : null}
                 </div>
               )}
            </div>
          </div>
        ))
      )}
      <InfiniteScroll 
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        fetchNextPage={query.fetchNextPage}
        isManual
      />
    </div>
  );
};
