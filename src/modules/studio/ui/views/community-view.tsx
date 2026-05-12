"use client";

import { useState } from "react";
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
  MessageSquareIcon,
  SearchXIcon,
  XIcon,
  InfoIcon,
  ArrowUpRightIcon
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const CommunityView = () => {
  const { user } = useUser();
  const utils = trpc.useUtils();
  
  const [sortBy, setSortBy] = useState<"newest" | "top">("newest");
  const [statusFilter, setStatusFilter] = useState<"published" | "held">("published");
  const [keyword, setKeyword] = useState<string>("");
  const [tempKeyword, setTempKeyword] = useState<string>("");

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

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
  }, {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const comments = data.pages.flatMap((page) => page.items);

  const handleApplyKeyword = () => {
    setKeyword(tempKeyword);
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="rounded-full h-8 px-3 text-xs font-medium bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 border-0">
                  Lọc thêm <ChevronDownIcon className="size-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 bg-[#282828] border-white/10 text-white rounded-xl shadow-2xl py-2 px-0">
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full text-left px-4 py-2 hover:bg-white/10 outline-none flex justify-between items-center">
                    Từ khoá <ChevronDownIcon className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 bg-[#282828] border-white/10 text-white rounded-xl shadow-2xl p-4 ml-2 mt-[-40px]">
                    <div className="flex flex-col gap-y-3">
                      <p className="text-sm font-medium">Từ khoá</p>
                      <Input 
                        placeholder="Giá trị" 
                        value={tempKeyword}
                        onChange={(e) => setTempKeyword(e.target.value)}
                        className="bg-transparent border-white/20 focus-visible:ring-0 focus-visible:border-blue-500 h-9"
                        onKeyDown={(e) => e.key === "Enter" && handleApplyKeyword()}
                      />
                      <div className="flex justify-end gap-x-2 mt-2">
                        <Button variant="ghost" size="sm" onClick={() => setTempKeyword("")} className="hover:bg-white/10 h-8">Hủy</Button>
                        <Button variant="ghost" size="sm" onClick={handleApplyKeyword} className="text-[#3ea6ff] hover:bg-[#3ea6ff]/10 h-8">Áp dụng</Button>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <DropdownMenuItem className="cursor-pointer focus:bg-white/10 focus:text-white px-4 py-2">Chứa câu hỏi</DropdownMenuItem>
                <div className="h-px bg-white/10 my-1" />
                <DropdownMenuItem className="cursor-pointer focus:bg-white/10 focus:text-white px-4 py-2">Người đăng ký công khai</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer focus:bg-white/10 focus:text-white px-4 py-2">Số người đăng ký</DropdownMenuItem>
                <div className="h-px bg-white/10 my-1" />
                <DropdownMenuItem className="cursor-pointer focus:bg-white/10 focus:text-white px-4 py-2">Trạng thái phản hồi</DropdownMenuItem>
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
          </div>

          <div className="border-t border-neutral-200 dark:border-white/10 w-full pt-2">
            {comments.length > 0 && (
              <div className="pl-4 pb-2">
                <Checkbox className="border-muted-foreground data-[state=checked]:bg-[#3ea6ff] data-[state=checked]:border-[#3ea6ff]" />
              </div>
            )}

            {/* Danh sách bình luận */}
            <div className="flex flex-col">
              {comments.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <div className="relative w-32 h-32 mb-4 bg-[#b58ff8] rounded-full flex items-center justify-center opacity-80 shadow-[0_0_40px_rgba(181,143,248,0.2)]">
                       <SearchXIcon className="size-16 text-[#0f0f0f]" />
                    </div>
                    <p className="text-sm font-medium">Không tìm thấy bình luận nào. Hãy thử tìm kiếm nội dung khác hoặc bỏ bộ lọc.</p>
                 </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-x-4 border-t border-neutral-200 dark:border-white/10 p-4 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors group">
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
                             {comment.user.name.startsWith("@") ? comment.user.name : `@${comment.user.name}`}
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
                            <div className="flex items-center gap-x-1 cursor-pointer text-[#3ea6ff] hover:underline transition-colors font-bold">
                              {comment.replyCount} phản hồi <ChevronDownIcon className="size-4" />
                            </div>
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
                    </div>

                    {/* Thumbnail video/post bên phải */}
                    <div className="hidden md:flex w-48 shrink-0 flex-col gap-y-1">
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
                ))
              )}
            </div>
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
