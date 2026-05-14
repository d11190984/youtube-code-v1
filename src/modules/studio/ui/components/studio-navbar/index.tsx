import { Link } from "@/i18n/routing";
import Image from "next/image";

import { Suspense } from "react";

import { SidebarTrigger } from "@/components/ui/sidebar";

import { AuthButton } from "@/modules/auth/ui/components/auth-button";
import { CreateButton } from "@/modules/home/ui/components/home-navbar/create-button";
import { useTranslations } from "next-intl";
import { StudioSearch } from "./studio-search";

export const StudioNavbar = () => {
  const t = useTranslations("General");
  return  (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-background flex items-center px-2 pr-5 z-50 border-b shadow-md">
      <div className="flex items-center gap-4 w-full">
        {/* Menu and Logo */}
        <div className="flex items-center flex-shrink-0">
          <SidebarTrigger />
          <Link prefetch href="/studio" className="hidden md:block">
            <div className="p-4 flex items-center gap-1">
              <Image src="/yuuka.png" alt="Logo" width={32} height={32} />
              <p className="text-xl font-semibold tracking-tight">{t("studioTitle")}</p>
            </div>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="flex-1 flex justify-center max-w-[720px] mx-auto">
          <Suspense fallback={<div className="w-full max-w-[600px] h-10 bg-neutral-900 rounded-full animate-pulse" />}>
            <StudioSearch />
          </Suspense>
        </div>

        <div className="flex-shrink-0 items-center flex gap-4">
          <CreateButton />
          <AuthButton />
        </div>
      </div>
    </nav>
  );
};
