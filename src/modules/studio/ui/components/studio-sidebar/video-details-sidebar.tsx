"use client";

import { Link } from "@/i18n/routing";
import { usePathname } from "@/i18n/routing";
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  MessageSquareIcon,
  BarChart3Icon,
  ClapperboardIcon,
  TypeIcon,
  ExternalLinkIcon
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

export const VideoDetailsSidebar = () => {
  const t = useTranslations("Studio");
  const pathname = usePathname();
  const videoId = pathname.split("/studio/videos/")[1]?.split("/")[0];
  
  const { data: video, isLoading } = trpc.studio.getOne.useQuery(
    { id: videoId },
    { enabled: !!videoId }
  );

  if (isLoading || !video) {
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

  const activeTab = pathname.split("/").pop();

  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link href="/studio?tab=videos">
              <ArrowLeftIcon className="size-5" />
              <span className="text-sm">{t("channelContent")}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>

        <div className="px-2 py-4">
          <div className="relative aspect-video bg-neutral-800 rounded-md flex items-center justify-center border border-neutral-700 overflow-hidden mb-2 group/thumbnail">
            {video.thumbnailUrl ? (
              <img 
                src={video.thumbnailUrl} 
                alt="Video" 
                className="w-full h-full object-cover"
              />
            ) : (
              <ClapperboardIcon className="size-8 text-neutral-500" />
            )}
            <Link 
              href={`/videos/${videoId}`} 
              target="_blank"
              className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover/thumbnail:opacity-100 transition-opacity gap-y-1"
            >
              <ExternalLinkIcon className="size-5 text-white" />
              <span className="text-[10px] text-white font-medium px-2 py-0.5 bg-black/40 rounded-sm">
                {t("viewOnYouTube")}
              </span>
            </Link>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-neutral-400 font-medium">{t("yourVideo")}</p>
            <p className="text-sm font-bold line-clamp-2">{video.title}</p>
          </div>
        </div>

        <SidebarMenuItem>
          <SidebarMenuButton 
            isActive={activeTab === videoId} 
            asChild
            tooltip={t("details")}
          >
            <Link href={`/studio/videos/${videoId}`}>
              <PencilIcon className="size-5" />
              <span className="text-sm">{t("details")}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <SidebarMenuButton 
            isActive={activeTab === "analytics"} 
            asChild
            tooltip={t("analytics")}
          >
            <Link href={`/studio/videos/${videoId}/analytics`}>
              <BarChart3Icon className="size-5" />
              <span className="text-sm">{t("analytics")}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <SidebarMenuButton 
            isActive={activeTab === "comments"} 
            asChild
            tooltip={t("comments")}
          >
            <Link href={`/studio/videos/${videoId}/comments`}>
              <MessageSquareIcon className="size-5" />
              <span className="text-sm">{t("comments")}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
};
