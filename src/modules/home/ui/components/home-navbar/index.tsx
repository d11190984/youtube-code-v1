"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import Image from "next/image";

import { MicIcon, SearchIcon, ArrowLeft } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

import { AuthButton } from "@/modules/auth/ui/components/auth-button";

import { useIsOnline } from "@/hooks/use-is-online";

import { SearchInput } from "./search-input";
import { CreateButton } from "./create-button";
import { VoiceSearchModal } from "./voice-search-modal";
import { useTranslations } from "next-intl";
import { NotificationBell } from "@/modules/notifications/ui/components/notification-bell";

export const HomeNavbar = () => {
  const t = useTranslations("General");
  const [isVoiceSearchOpen, setIsVoiceSearchOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const isOnline = useIsOnline();

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-black/80 backdrop-blur-md flex items-center px-2 pr-5 z-50 border-b border-transparent transition-all">
      <VoiceSearchModal
        open={isVoiceSearchOpen}
        onOpenChange={setIsVoiceSearchOpen}
      />
      <div className="flex items-center gap-4 w-full">
        {/* Expanded Search for Mobile */}
        {isSearchExpanded ? (
          <div className="flex items-center gap-2 w-full">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setIsSearchExpanded(false)}
            >
              <ArrowLeft className="size-5" />
            </Button>
            <div className="flex-1">
              <SearchInput onCollapse={() => setIsSearchExpanded(false)} isExpanded />
            </div>
          </div>
        ) : (
          <>
            {/* Menu and Logo */}
            <div className="flex items-center flex-shrink-0">
              <SidebarTrigger />
              <Link prefetch href="/">
                <div className="p-4 flex items-center gap-1">
                  <Image src="/yuuka.png" alt="Logo" width={32} height={32} />
                  <p className="text-xl font-semibold tracking-tight">{t("siteTitle")}</p>
                </div>
              </Link>
            </div>

            {/* Search bar (Hidden on mobile, shown as icon) */}
            <div className="flex-1 flex justify-center items-center gap-4 max-w-[720px] mx-auto">
              <SearchInput onExpand={() => setIsSearchExpanded(true)} disabled={!isOnline} />
              <Button
                onClick={() => setIsVoiceSearchOpen(true)}
                variant="secondary"
                size="icon"
                disabled={!isOnline}
                className="rounded-full flex-shrink-0 hover:bg-neutral-200 dark:hover:bg-neutral-800 hidden sm:flex"
              >
                <MicIcon className="size-5" />
              </Button>
            </div>

            <div className="flex-shrink-0 items-center flex gap-4">
              {isOnline && (
                <>
                  <CreateButton />
                  <div className="hidden md:block">
                    <NotificationBell />
                  </div>
                </>
              )}
              <AuthButton />
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

