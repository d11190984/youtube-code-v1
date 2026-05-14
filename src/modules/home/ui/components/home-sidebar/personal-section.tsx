"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import {
  HistoryIcon,
  ListVideoIcon,
  ThumbsUpIcon,
  UserSquare2Icon,
  DownloadIcon,
  PlaySquareIcon,
  BellIcon,
  ShieldAlertIcon,
} from "lucide-react";

import { useIsOnline } from "@/hooks/use-is-online";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  {
    title: "Thông báo",
    url: "/notifications",
    icon: BellIcon,
    auth: true,
  },
  {
    title: "Kênh của bạn",
    url: "/users/current",
    icon: UserSquare2Icon,
    auth: true,
  },
  {
    title: "Video đã xem",
    url: "/playlists/history",
    icon: HistoryIcon,
    auth: true,
  },
  {
    title: "Video của bạn",
    url: "/studio",
    icon: PlaySquareIcon,
    auth: true,
  },
  {
    title: "Video đã thích",
    url: "/playlists/liked",
    icon: ThumbsUpIcon,
    auth: true,
  },
  {
    title: "Tất cả danh sách phát",
    url: "/playlists",
    icon: ListVideoIcon,
    auth: true,
  },
  {
    title: "Nội dung tải xuống",
    url: "/playlists/download",
    icon: DownloadIcon,
    auth: true,
  },
];

export const PersonalSection = () => {
  const clerk = useClerk();
  const { user } = useUser();
  const { isSignedIn } = useAuth();
  const pathname = usePathname();
  const isOnline = useIsOnline();

  let filteredItems = isOnline 
    ? items 
    : items.filter(item => item.title === "Nội dung tải xuống");

  const isAdmin = user?.emailAddresses.some(e => e.emailAddress === "vuliztva1@gmail.com");
  
  if (isAdmin && isOnline) {
    filteredItems = [
      ...filteredItems,
      {
        title: "Bảng quản trị hệ thống",
        url: "/admin",
        icon: ShieldAlertIcon,
        auth: true,
      }
    ];
  }

  return (
    <SidebarGroup>
      {isOnline && <SidebarGroupLabel>Bạn</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {filteredItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                asChild
                isActive={pathname === item.url}
                onClick={(e) => {
                  if (!isSignedIn && item.auth) {
                    e.preventDefault();
                    return clerk.openSignIn();
                  }
                }}
              >
                <Link
                  prefetch
                  href={item.url}
                  className="flex items-center gap-4"
                >
                  <item.icon />
                  <span className="text-sm">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

