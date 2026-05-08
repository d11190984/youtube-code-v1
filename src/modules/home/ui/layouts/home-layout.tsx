import { SidebarProvider } from "@/components/ui/sidebar";

import { HomeNavbar } from "../components/home-navbar";
import { HomeSidebar } from "../components/home-sidebar";
import { GlobalPlayer } from "@/modules/videos/ui/components/global-player";

interface HomeLayoutProps {
  children: React.ReactNode;
};

export const HomeLayout = ({ children }: HomeLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="w-full h-screen overflow-hidden flex flex-col relative">
        <HomeNavbar />
        <div className="flex flex-1 pt-16 overflow-hidden">
          <HomeSidebar />
          <main id="main-scroll-container" className="flex-1 overflow-y-auto bg-background">
            {children}
          </main>
        </div>
        <GlobalPlayer />
      </div>
    </SidebarProvider>
  );
};

