import Link from "next/link";
import Image from "next/image";

import { MicIcon } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

import { AuthButton } from "@/modules/auth/ui/components/auth-button";

import { SearchInput } from "./search-input";
import { CreateButton } from "./create-button";

export const HomeNavbar = () => {
  return  (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-black/80 backdrop-blur-md flex items-center px-2 pr-5 z-50 border-b border-transparent transition-all">
      <div className="flex items-center gap-4 w-full">
        {/* Menu and Logo */}
        <div className="flex items-center flex-shrink-0">
          <SidebarTrigger />
          <Link prefetch href="/" className="hidden md:block">
            <div className="p-4 flex items-center gap-1">
              <Image src="/yuuka.png" alt="Logo" width={32} height={32} />
              <p className="text-xl font-semibold tracking-tight">Hayase Yuuka</p>
            </div>
          </Link>
        </div>

        {/* Search bar */}
        <div className="flex-1 flex justify-center items-center gap-4 max-w-[720px] mx-auto">
          <SearchInput />
          <Button variant="secondary" size="icon" className="rounded-full flex-shrink-0 hover:bg-neutral-200 dark:hover:bg-neutral-800">
            <MicIcon className="size-5" />
          </Button>
        </div>

        <div className="flex-shrink-0 items-center flex gap-4">
          <CreateButton />
          <AuthButton />
        </div>
      </div>
    </nav>
  );
};
