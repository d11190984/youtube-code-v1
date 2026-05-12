"use client";

import { Suspense, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
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
  ArrowUpRightIcon
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
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CommentReplies } from "@/modules/comments/ui/components/comment-replies";

export const CommunityView = () => {
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
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleApplyKeyword = () => {
    setKeyword(tempKeyword);
    setIsFilterOpen(false);
  };

  return (
    <div className="flex flex-col gap-y-4 p-4 lg:p-8 bg-neutral-50 dark:bg-[#0f0f0f] min-h-screen text-black dark:text-white">
      <h1 className="text-2xl font-bold mb-4">Cộng đồng</h1>

      <Tabs defaultValue="comments" className="w-full">
        <TabsList className="bg-transparent h-auto p-0 gap-x-6 border-b border-neutral-200 dark:border-white/10 w-full justify-start rounded-none">
          <TabsTrigger 
            value="comments" 
            className="px-0 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-black dark:data-[state=active]:border-white bg-transparent data-[state=active]:bg-transparent font-medium capitalize"
          >
            Bình luận
          </TabsTrigger>
          <TabsTrigger 
            value="viewer-posts" 
            className="px-0 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-black dark:data-[state=active]:border-white bg-transparent data-[state=active]:bg-transparent font-medium capitalize text-muted-foreground"
          >
            Bài đăng của người xem
          </TabsTrigger>
          <TabsTrigger 
            value="mentions" 
            className="px-0 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-black dark:data-[state=active]:border-white bg-transparent data-[state=active]:bg-transparent font-medium capitalize text-muted-foreground"
          >
            Lượt đề cập
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comments" className="mt-4 outline-none">
          {/* Info bar */}
          {statusFilter === "held" && (
            <div className="flex items-center gap-x-2 bg-neutral-100 dark:bg-white/5 px-4 py-3 rounded-md mb-4 text-sm text-muted-foreground">
               <InfoIcon className="size-4 shrink-0" />
               <span>Các bình luận tại đây sẽ bị xóa sau 60 ngày</span>
               <span className="ml-auto hover:text-white cursor-pointer hover:underline text-xs bg-neutral-200 dark:bg-white/10 px-3 py-1.5 rounded-full">Tìm hiểu thêm</span>
            </div>
          )}

          {/* Lọc & Sắp xếp */}
          <div className="flex items-center gap-x-3 mb-4 text-sm flex-wrap gap-y-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-neutral-200 dark:hover:bg-white/10 rounded-full">
               <FilterIcon className="size-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="rounded-full h-8 px-3 text-xs font-medium bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 border-0">
                  {statusFilter === "published" ? "Đã đăng" : "Bị giữ lại"} <ChevronDownIcon className="size-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-[#282828] border-white/10 text-white rounded-xl shadow-2xl p-2">
                <DropdownMenuRadioGroup value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                  <DropdownMenuRadioItem value="published" className="cursor-pointer focus:bg-white/10 focus:text-white py-2">Đã đăng</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="held" className="cursor-pointer focus:bg-white/10 focus:text-white py-2">Bị giữ lại</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="rounded-full h-8 px-3 text-xs font-medium bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 border-0">
                  Sắp xếp theo: {sortBy === "newest" ? "Mới nhất" : "Phù hợp nhất"} <ChevronDownIcon className="size-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-[#282828] border-white/10 text-white rounded-xl shadow-2xl p-2">
                <DropdownMenuRadioGroup value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                  <DropdownMenuRadioItem value="top" className="cursor-pointer focus:bg-white/10 focus:text-white py-2">Phù hợp nhất (mặc định)</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="newest" className="cursor-pointer focus:bg-white/10 focus:text-white py-2">Mới nhất</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="rounded-full h-8 px-3 text-xs font-medium bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 border-0">
                  Lọc thêm <ChevronDownIcon className="size-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 bg-[#282828] border-white/10 text-white rounded-xl shadow-2xl py-2 px-0">
                {/* Từ khoá */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="px-4 py-2 hover:bg-white/10 cursor-pointer">
                    Từ khoá
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-72 bg-[#282828] border-white/10 text-white rounded-xl p-4 ml-2">
                    <div className="flex flex-col gap-y-3" onClick={(e) => e.stopPropagation()}>
                      <p className="text-sm font-medium">Từ khoá</p>
                      <Input 
                        placeholder="Giá trị" 
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
                          Hủy
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleApplyKeyword} 
                          className="text-[#3ea6ff] hover:bg-[#3ea6ff]/10 h-8 font-bold"
                        >
                          Áp dụng
                        </Button>
                      </div>
                    </div>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuItem 
                  className="px-4 py-2 hover:bg-white/10 cursor-pointer flex justify-between items-center"
                  onClick={(e) => {
                    e.preventDefault(); // Prevent default close if needed, or let it close
                    setContainsQuestions(!containsQuestions);
                    setIsFilterOpen(false);
                  }}
                >
                  Chứa câu hỏi
                  {containsQuestions && <div className="size-2 bg-blue-500 rounded-full" />}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-white/10 my-1" />

                {/* Loại nội dung */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="px-4 py-2 hover:bg-white/10 cursor-pointer">
                    Loại nội dung
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-64 bg-[#282828] border-white/10 text-white rounded-xl p-0 overflow-hidden ml-2">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center">
                       <span className="text-sm font-medium">Loại nội dung</span>
                    </div>
                    <div className="p-2 flex flex-col gap-y-1">
                      {[
                        { id: "video", label: "Video" },
                        { id: "shorts", label: "Shorts" },
                        { id: "my-posts", label: "Bài đăng của tôi" },
                        { id: "viewer-posts", label: "Bài đăng của người xem" },
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
                         Hủy
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
                         Áp dụng
                       </Button>
                    </div>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuItem className="px-4 py-2 hover:bg-white/10 cursor-pointer">
                  Số người đăng ký
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-white/10 my-1" />

                {/* Trạng thái phản hồi */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="px-4 py-2 hover:bg-white/10 cursor-pointer">
                    Trạng thái phản hồi
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-72 bg-[#282828] border-white/10 text-white rounded-xl p-0 overflow-hidden ml-2">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center">
                       <span className="text-sm font-medium">Trạng thái phản hồi</span>
                    </div>
                    <div className="p-2 flex flex-col gap-y-1">
                      {[
                        { id: "not-responded", label: "Chưa phản hồi" },
                        { id: "responded", label: "Đã phản hồi" },
                        { id: "new-reply", label: "Câu trả lời mới cho phản hồi của bạn" },
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
                         Hủy
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
                         Áp dụng
                       </Button>
                    </div>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Keyword tag */}
            {keyword && (
              <div className="flex items-center gap-x-1 bg-neutral-200 dark:bg-white/10 rounded-full h-8 px-3 text-xs font-medium">
                 Từ khoá: {keyword}
                 <button onClick={() => { setKeyword(""); setTempKeyword(""); }} className="ml-1 hover:bg-white/20 rounded-full p-0.5">
                    <XIcon className="size-3" />
                 </button>
              </div>
            )}
            
            {containsQuestions && (
              <div className="flex items-center gap-x-1 bg-neutral-200 dark:bg-white/10 rounded-full h-8 px-3 text-xs font-medium">
                 Chứa câu hỏi
                 <button onClick={() => setContainsQuestions(false)} className="ml-1 hover:bg-white/20 rounded-full p-0.5">
                    <XIcon className="size-3" />
                 </button>
              </div>
            )}

            {selectedContentTypes.length > 0 && (
              <div className="flex items-center gap-x-1 bg-neutral-200 dark:bg-white/10 rounded-full h-8 px-3 text-xs font-medium">
                 Loại nội dung: {selectedContentTypes.length}
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
              <div className="flex items-center gap-x-1 bg-neutral-200 dark:bg-white/10 rounded-full h-8 px-3 text-xs font-medium">
                 Trạng thái phản hồi: {selectedResponseStatuses.length}
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
          </div>

          <div className="border-t border-neutral-200 dark:border-white/10 w-full pt-2 min-h-[400px]">
             <Suspense fallback={
               <div className="flex flex-col items-center justify-center py-24 gap-y-4">
                  <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground animate-pulse">Đang cập nhật danh sách bình luận...</p>
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
                />
             </Suspense>
          </div>
        </TabsContent>

        <TabsContent value="viewer-posts">
           <div className="p-8 text-center text-muted-foreground">
              Tính năng này đang được phát triển...
           </div>
        </TabsContent>

        <TabsContent value="mentions">
           <div className="p-8 text-center text-muted-foreground">
              Tính năng này đang được phát triển...
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
}

const CommunityCommentsList = ({
  sortBy,
  statusFilter,
  keyword,
  containsQuestions,
  selectedContentTypes,
  selectedResponseStatuses,
  setKeyword,
  setTempKeyword,
  setStatusFilter,
  setContainsQuestions,
  setSelectedContentTypes,
  setTempContentTypes,
  setSelectedResponseStatuses,
  setTempResponseStatuses,
}: CommunityCommentsListProps) => {
  const { user } = useUser();
  const utils = trpc.useUtils();
  
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [openReplies, setOpenReplies] = useState<Set<string>>(new Set());

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
      toast.success("Đã gửi phản hồi");
      setReplyingTo(null);
      setReplyText("");
      utils.studio.getCommunityComments.invalidate();
    },
    onError: () => toast.error("Đã xảy ra lỗi khi gửi phản hồi"),
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

  const [data] = trpc.studio.getCommunityComments.useSuspenseInfiniteQuery({
    limit: 20,
    sortBy,
    status: statusFilter,
    keyword: keyword || undefined,
    containsQuestions: containsQuestions || undefined,
    contentTypes: selectedContentTypes.length > 0 ? selectedContentTypes : undefined,
    responseStatuses: selectedResponseStatuses.length > 0 ? selectedResponseStatuses : undefined,
  }, {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const comments = data.pages.flatMap((page) => page.items);

  return (
    <div className="flex flex-col">
      {comments.length > 0 && (
        <div className="pl-4 pb-2 border-b border-neutral-200 dark:border-white/10">
          <Checkbox className="border-muted-foreground data-[state=checked]:bg-[#3ea6ff] data-[state=checked]:border-[#3ea6ff]" />
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
               <h3 className="text-xl font-bold text-black dark:text-white">Không tìm thấy bình luận nào</h3>
               <p className="text-sm text-muted-foreground max-w-[320px] mx-auto">
                  Hãy thử thay đổi bộ lọc hoặc tìm kiếm với từ khoá khác để xem kết quả.
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
              }}
            >
              Xoá tất cả bộ lọc
            </Button>
         </div>
      ) : (
        comments.map((comment) => (
          <div key={comment.id} className="flex flex-col border-t border-neutral-200 dark:border-white/10">
            <div className="flex gap-x-4 p-4 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors group">
              <div className="pt-2">
                <Checkbox className="border-muted-foreground data-[state=checked]:bg-[#3ea6ff] data-[state=checked]:border-[#3ea6ff]" />
              </div>
              
              <Avatar className="size-10 mt-1">
                <AvatarImage src={comment.user.imageUrl} />
                <AvatarFallback>{comment.user.name[0]}</AvatarFallback>
              </Avatar>

              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex items-center gap-x-2 text-xs text-muted-foreground mb-1">
                    <span className="font-bold text-black dark:text-white bg-neutral-200 dark:bg-white/10 px-2 py-0.5 rounded-full">
                      @{comment.user.handle || comment.user.name}
                    </span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(comment.createdAt), { locale: vi, addSuffix: true })}</span>
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
                      Phản hồi
                    </Button>
                    {comment.replyCount > 0 ? (
                      <button 
                        onClick={() => toggleReplies(comment.id)}
                        className="flex items-center gap-x-1 cursor-pointer text-[#3ea6ff] hover:underline transition-colors font-bold"
                      >
                        {comment.replyCount} phản hồi {openReplies.has(comment.id) ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />}
                      </button>
                    ) : (
                      <div className="flex items-center gap-x-1 cursor-pointer hover:text-[#3ea6ff] transition-colors">
                        0 phản hồi <ChevronDownIcon className="size-4" />
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
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-neutral-200 dark:hover:bg-white/10 rounded-full">
                        <MoreVerticalIcon className="size-4" />
                      </Button>
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
                          <p className="text-[10px] text-muted-foreground font-medium mb-1 group-focus-within:text-black dark:group-focus-within:text-white">Phản hồi</p>
                          <textarea 
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Phản hồi..."
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
                              Hủy
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
                              Phản hồi
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
                        Xem bình luận trên YouTube
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
            </div>
          </div>
        ))
      )}
    </div>
  );
};
