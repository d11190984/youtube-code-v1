"use client";

import { useState, useEffect } from "react";
import { ClapperboardIcon, LogOutIcon, MoonIcon, SettingsIcon, SunIcon, UserCircleIcon, UserIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { UserButton, SignInButton, SignedIn, SignedOut, useClerk } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

export const AuthButton = () => {
  const clerk = useClerk();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
       <div className="size-8 rounded-full bg-gray-200 animate-pulse" />
    );
  }

  return (
    <>
      <SignedIn>
        <UserButton
          appearance={{
            elements: {
              userButtonPopoverActionButton__manageAccount: { display: "none" },
              userButtonPopoverActionButton__signOut: { display: "none" },
            },
          }}
        >
          <UserButton.MenuItems>
            <UserButton.Action
              label="Cài đặt tài khoản"
              labelIcon={<SettingsIcon className="size-4" />}
              onClick={() => clerk.openUserProfile()}
            />
            <UserButton.Link
              label="Hồ sơ của tôi"
              href="/users/current"
              labelIcon={<UserIcon className="size-4" />}
            />
            <UserButton.Link
              label="Studio"
              href="/studio"
              labelIcon={<ClapperboardIcon className="size-4" />}
            />
            <UserButton.Action
              label={`Giao diện: ${resolvedTheme === "dark" ? "Tối" : "Sáng"}`}
              labelIcon={
                resolvedTheme === "dark" ? (
                  <MoonIcon className="size-4" />
                ) : (
                  <SunIcon className="size-4" />
                )
              }
              onClick={() => {
                const isDark = document.documentElement.classList.contains("dark");
                setTheme(isDark ? "light" : "dark");
              }}
            />
            <UserButton.Action
              label="Đăng xuất"
              labelIcon={<LogOutIcon className="size-4" />}
              onClick={() => clerk.signOut()}
            />
          </UserButton.MenuItems>
        </UserButton>
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
