import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const handleI18nRouting = createMiddleware(routing);

const isProtectedRoute = createRouteMatcher([
  "/:locale/studio(.*)",
  "/:locale/subscriptions",
  "/:locale/feed/subscribed",
  "/:locale/playlists(.*)"
]);

export default clerkMiddleware(async (auth, req) => {
  // 1. Kiểm tra bảo mật cho các route cần đăng nhập
  if (isProtectedRoute(req)) await auth.protect();
  
  // 2. Bỏ qua đa ngôn ngữ cho các yêu cầu API và TRPC
  if (
    req.nextUrl.pathname.startsWith('/api') || 
    req.nextUrl.pathname.startsWith('/trpc') ||
    req.nextUrl.pathname.includes('.')
  ) {
    return;
  }

  // 3. Xử lý đa ngôn ngữ cho các trang giao diện
  return handleI18nRouting(req);
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    // match i18n
    '/(vi|en|ja|ko|zh|es|fr|de)/:path*'
  ],
};