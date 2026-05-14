"use client";

import { useLocale, useTranslations } from "next-intl";
import { BellIcon, Trash2Icon, CheckCheckIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS, ja, ko, zhCN, es, fr, de } from "date-fns/locale";
import { useRouter } from "@/i18n/routing";

import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { ErrorFallback } from "@/components/error-fallback";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";

const locales: Record<string, any> = {
  vi,
  en: enUS,
  ja,
  ko,
  zh: zhCN,
  es,
  fr,
  de,
};

export const NotificationsSection = () => {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <Suspense fallback={<NotificationsSectionSkeleton />}>
        <NotificationsSectionSuspense />
      </Suspense>
    </ErrorBoundary>
  );
};

const NotificationsSectionSkeleton = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 border rounded-xl flex gap-4">
            <Skeleton className="size-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const NotificationsSectionSuspense = () => {
  const locale = useLocale();
  const t = useTranslations("Notifications");
  const router = useRouter();
  const utils = trpc.useUtils();
  
  const [notificationsQuery, query] = trpc.notifications.getMany.useSuspenseInfiniteQuery(
    { limit: 10 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  const markAllAsRead = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.getUnreadCount.invalidate();
      utils.notifications.getMany.invalidate();
    },
  });

  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.getUnreadCount.invalidate();
      utils.notifications.getMany.invalidate();
    },
  });

  const remove = trpc.notifications.remove.useMutation({
    onSuccess: () => {
      utils.notifications.getMany.invalidate();
    },
  });

  const handleNotificationClick = (id: string, type: string, videoId?: string | null, postId?: string | null) => {
    markAsRead.mutate({ id });
    
    if (videoId) {
      router.push(`/videos/${videoId}`);
    } else if (postId) {
      router.push(`/posts/${postId}`);
    }
  };

  const notifications = notificationsQuery.pages.flatMap((page) => page.items);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <BellIcon className="size-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold">{t("yourNotifications")}</h1>
        </div>
        {notifications.length > 0 && (
          <Button 
            variant="outline" 
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            <CheckCheckIcon className="size-4 mr-2" />
            {t("markAsRead")}
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-3xl bg-muted/10 border-muted-foreground/20">
          <div className="p-4 bg-muted rounded-full mb-4">
            <BellIcon className="size-12 text-muted-foreground/50" />
          </div>
          <h2 className="text-xl font-semibold">{t("noNotifications")}</h2>
          <p className="text-muted-foreground mt-2 max-w-[400px]">
            {t("noNotificationsDesc")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border rounded-xl flex gap-4 transition-all hover:border-blue-500/50 group relative ${
                !notification.isRead ? "bg-blue-50/30 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/50" : "bg-card border-border"
              }`}
            >
              <UserAvatar 
                imageUrl={notification.actor.imageUrl} 
                name={notification.actor.name} 
                className="size-12 flex-shrink-0 cursor-pointer"
                onClick={() => router.push(`/users/${notification.actor.id}`)}
              />
              <div className="flex-1 min-w-0">
                <div 
                  className="cursor-pointer"
                  onClick={() => handleNotificationClick(notification.id, notification.type, notification.videoId, notification.postId)}
                >
                  <p className="text-lg leading-snug">
                    <span className="font-bold hover:underline">{notification.actor.name}</span>{" "}
                    {t(notification.type as any) || t("default")}
                  </p>
                  {notification.video && (
                    <p className="text-sm text-muted-foreground mt-1 font-medium truncate">
                      Video: {notification.video.title}
                    </p>
                  )}
                  {notification.comment && (notification.comment.value || notification.comment.imageUrl) && (
                    <div className="mt-1 bg-muted/50 p-2 rounded-lg border-l-4 border-blue-500 flex flex-col gap-1.5">
                      {notification.comment.value && (
                        <p className="text-sm text-muted-foreground italic">
                          "{notification.comment.value}"
                        </p>
                      )}
                      {notification.comment.imageUrl && (
                         <div className="mt-1 relative h-32 w-48 rounded-lg overflow-hidden border border-border">
                           <img 
                             src={notification.comment.imageUrl} 
                             alt="Comment image" 
                             className="object-cover w-full h-full"
                           />
                         </div>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(notification.createdAt, { addSuffix: true, locale: locales[locale] || enUS })}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove.mutate({ id: notification.id });
                  }}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
              
              {!notification.isRead && (
                <div className="absolute top-4 right-4 size-2.5 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
              )}
            </div>
          ))}
          
          <InfiniteScroll
            hasNextPage={query.hasNextPage}
            isFetchingNextPage={query.isFetchingNextPage}
            fetchNextPage={query.fetchNextPage}
          />
        </div>
      )}
    </div>
  );
};
