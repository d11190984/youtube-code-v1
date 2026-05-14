"use client";

import { Link } from "@/i18n/routing";
import { usePathname } from "@/i18n/routing";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
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

export const PersonalSection = () => {
  const t = useTranslations("Sidebar");
  const clerk = useClerk();
  const { user } = useUser();
  const { isSignedIn } = useAuth();
  const pathname = usePathname();
  const isOnline = useIsOnline();

  const items = [
    {
      title: t("notifications"),
      url: "/notifications",
      icon: BellIcon,
      auth: true,
    },
    {
      title: t("yourChannel"),
      url: "/users/current",
      icon: UserSquare2Icon,
      auth: true,
    },
    {
      title: t("history"),
      url: "/playlists/history",
      icon: HistoryIcon,
      auth: true,
    },
    {
      title: t("yourVideos"),
      url: "/studio",
      icon: PlaySquareIcon,
      auth: true,
    },
    {
      title: t("likedVideos"),
      url: "/playlists/liked",
      icon: ThumbsUpIcon,
      auth: true,
    },
    {
      title: t("allPlaylists"),
      url: "/playlists",
      icon: ListVideoIcon,
      auth: true,
    },
    {
      title: t("downloads"),
      url: "/playlists/download",
      icon: DownloadIcon,
      auth: true,
    },
  ];

  let filteredItems = isOnline 
    ? items 
    : items.filter(item => item.url === "/playlists/download");

  const isAdmin = user?.emailAddresses.some(e => e.emailAddress === "vuliztva1@gmail.com");
  
  if (isAdmin && isOnline) {
    filteredItems = [
      ...filteredItems,
      {
        title: t("systemAdmin"),
        url: "/admin",
        icon: ShieldAlertIcon,
        auth: true,
      }
    ];
  }

  return (
    <SidebarGroup>
      {isOnline && <SidebarGroupLabel>{t("you")}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {filteredItems.map((item) => (
            <SidebarMenuItem key={item.url}>
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

