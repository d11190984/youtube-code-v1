"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

import { MicIcon, SearchIcon, ArrowLeft } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

import { AuthButton } from "@/modules/auth/ui/components/auth-button";

import { SearchInput } from "./search-input";
import { CreateButton } from "./create-button";
import { VoiceSearchModal } from "./voice-search-modal";
import { NotificationBell } from "@/modules/notifications/ui/components/notification-bell";

export const HomeNavbar = () => {
  const [isVoiceSearchOpen, setIsVoiceSearchOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

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
                  <p className="text-xl font-semibold tracking-tight">Hayase Yuuka</p>
                </div>
              </Link>
            </div>

            {/* Search bar (Hidden on mobile, shown as icon) */}
            <div className="flex-1 flex justify-center items-center gap-4 max-w-[720px] mx-auto">
              <SearchInput onExpand={() => setIsSearchExpanded(true)} />
              <Button
                onClick={() => setIsVoiceSearchOpen(true)}
                variant="secondary"
                size="icon"
                className="rounded-full flex-shrink-0 hover:bg-neutral-200 dark:hover:bg-neutral-800 hidden sm:flex"
              >
                <MicIcon className="size-5" />
              </Button>
            </div>

            <div className="flex-shrink-0 items-center flex gap-4">
              <CreateButton />
              <NotificationBell />
              <AuthButton />
            </div>
          </>
        )}
      </div>
    </nav>
  );
};
