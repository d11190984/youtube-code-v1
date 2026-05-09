"use client";

import { useState, useEffect } from "react";
import { 
  ClapperboardIcon, 
  GlobeIcon, 
  LogOutIcon, 
  MoonIcon, 
  SettingsIcon, 
  SunIcon, 
  UserCircleIcon, 
  UserIcon,
  ChevronRightIcon,
  CheckIcon
} from "lucide-react";
import { useTheme } from "next-themes";
import { SignInButton, SignedIn, SignedOut, useClerk, useUser } from "@clerk/nextjs";
import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const languages = [
  { code: "vi", name: "Tiếng Việt" },
  { code: "en", name: "English" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
  { code: "zh", name: "简体中文" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
];

export const AuthButton = () => {
  const clerk = useClerk();
  const { user } = useUser();
  const t = useTranslations("AuthButton");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains("dark");
    setCurrentTheme(isDark ? "dark" : "light");
    
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener("resize", handleResize);

    const observer = new MutationObserver(() => {
      const isDarkNow = document.documentElement.classList.contains("dark");
      setCurrentTheme(isDarkNow ? "dark" : "light");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const [isMobile, setIsMobile] = useState(false);

  if (!mounted) {
    return (
       <div className="size-8 rounded-full bg-muted animate-pulse" />
    );
  }

  const handleLanguageChange = (newLocale: string) => {
    router.push(pathname, { locale: newLocale as any });
  };

  const currentLanguageName = languages.find(l => l.code === locale)?.name || "Language";

  return (
    <>
      <SignedIn>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
              <Avatar className="h-8 w-8 border border-border">
                <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
                <AvatarFallback>
                  <UserIcon className="size-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[280px] sm:w-80" align={isMobile ? "center" : "end"} forceMount>
            <div className="flex items-start gap-3 p-4">
              <Avatar className="h-10 w-10 border border-border">
                <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
                <AvatarFallback>
                  <UserIcon className="size-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
                <button 
                  onClick={() => clerk.openUserProfile()}
                  className="text-xs text-blue-500 hover:underline text-left pt-2"
                >
                  {t("manageAccount")}
                </button>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/users/current")}>
              <UserIcon className="mr-3 size-4" />
              <span>{t("myProfile")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/studio")}>
              <ClapperboardIcon className="mr-3 size-4" />
              <span>{t("studio")}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              const isDark = document.documentElement.classList.contains("dark");
              setTheme(isDark ? "light" : "dark");
            }}>
              {currentTheme === "dark" ? <MoonIcon className="mr-3 size-4" /> : <SunIcon className="mr-3 size-4" />}
              <div className="flex flex-1 items-center justify-between">
                <span>{t("theme")}: {currentTheme === "dark" ? t("dark") : t("light")}</span>
                <ChevronRightIcon className="size-4 text-muted-foreground" />
              </div>
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <GlobeIcon className="mr-3 size-4" />
                <span>{t("language")}: {currentLanguageName}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent 
                className="w-[200px] sm:w-60 max-h-[400px] overflow-y-auto"
                sideOffset={isMobile ? -40 : 8}
                collisionPadding={10}
              >
                {languages.map((lang) => (
                  <DropdownMenuItem key={lang.code} onClick={() => handleLanguageChange(lang.code)}>
                    <div className="flex w-full items-center justify-between">
                      <span>{lang.name}</span>
                      {locale === lang.code && <CheckIcon className="size-4" />}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => clerk.signOut()}>
              <LogOutIcon className="mr-3 size-4" />
              <span>{t("signOut")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal">
          <Button
            variant="outline"
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-500 border-blue-500/20 rounded-full shadow-none"
          >
            <UserCircleIcon />
            Đăng nhập
          </Button>
        </SignInButton>
      </SignedOut>
    </>
  );
};
