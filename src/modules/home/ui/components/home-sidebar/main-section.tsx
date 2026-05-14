"use client";

import { Link } from "@/i18n/routing";
import Image from "next/image";
import { usePathname } from "@/i18n/routing";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { FlameIcon, HomeIcon, PlaySquareIcon, VideoIcon  } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export const MainSection = () => {
  const t = useTranslations("Sidebar");
  const tGeneral = useTranslations("General");
  const clerk = useClerk();
  const { isSignedIn } = useAuth();
  const pathname = usePathname();

  const items = [
    {
      title: t("home"),
      url: "/",
      icon: HomeIcon,
    },
    {
      title: t("subscriptions"),
      url: "/feed/subscribed",
      icon: PlaySquareIcon,
      auth: true,
    },
    {
      title: t("trending"),
      url: "/feed/trending",
      icon: FlameIcon,
    },
    {
      title: t("shorts"),
      url: "/feed/shorts",
      icon: VideoIcon,
    },
  ];

  return (
    <SidebarGroup>
      {/* 🔥 LOGO + TITLE (mobile sidebar header) */}
      <div className="flex items-center gap-2 px-4 py-3 border-b sm:hidden">
        <Image src="/yuuka.png" alt="Logo" width={28} height={28} />
        <span className="font-semibold text-base">{tGeneral("siteTitle")}</span>
      </div>

      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
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
                <Link href={item.url} className="flex items-center gap-4">
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
