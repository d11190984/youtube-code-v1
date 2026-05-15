"use client";

import { SignedIn } from "@clerk/nextjs"

import { Separator } from "@/components/ui/separator"
import { Sidebar, SidebarContent } from "@/components/ui/sidebar"
import { useIsOnline } from "@/hooks/use-is-online"

import { MainSection } from "./main-section"
import { TrendingSection } from "./trending-section"
import { PersonalSection } from "./personal-section"
import { SubscriptionsSection } from "./subscriptions-section"

export const HomeSidebar = () => {
  const isOnline = useIsOnline();

  return (
    <Sidebar className="pt-16 z-40 border-none" collapsible="icon">
      <SidebarContent className="bg-background">
        {isOnline && (
          <>
            <MainSection />
            <Separator />
            <TrendingSection />
            <Separator />
          </>
        )}
        <PersonalSection />
        {isOnline && (
          <SignedIn>
            <>
              <Separator />
              <SubscriptionsSection />
            </>
          </SignedIn>
        )}
      </SidebarContent>
    </Sidebar>
  )
}