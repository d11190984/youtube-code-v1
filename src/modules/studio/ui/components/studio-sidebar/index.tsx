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

const menuItems = [
  {
    href: "/studio/dashboard", // Tổng quan bây giờ là dashboard
    label: "Tổng quan",
    icon: LayoutDashboardIcon,
  },
  {
    href: "/studio", // Nội dung là route chính /studio
    label: "Nội dung",
    icon: VideoIcon,
  },
  {
    href: "/studio/analytics",
    label: "Số liệu phân tích",
    icon: BarChart3Icon,
  },
  {
    href: "/studio/community",
    label: "Cộng đồng",
    icon: UsersIcon,
  },
  {
    href: "/studio/customization",
    label: "Tùy chỉnh",
    icon: Wand2Icon,
  },
];

export const StudioSidebar = () => {
  const pathname = usePathname();

  const isPostDetails = pathname.includes("/studio/posts/");
  const isVideoDetails = pathname.includes("/studio/videos/");

  return (
    <Sidebar className="pt-16 z-40" collapsible="icon">
      <SidebarContent className="bg-background">
        {isPostDetails && <PostDetailsSidebar />}
        {isVideoDetails && <VideoDetailsSidebar />}
        
        {!isPostDetails && !isVideoDetails && (
          <SidebarGroup>
            <SidebarMenu>
              <StudioSidebarHeader />

              {menuItems.map((item) => {
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={pathname === item.href}
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
                <SidebarMenuButton tooltip="Thoát Studio" asChild>
                  <Link prefetch href="/">
                    <LogOutIcon className="size-5" />
                    <span className="text-sm">Thoát Studio</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
};
