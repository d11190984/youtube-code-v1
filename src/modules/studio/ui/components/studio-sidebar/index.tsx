"use client";

import { Link, usePathname } from "@/i18n/routing";
import {
  LayoutDashboardIcon,
  VideoIcon,
  BarChart3Icon,
  UsersIcon,
  Wand2Icon,
  LogOutIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { StudioSidebarHeader } from "./studio-sidebar-header";
import { PostDetailsSidebar } from "./post-details-sidebar";
import { VideoDetailsSidebar } from "./video-details-sidebar";

const StudioSidebarInternal = () => {
  const t = useTranslations("Studio");
  const pathname = usePathname();

  const menuItems = [
    {
      href: "/studio/dashboard",
      label: t("dashboard"),
      icon: LayoutDashboardIcon,
    },
    {
      href: "/studio",
      label: t("content"),
      icon: VideoIcon,
    },
    {
      href: "/studio/analytics",
      label: t("analytics"),
      icon: BarChart3Icon,
    },
    {
      href: "/studio/community/comments",
      label: t("community"),
      icon: UsersIcon,
    },
    {
      href: "/studio/customization",
      label: t("customization"),
      icon: Wand2Icon,
    },
  ];

  const isPostDetails = pathname.includes("/studio/posts/");
  const isVideoDetails = pathname.includes("/studio/videos/");

  return (
    <SidebarGroup>
      <SidebarMenu>
        <StudioSidebarHeader />

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/studio" 
            ? pathname === "/studio" 
            : pathname.startsWith(item.href);

          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                isActive={isActive}
                tooltip={item.label}
                asChild
              >
                <Link prefetch href={item.href}>
                  <Icon className="size-5" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}

        <Separator />

        <SidebarMenuItem>
          <SidebarMenuButton tooltip={t("exitStudio")} asChild>
            <Link prefetch href="/">
              <LogOutIcon className="size-5" />
              <span className="text-sm">{t("exitStudio")}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
};

export const StudioSidebar = () => {
  const pathname = usePathname();

  const isPostDetails = pathname.includes("/studio/posts/");
  const isVideoDetails = pathname.includes("/studio/videos/");

  return (
    <Sidebar className="pt-16 z-40" collapsible="icon">
      <SidebarContent className="bg-background">
        {isPostDetails && <PostDetailsSidebar />}
        {isVideoDetails && <VideoDetailsSidebar />}
        
        {!isPostDetails && !isVideoDetails && <StudioSidebarInternal />}
      </SidebarContent>
    </Sidebar>
  );
};
