import { enUS, viVN } from "@clerk/localizations";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { ScrollToTopCharacter } from "@/components/scroll-to-top";
import { Toaster } from "@/components/ui/sonner";
import { GlobalPlayer } from "@/modules/videos/ui/components/global-player";
import { TRPCProvider } from "@/trpc/client";

import { ThemeProvider } from "@/components/theme-provider";
import ClickEffect from "@/components/ui/ClickEffect";
import { routing } from '@/i18n/routing';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import "../globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "YouTube",
  description: "YouTube clone project", // Default fallback
  manifest: "/manifest.json",
};

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}>) {
  const {locale} = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();
  const localization = locale === "vi" ? viVN : enUS;

  return (
    <ClerkProvider localization={localization as any} afterSignOutUrl="/">
      <html lang={locale} suppressHydrationWarning>
        <head>
          <link rel="icon" href="/favicon.ico" />
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#ff0000" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Hayase Yuuka" />
        </head>
        <body className={`${inter.className} h-full overflow-hidden`} suppressHydrationWarning>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
          >
            <div className="fixed inset-0 -z-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-100/50 via-white to-white dark:from-neutral-900/50 dark:via-black dark:to-black pointer-events-none" />
            <TRPCProvider>
              <NextIntlClientProvider messages={messages}>
                <Toaster />
                <ClickEffect>{children}</ClickEffect>
                <ScrollToTopCharacter />
                <GlobalPlayer />
              </NextIntlClientProvider>
            </TRPCProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
 
