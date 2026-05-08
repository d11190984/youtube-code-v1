import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

import { TRPCProvider } from "@/trpc/client";
import { Toaster } from "@/components/ui/sonner";
import { ScrollToTopCharacter } from "@/components/scroll-to-top";

import { ThemeProvider } from "@/components/theme-provider";
import ClickEffect from "@/components/ui/ClickEffect";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "YouTube",
  description: "Trang web video của chủ nhân-sama",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/favicon.ico" />
        </head>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
          >
            <div className="fixed inset-0 -z-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-100/50 via-white to-white dark:from-neutral-900/50 dark:via-black dark:to-black pointer-events-none" />
            <TRPCProvider>
              <Toaster />
              <ClickEffect imageSrc="/toTop.Cuiv4RfP.svg">{children}</ClickEffect>
              <ScrollToTopCharacter />
            </TRPCProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
 
