"use client";

import { TrendingUpIcon, HashIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { trpc } from "@/trpc/client";
import { Skeleton } from "@/components/ui/skeleton";

export const TrendingSection = () => {
  const t = useTranslations("Home");
  const { data: tags, isLoading } = trpc.search.getTrendingHashtags.useQuery();

  if (isLoading) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>{t("trending")}</SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="px-3 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-md" />
            ))}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (!tags || tags.length === 0) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center gap-2">
        <TrendingUpIcon className="size-4 text-rose-500" />
        {t("trending")}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {tags.map((tag) => (
            <SidebarMenuItem key={tag}>
              <SidebarMenuButton asChild tooltip={`#${tag}`}>
                <Link href={`/hashtag/${tag}`} className="flex items-center gap-2">
                  <HashIcon className="size-4 text-muted-foreground" />
                  <span className="truncate">#{tag}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
