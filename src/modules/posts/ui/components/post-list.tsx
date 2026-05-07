"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { trpc } from "@/trpc/client";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { PostCard } from "./post-card";
import { DEFAULT_LIMIT } from "@/constants";
import { Edit3, Clock, Archive } from "lucide-react";
import { cn } from "@/lib/utils";

interface PostListProps {
  userId: string;
}

export const PostList = ({ userId }: PostListProps) => {
  const { user } = useUser();
  const [activeSubTab, setActiveSubTab] = useState<"published" | "scheduled" | "archived">("published");

  const { data: channelUser } = trpc.users.getOne.useQuery({ id: userId });
  const isOwner = user?.id && channelUser?.clerkId === user.id;

  const [posts, query] = trpc.posts.getMany.useSuspenseInfiniteQuery(
    { userId, limit: DEFAULT_LIMIT, status: activeSubTab },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );


  const items = posts.pages.flatMap((page) => page.items);

  const subTabs = [
    { key: "published", label: "ĐÃ ĐĂNG" },
    ...(isOwner ? [
      { key: "scheduled", label: "ĐÃ LÊN LỊCH" },
      { key: "archived", label: "ĐÃ LƯU TRỮ" }
    ] : [])
  ];

  return (
    <div className="flex flex-col gap-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-8 border-b border-gray-200 dark:border-neutral-800 mb-2">
         {subTabs.map((tab) => (
           <button
             key={tab.key}
             className={cn(
               "pb-3 text-sm font-bold transition-colors relative",
               activeSubTab === tab.key 
                 ? "text-black dark:text-white" 
                 : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
             )}
             onClick={() => setActiveSubTab(tab.key as any)}
           >
              {tab.label}
              {activeSubTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black dark:bg-white" />
              )}
           </button>
         ))}
      </div>

      {items.length === 0 ? (
        <>
          {activeSubTab === "published" && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
               <div className="bg-gray-100 dark:bg-neutral-800 p-6 rounded-full mb-4">
                  <Edit3 className="size-10 text-gray-400" />
               </div>
               <h3 className="text-xl font-bold">Xuất bản bài đăng</h3>
               <p className="text-sm text-muted-foreground max-w-[400px]">
                  Bài đăng xuất hiện ở đây sau khi bạn xuất bản và sẽ được hiển thị với cộng đồng của bạn
               </p>
            </div>
          )}

          {activeSubTab === "scheduled" && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
               <div className="bg-gray-100 dark:bg-neutral-800 p-6 rounded-full mb-4">
                  <Clock className="size-10 text-gray-400" />
               </div>
               <h3 className="text-xl font-bold">Lên lịch đăng bài</h3>
               <p className="text-sm text-muted-foreground max-w-[400px]">
                  Hãy chuẩn bị sẵn nội dung và lên lịch đăng sau
               </p>
            </div>
          )}

          {activeSubTab === "archived" && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
               <div className="bg-gray-100 dark:bg-neutral-800 p-6 rounded-full mb-4">
                  <Archive className="size-10 text-gray-400" />
               </div>
               <h3 className="text-xl font-bold">Bài đăng đã hết hạn trong kho lưu trữ</h3>
               <p className="text-sm text-muted-foreground max-w-[400px]">
                  Các bài đăng được chọn là sẽ hết hạn sau 24 giờ sẽ xuất hiện trong kho lưu trữ. Chỉ bạn mới có thể xem các bài đăng trong kho lưu trữ.
               </p>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-y-4">
           {items.map((post) => (
             <PostCard key={post.id} post={post} />
           ))}
           <InfiniteScroll
             hasNextPage={query.hasNextPage}
             isFetchingNextPage={query.isFetchingNextPage}
             fetchNextPage={query.fetchNextPage}
           />
        </div>
      )}

    </div>
  );
};
