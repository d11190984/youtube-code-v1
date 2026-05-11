"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import { ErrorBoundary } from "react-error-boundary";
import { 
  BarChart2Icon, 
  MessageSquareIcon, 
  ThumbsUpIcon, 
  ImageIcon, 
  TypeIcon,
  Globe2Icon,
  LockIcon,
  PencilIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  CheckCircle2Icon,
  SearchIcon,
} from "lucide-react";

import { ErrorFallback } from "@/components/error-fallback";
import { trpc } from "@/trpc/client";
import { Skeleton } from "@/components/ui/skeleton";
import { InfiniteScroll } from "@/components/infinite-scroll";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PostFilters } from "@/modules/studio/ui/components/post-filters";

interface PostsSectionProps {
  limit: number;
}

export const PostsSection = ({ limit }: PostsSectionProps) => {
  const { user } = useUser();
  const [filters, setFilters] = useState<{
    types?: string[];
    visibility?: "public" | "private";
  }>({});

  if (!user) return null;

  return (
    <div>
      <PostFilters onFilterChange={(newFilters) => setFilters(newFilters)} />
      <Suspense key={`${limit}-${user.id}-${JSON.stringify(filters)}`} fallback={<PostsSectionSkeleton />}>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <PostsSectionSuspense limit={limit} userId={user.id} filters={filters} />
        </ErrorBoundary>
      </Suspense>
    </div>
  );
};

const PostsSectionSkeleton = () => {
  return (
    <div className="border-y">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6 w-[400px]">Bài đăng</TableHead>
            <TableHead>Loại</TableHead>
            <TableHead>Chế độ hiển thị</TableHead>
            <TableHead>Hạn chế</TableHead>
            <TableHead>
              <div className="flex items-center gap-1">
                Ngày
                <ArrowDownIcon className="size-4" />
              </div>
            </TableHead>
            <TableHead className="text-right">Bình luận</TableHead>
            <TableHead className="text-right">Lượt thích</TableHead>
            <TableHead className="text-right pr-6">Phản hồi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell className="pl-6">
                <div className="flex items-center gap-4">
                   <Skeleton className="h-20 w-36" />
                   <Skeleton className="h-4 w-[150px]" />
                </div>
              </TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
              <TableCell className="text-right pr-6"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

interface PostsSectionSuspenseProps {
  limit: number;
  userId: string;
  filters: {
    types?: string[];
    visibility?: "public" | "private";
  };
}

const PostsSectionSuspense = ({ limit, userId, filters }: PostsSectionSuspenseProps) => {
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [posts, query] = trpc.posts.getMany.useSuspenseInfiniteQuery(
    {
      limit,
      userId,
      sortOrder,
      ...filters,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const allItems = posts.pages.flatMap((page) => page.items);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  const getPostTypeInfo = (type: string, pollType?: string | null, isQuiz?: boolean) => {
    switch (type) {
      case "poll":
        return {
          label: isQuiz ? "Câu hỏi" : (pollType === "image" ? "Cuộc thăm dò ý kiến bằng hình ảnh" : "Cuộc thăm dò ý kiến"),
          icon: isQuiz ? CheckCircle2Icon : BarChart2Icon,
        };
      case "image":
        return {
          label: "Hình ảnh",
          icon: ImageIcon,
        };
      case "video":
        return {
          label: "Video",
          icon: ImageIcon,
        };
      default:
        return {
          label: "Văn bản",
          icon: TypeIcon,
        };
    }
  };

  return (
    <div>
      <div className="border-y">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6 w-[400px]">Bài đăng</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Chế độ hiển thị</TableHead>
              <TableHead>Hạn chế</TableHead>
              <TableHead 
                className="cursor-pointer select-none group"
                onClick={toggleSortOrder}
              >
                <div className="flex items-center gap-1">
                  Ngày
                  {sortOrder === "desc" ? (
                    <ArrowDownIcon className="size-4" />
                  ) : (
                    <ArrowUpIcon className="size-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="text-right">Bình luận</TableHead>
              <TableHead className="text-right">Lượt thích</TableHead>
              <TableHead className="text-right pr-6">Phản hồi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allItems.length === 0 && (
               <TableRow>
                <TableCell colSpan={8} className="h-[400px] text-center text-muted-foreground">
                   <div className="flex flex-col items-center justify-center gap-y-4">
                    <SearchIcon className="size-16 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">Không có bài đăng nào phù hợp</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {allItems.map((post) => {
              const isQuiz = post.poll?.options?.some((opt: any) => opt.isCorrect);
              const totalVotes = post.poll?.options?.reduce((acc: number, o: any) => acc + (o.voteCount || 0), 0) || 0;
              const typeInfo = getPostTypeInfo(post.type, post.poll?.type, isQuiz);
              const Icon = typeInfo.icon;

              return (
                <TableRow key={post.id} className="group hover:bg-neutral-800/50 transition-colors">
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0 w-36 aspect-video bg-neutral-800 rounded-md flex items-center justify-center border border-neutral-700">
                        {post.images && post.images.length > 0 ? (
                          <img 
                            src={post.images[0].imageUrl} 
                            alt="Post" 
                            className="w-full h-full object-cover rounded-md"
                          />
                        ) : (
                            <Icon className="size-6 text-neutral-400" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/studio/posts/${post.id}`}>
                          <div className="p-2 hover:bg-neutral-700 rounded-full cursor-pointer transition-colors" title="Chi tiết">
                            <PencilIcon className="size-4 text-neutral-400" />
                          </div>
                        </Link>
                        <Link href={`/studio/posts/${post.id}/comments`}>
                          <div className="p-2 hover:bg-neutral-700 rounded-full cursor-pointer transition-colors" title="Bình luận">
                            <MessageSquareIcon className="size-4 text-neutral-400" />
                          </div>
                        </Link>
                      </div>

                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium line-clamp-2">
                          {post.content || "Không có nội dung"}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-x-2 text-sm">
                      <Icon className="size-4 text-neutral-400" />
                      <span>{typeInfo.label}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-x-2 text-sm">
                      <Globe2Icon className="size-4 text-neutral-400" />
                      <span>Công khai</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-neutral-400">
                    Không có
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">
                        {format(new Date(post.createdAt), "d 'thg' M, yyyy")}
                      </span>
                      <span className="text-xs text-neutral-500">
                        Đã đăng
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {post.commentCount}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {post.likeCount}
                  </TableCell>
                  <TableCell className="text-right text-sm pr-6">
                    {post.poll ? totalVotes : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <InfiniteScroll
        isManual
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        fetchNextPage={query.fetchNextPage}
      />
    </div>
  );
};
