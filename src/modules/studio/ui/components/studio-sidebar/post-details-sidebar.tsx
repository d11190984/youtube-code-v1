"use client";

import { Link } from "@/i18n/routing";
import { usePathname } from "@/i18n/routing";
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  MessageSquareIcon,
  TypeIcon,
  ImageIcon,
  BarChart2Icon,
  ExternalLinkIcon,
  CheckCircle2Icon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { trpc } from "@/trpc/client";
import { Skeleton } from "@/components/ui/skeleton";

export const PostDetailsSidebar = () => {
  const t = useTranslations("Studio");
  const pathname = usePathname();
  const postId = pathname.split("/studio/posts/")[1]?.split("/")[0];
  
  const { data: post, isLoading } = trpc.studio.getPost.useQuery(
    { id: postId },
    { enabled: !!postId }
  );

  if (isLoading || !post) {
    return (
      <SidebarGroup>
        <div className="px-2 py-4 space-y-4">
           <Skeleton className="h-4 w-32" />
           <Skeleton className="aspect-video w-full rounded-md" />
           <div className="space-y-2">
             <Skeleton className="h-4 w-full" />
             <Skeleton className="h-4 w-2/3" />
           </div>
        </div>
      </SidebarGroup>
    );
  }

  const isCommentsPage = pathname.includes("/comments");

  const isQuiz = post.poll?.options.some((opt: any) => opt.isCorrect);

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case "poll": return isQuiz ? CheckCircle2Icon : BarChart2Icon;
      case "image": return ImageIcon;
      default: return TypeIcon;
    }
  };

  const Icon = getPostTypeIcon(post.type);

  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link href="/studio?tab=posts">
              <ArrowLeftIcon className="size-5" />
              <span className="text-sm">{t("channelContent")}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>

        <div className="px-2 py-4">
          <div className="relative aspect-video bg-neutral-800 rounded-md flex items-center justify-center border border-neutral-700 overflow-hidden mb-2 group/thumbnail">
            {post.images && post.images.length > 0 ? (
              <img 
                src={post.images[0].imageUrl} 
                alt="Post" 
                className="w-full h-full object-cover"
              />
            ) : post.poll?.options && post.poll.options.some((opt: any) => opt.imageUrl) ? (
              <img 
                src={post.poll.options.find((opt: any) => opt.imageUrl)?.imageUrl ?? undefined} 
                alt="Poll" 
                className="w-full h-full object-cover"
              />
            ) : (
              <Icon className="size-8 text-neutral-500" />
            )}
            <Link 
              href={`/posts/${postId}`} 
              target="_blank"
              className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover/thumbnail:opacity-100 transition-opacity gap-y-1"
            >
              <ExternalLinkIcon className="size-5 text-white" />
              <span className="text-[10px] text-white font-medium px-2 py-0.5 bg-black/40 rounded-sm">
                {t("viewPostOnYouTube")}
              </span>
            </Link>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-neutral-400 font-medium">{t("yourPost")}</p>
            <p className="text-sm font-bold line-clamp-2">{post.content || t("noContent")}</p>
          </div>
        </div>

        <SidebarMenuItem>
          <SidebarMenuButton 
            isActive={!isCommentsPage} 
            asChild
            tooltip={t("details")}
          >
            <Link href={`/studio/posts/${postId}`}>
              <PencilIcon className="size-5" />
              <span className="text-sm">{t("details")}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <SidebarMenuButton 
            isActive={isCommentsPage} 
            asChild
            tooltip={t("comments")}
          >
            <Link href={`/studio/posts/${postId}/comments`}>
              <MessageSquareIcon className="size-5" />
              <span className="text-sm">{t("comments")}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
};
